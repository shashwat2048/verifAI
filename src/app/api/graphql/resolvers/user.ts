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

        const prompt = `You are a world-class digital forensics expert. Analyze this image for signs of AI generation or deepfake manipulation.
        
        Look for:
        - Inconsistent lighting or shadows
        - Unnatural skin textures or hair rendering
        - Asymmetries in eyes, ears, or accessories
        - Background anomalies or warping
        - Metadata inconsistencies (if visible)
        
        Return a JSON object with:
        - isDeepfake: boolean (true if likely AI-generated/manipulated)
        - confidence: number (0-100, representing your certainty)
        - explanation: string (concise explanation of your findings)
        
        Return ONLY valid JSON.`;

        const ai = new GoogleGenAI({ apiKey });

        const modelsToTry = [
            process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
            'gemini-1.5-pro',
            'gemini-1.5-flash'
        ];

        let resp: any = null;
        let lastError: any = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying Gemini model: ${modelName}`);
                const model = ai.models.generateContent({
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
                    config: { temperature: 0, responseMimeType: "application/json" },
                } as any);

                resp = await model;
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

        const text = (resp as any).text || JSON.stringify(resp);

        let parsed: any = {};
        try { parsed = JSON.parse(text); } catch { parsed = { isDeepfake: false, confidence: 0, explanation: "Failed to parse result" }; }

        const isDeepfake = parsed.isDeepfake || false;
        const confidence = parsed.confidence || 0;
        const explanation = parsed.explanation || "";

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