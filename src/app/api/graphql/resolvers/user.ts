import db from "@/services/prisma"
import { uploadImageBase64 } from "@/services/cloudinary"
import { getAuth } from "@clerk/nextjs/server"
import { verifyToken } from "@/services/jwt"
import { GoogleGenAI } from "@google/genai";

export async function me(_: any, __: any, context: { auth?: { userId?: string } }) {
    try {
        const clerkId = context?.auth?.userId;
        if (!clerkId) return null;

        const user = await db.user.findUnique({
            where: { clerkId },
        });

        return user;
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getUser(_: any, args: {
    clerkId: string
}) {
    try {
        const { clerkId } = args;
        const user = await db.user.findUnique({
            where: {
                clerkId
            }
        })
        if (!user) {
            return null;
        }
        return user;
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function updateUser(_: any, args: {
    id: string,
    name: string,
}, __: any, context: { auth?: { userId?: string } }) {
    try {
        const clerkId = context?.auth?.userId;
        if (!clerkId) {
            return { success: false, message: "Unauthorized" };
        }
        const current = await db.user.findUnique({ where: { clerkId } });
        if (!current || current.id !== args.id) {
            return { success: false, message: "invalid action" };
        }
        const user = await db.user.update({
            where: {
                id: args.id
            },
            data: {
                name: args.name,
            }
        })
        if (!user) {
            return { success: false, message: "Failed to update user" };
        }
        return { success: true, message: "User updated successfully" };
    } catch (err) {
        console.error(err);
        return {
            success: false,
            message: "Failed to update user"
        };
    }
}

export async function getProfile(_: any, __: any, context: { auth?: { userId?: string } }) {
    try {
        const clerkId = context?.auth?.userId;
        if (!clerkId) return null;
        const user = await db.user.findUnique({ where: { clerkId } });
        if (!user) return null;
        return {
            name: user.name,
        };
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function createOrUpdateProfile(
    _: any,
    __: any,
    ___: any,
    context: { auth?: { userId?: string } }
) {
    try {
        const clerkId = context?.auth?.userId;
        if (!clerkId) {
            return { success: false, message: "Unauthorized" };
        }
        const existing = await db.user.findUnique({ where: { clerkId } });

        if (!existing) {
            await db.user.create({
                data: {
                    clerkId,
                    email: `${clerkId}@example.com`,
                    name: "User",
                }
            });
        }
        return { success: true, message: "Profile saved" };
    } catch (err) {
        console.error(err);
        return { success: false, message: "Failed to save profile" };
    }
}

export async function updateUserProfile(
    _: any,
    args: { name?: string | null },
    __: any,
    context: { auth?: { userId?: string }; req?: Request }
) {
    try {
        let clerkId = context?.auth?.userId;
        if (!clerkId) {
            try {
                const cookie = (context as any)?.req?.headers?.get('cookie') || '';
                const match = cookie.match(/(?:^|; )token=([^;]+)/);
                const raw = match ? decodeURIComponent(match[1]) : null;
                if (raw) {
                    const t = verifyToken(raw);
                    if (t?.id) clerkId = t.id;
                }
            } catch { }
        }
        if (!clerkId) return { success: false, message: "Unauthorized" };
        const data: any = {};
        if (typeof args.name !== 'undefined' && args.name !== null) data.name = String(args.name).trim().slice(0, 80);

        // Ensure user exists; create if missing (use webhook in prod but safe-guard here)
        const existing = await db.user.findUnique({ where: { clerkId } });
        if (!existing) {
            await db.user.create({
                data: {
                    clerkId,
                    email: `${clerkId}@example.com`,
                    name: data.name || "User",
                    ...data,
                },
            });
        } else {
            await db.user.update({ where: { clerkId }, data });
        }
        return { success: true, message: "Profile updated" };
    } catch (err) {
        console.error(err);
        return { success: false, message: "Failed to update profile" };
    }
}

export async function analyzeLabel(
    _: any,
    args: { imageBase64: string },
    context: { req?: Request, auth?: { userId?: string } }
) {
    try {
        const base64 = args.imageBase64;
        if (!base64) return null;

        // 1) Upload to Cloudinary (store copy)
        const uploaded = await uploadImageBase64(base64, 'verifai');
        const imageUrl = uploaded.secureUrl;

        // Prepare base64 for Gemini inlineData
        const isDataUrl = base64.startsWith('data:');
        const mimeFromInput = isDataUrl ? base64.substring(5, base64.indexOf(';')) : (uploaded.format ? `image/${uploaded.format}` : 'image/jpeg');
        const pureBase64 = isDataUrl ? base64.split('base64,')[1] : base64;

        // 2) Call Gemini
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Missing API Key');

        const prompt = `
You are VerifAI, a world-class digital forensics system.
Given a single image, determine whether it is likely a deepfake or AI-generated/manipulated image.

Carefully inspect:
- Lighting and shadows consistency
- Skin texture, hair, eyes, teeth, and facial symmetry
- Background warping, doubled edges, or other artifacts
- Inconsistencies between subject and background
- Any obvious signs of image compositing or cloning

Decide:
- "isDeepfake": true  → if the image is likely AI-generated or manipulated.
- "isDeepfake": false → if the image appears to be a real, unedited photo.

Also compute:
- "confidence": a number from 0 to 100, where:
  - 0–39  = very low confidence
  - 40–69 = medium confidence
  - 70–100 = high confidence
- "explanation": a short human-readable sentence explaining *why* you reached this conclusion.

Respond with ONLY a valid JSON object, no markdown, no backticks, no extra text.
The JSON must have EXACTLY these keys:
{
  "isDeepfake": boolean,
  "confidence": number,
  "explanation": string
}
`;

        const ai = new GoogleGenAI({ apiKey });

        // Prefer a single, explicitly configured model; fall back to Gemini 2.5 Flash.
        // Stable model id per docs: "gemini-2.5-flash" ([link](https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash)).
        const modelsToTry = [
            process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
        ];

        let resp: any = null;
        let lastError: any = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying Gemini model: ${modelName}`);
                resp = await ai.models.generateContent({
                    model: modelName,
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: prompt },
                                { inlineData: { mimeType: mimeFromInput || 'image/jpeg', data: pureBase64 } },
                            ],
                        },
                    ],
                    generationConfig: { temperature: 0, responseMimeType: "application/json" },
                } as any);
                if (resp) break; // Success
            } catch (e: any) {
                console.warn(`Model ${modelName} failed:`, e?.message || e);
                lastError = e;
                // Continue to next model on 404 (Not Found) or 429 (Rate Limit)
                if (e.status === 404 || e.status === 429) continue;
                // For other errors, maybe we should still try others? 
                // Let's be robust and try others.
            }
        }

        if (!resp) {
            throw lastError || new Error("All Gemini models failed");
        }

        // Log the raw response for debugging
        try {
            console.log("Gemini raw response:", JSON.stringify((resp as any).response ?? resp, null, 2));
        } catch {
            console.log("Gemini raw response (stringified fallback):", String(resp));
        }

        // Extract text from the SDK response
        let text: string;
        try {
            const anyResp: any = resp;
            if (anyResp?.response?.text) {
                text = anyResp.response.text();
            } else if (typeof anyResp.text === "function") {
                text = anyResp.text();
            } else if (typeof anyResp.text === "string") {
                text = anyResp.text;
            } else {
                text = JSON.stringify(anyResp);
            }
        } catch (e) {
            console.warn("Failed to extract text from Gemini response, falling back to JSON stringify:", e);
            text = JSON.stringify(resp);
        }

        console.log("Gemini raw text:", text);

        let parsed: any = {};
        try {
            // Many models still wrap JSON in ```json ... ``` fences; strip them if present.
            let toParse = text.trim();
            const fenceMatch = toParse.match(/```(?:json)?\s*([\s\S]*?)```/i);
            if (fenceMatch && fenceMatch[1]) {
                toParse = fenceMatch[1].trim();
            } else {
                // Fallback: try to grab the first { ... } block
                const objMatch = toParse.match(/\{[\s\S]*\}/);
                if (objMatch && objMatch[0]) {
                    toParse = objMatch[0];
                }
            }

            parsed = JSON.parse(toParse);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", e, "text was:", text);
            parsed = { isDeepfake: false, confidence: 0, explanation: "Failed to parse result" };
        }

        console.log("Gemini parsed JSON:", parsed);

        const isDeepfake = Boolean(parsed.isDeepfake);
        const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;
        const explanation = typeof parsed.explanation === "string" ? parsed.explanation : "";

        // 3) Save scan
        const userId = context?.auth?.userId;
        let saved = false;
        let scanId: string | null = null;
        try {
            if (userId) {
                const user = await db.user.findUnique({ where: { clerkId: userId } });
                if (user) {
                    const r = await db.scan.create({
                        data: {
                            userId: user.id,
                            mediaType: "image",
                            imageUrl: imageUrl,
                            isDeepfake,
                            confidence,
                            explanation,
                            rawResponse: parsed,
                        }
                    })
                    saved = true;
                    scanId = r.id;
                    // increment analysesDone if user is on free plan

                }
            }
        } catch (e) { console.error(e); }

        return {
            imageUrl,
            isDeepfake,
            confidence,
            explanation,
            saved,
            scanId,
        }
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function analyzeText(
    _: any,
    args: { input: string },
    context: { req?: Request, auth?: { userId?: string } }
) {
    try {
        const inputRaw = (args.input || "").trim();
        if (!inputRaw) throw new Error("No text provided");

        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Missing API Key');

        const prompt = `
You are an AI-text detector. Analyze the following text and determine the likelihood that it was written by an AI model.

TEXT TO ANALYZE:

${inputRaw.slice(0, 8000)}

Your tasks:
1. Provide a probability score from 0 to 100 of the text being AI-generated. 
2. Briefly explain which linguistic or structural patterns led to your conclusion.
3. Return the result ONLY in the following JSON format:

{
  "ai_probability": <number>,
  "explanation": "<short explanation>"
}

Rules:
- Be strict but fair. 
- Do not rewrite the text.
- Do not include anything outside the JSON format.
`;

        const ai = new GoogleGenAI({ apiKey });
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

        console.log(`Trying Gemini text model: ${modelName}`);
        const resp = await ai.models.generateContent({
            model: modelName,
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: { temperature: 0, responseMimeType: "application/json" },
        } as any);

        // Log the raw response for debugging
        try {
            console.log("Gemini text raw response:", JSON.stringify((resp as any).response ?? resp, null, 2));
        } catch {
            console.log("Gemini text raw response (stringified fallback):", String(resp));
        }

        // Extract text from the SDK response
        let text: string;
        try {
            const anyResp: any = resp;
            if (anyResp?.response?.text) {
                text = anyResp.response.text();
            } else if (typeof anyResp.text === "function") {
                text = anyResp.text();
            } else if (typeof anyResp.text === "string") {
                text = anyResp.text;
            } else {
                text = JSON.stringify(anyResp);
            }
        } catch (e) {
            console.warn("Failed to extract text from Gemini TEXT response, falling back to JSON stringify:", e);
            text = JSON.stringify(resp);
        }

        console.log("Gemini text raw text:", text);

        let parsed: any = {};
        try {
            let toParse = text.trim();
            const fenceMatch = toParse.match(/```(?:json)?\s*([\s\S]*?)```/i);
            if (fenceMatch && fenceMatch[1]) {
                toParse = fenceMatch[1].trim();
            } else {
                const objMatch = toParse.match(/\{[\s\S]*\}/);
                if (objMatch && objMatch[0]) {
                    toParse = objMatch[0];
                }
            }
            parsed = JSON.parse(toParse);
        } catch (e) {
            console.error("Failed to parse Gemini TEXT JSON:", e, "text was:", text);
            parsed = { ai_probability: 0, explanation: "Failed to parse result" };
        }

        console.log("Gemini text parsed JSON:", parsed);

        const aiProbRaw = typeof parsed.ai_probability === "number" ? parsed.ai_probability : 0;
        const confidence = Math.max(0, Math.min(100, aiProbRaw));
        const isDeepfake = confidence >= 60; // treat 60%+ AI probability as likely deepfake text
        const explanation = typeof parsed.explanation === "string" ? parsed.explanation : "";

        // Save scan
        const userId = context?.auth?.userId;
        let saved = false;
        let scanId: string | null = null;
        try {
            if (userId) {
                const user = await db.user.findUnique({ where: { clerkId: userId } });
                if (user) {
                    const r = await db.scan.create({
                        data: {
                            userId: user.id,
                            mediaType: "text",
                            imageUrl: null,
                            isDeepfake,
                            confidence,
                            explanation,
                            rawResponse: parsed,
                        },
                    });
                    saved = true;
                    scanId = r.id;
                }
            }
        } catch (e) {
            console.error("Failed to save text scan:", e);
        }

        return {
            imageUrl: null,
            isDeepfake,
            confidence,
            explanation,
            saved,
            scanId,
        };
    } catch (err) {
        console.error("analyzeText error:", err);
        return null;
    }
}

export async function getReports(_: any, args: { clerkId: string }) {
    try {
        const user = await db.user.findUnique({ where: { clerkId: args.clerkId } });
        if (!user) return [];

        const rows = await db.scan.findMany({ where: { userId: user.id } });
        const mapped = rows.map(r => {
            return {
                id: r.id,
                isDeepfake: r.isDeepfake,
                confidence: r.confidence,
                explanation: r.explanation,
                createdAt: r.createdAt.toISOString(),
                imageUrl: r.imageUrl || null,
                rawResponse: JSON.stringify(r.rawResponse),
            };
        });
        return mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function myReports(_: any, __: any, context: { auth?: { userId?: string } }) {
    try {
        const clerkId = context?.auth?.userId;
        if (!clerkId) return [];
        const user = await db.user.findUnique({ where: { clerkId } });
        if (!user) return [];
        const rows = await db.scan.findMany({ where: { userId: user.id } });
        const mapped = rows.map(r => {
            return {
                id: r.id,
                isDeepfake: r.isDeepfake,
                confidence: r.confidence,
                explanation: r.explanation,
                createdAt: r.createdAt.toISOString(),
                imageUrl: r.imageUrl || null,
                rawResponse: JSON.stringify(r.rawResponse),
            };
        });
        return mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
        console.error(err);
        return [];
    }
}