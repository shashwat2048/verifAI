import db from "@/services/prisma";
import { uploadImageBase64 } from "@/services/cloudinary";
import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { GraphQLError } from "graphql";
import { verifyToken } from "@/services/jwt";
import { GoogleGenAI } from "@google/genai";

/**
 * Ensure there is a corresponding Prisma User row for the given Clerk user.
 * This is the central place that auto-provisions a user on first sign-in.
 */
async function ensureUserForClerkId(clerkId: string) {
  if (!clerkId) return null;
  try {
    // 1) Look up any existing DB user
    const existing = await db.user.findUnique({ where: { clerkId } });

    // 2) Try to hydrate from Clerk so we have real email + name
    let email = existing?.email || `${clerkId}@example.com`;
    let name = existing?.name || "User";

    try {
      // In the current Clerk Next.js SDK, `clerkClient` is a function that returns a ClerkClient.
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkId);
      const primaryEmail =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        ) || clerkUser.emailAddresses[0];

      if (primaryEmail?.emailAddress) {
        email = primaryEmail.emailAddress;
      }
      if (clerkUser.fullName || clerkUser.firstName) {
        name = (clerkUser.fullName || clerkUser.firstName || name).slice(0, 80);
      }
    } catch (e) {
      // If Clerk lookup fails for any reason, just fall back to synthetic values.
      console.warn("Failed to hydrate user from Clerk; using fallback values", e);
    }

    // 3) Create or gently update the DB record.
    //    We only overwrite "placeholder" values so we don't clobber user-edited names.
    if (!existing) {
      try {
        return await db.user.create({
          data: {
            clerkId,
            email,
            name,
          },
        });
      } catch (e: any) {
        // Handle race conditions / duplicates gracefully:
        // if another request just created the same user (by clerkId or email),
        // fall back to returning the existing record instead of throwing.
        if (e?.code === "P2002") {
          const byClerk = await db.user.findUnique({ where: { clerkId } });
          if (byClerk) return byClerk;
          const byEmail = await db.user.findFirst({ where: { email } });
          if (byEmail) return byEmail;
        }
        throw e;
      }
    }

    const needsEmailUpdate =
      !existing.email || existing.email.endsWith("@example.com");
    const needsNameUpdate =
      !existing.name || existing.name === "User";

    if (needsEmailUpdate || needsNameUpdate) {
      return await db.user.update({
        where: { clerkId },
        data: {
          email: needsEmailUpdate ? email : existing.email,
          name: needsNameUpdate ? name : existing.name,
        },
      });
    }

    return existing;
  } catch (err) {
    console.error("Failed to ensure user for Clerk ID", clerkId, err);
    return null;
  }
}

export async function me(_: any, __: any, context: { auth?: { userId?: string } }) {
  try {
    const clerkId = context?.auth?.userId;
    if (!clerkId) return null;

    // Auto-create the user record on first authenticated access.
    const user = await ensureUserForClerkId(clerkId);
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
        // Make sure there is always a backing user row.
        const current = await ensureUserForClerkId(clerkId);
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
        // Ensure the user exists; this covers first visits after sign-up.
        const user = await ensureUserForClerkId(clerkId);
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
        // Delegate to central helper so behaviour stays consistent.
        await ensureUserForClerkId(clerkId);
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
        const existing = await ensureUserForClerkId(clerkId);
        if (existing) {
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
You are a strict forensic classifier for AI-generated and diffusion-based synthetic imagery. Your users get false negatives when you default to "real" on polished or hyper-realistic pictures. **Err on the side of flagging synthesis** when evidence is mixed: multiple subtle cues together strongly outweigh one "clean-looking" impression.

**Hard rule — do not call an image real just because it looks sharp, professional, or pretty.** Stock photography can still be real; AI often looks like idealized stock. Ask: "Would a single camera/lens plausibly produce THIS combination of texture, optics, and micro-structure everywhere in frame?"

**Scoring habit:** Assign yourself a silent cue count across categories A–F below (major flaw = 2, minor suspicion = 1). If the total is **≥ 3** OR any **major** anatomical/optics failure exists → **isDeepfake: true** with confidence tied to how many categories fired. Prefer mid-high confidence (55–85) when several weak cues stack without one dramatic glitch.

**A. Anatomy & interaction (major when broken)**
Hands/fingers/toes, teeth rows, ear cartilage, eyelashes vs lids, lips/teeth boundary. Glasses arms crossing hair/skin, straps merging into flesh. Extra/fused/missing digits or teeth "too perfect" (identical pearl shapes in a row).

**B. Diffusion texture & detail coherence**
Uniform "waxy" skin; pore/detail that fades into noise at region boundaries; hair as fused ribbons/clumps with few isolated strands; fabric/weave that warps or repeats oddly; fur/feathers with painterly smear.

**C. Lighting & camera physics**
Shadow direction vs highlights disagree; missing ambient bounce or contact shadows; catchlights in eyes that don't match scene lights; reflections on metal/glass/water that look stamped on. Shallow DOF where blur ignores depth or cuts across one object illogically. **Too clean:** no plausible sensor noise/grain in shadows for a supposedly natural indoor/low-light shot (when such noise would normally appear).

**D. Edges & scene semantics**
Object halos, mushy segmentation, background bleeding into edges. Text/signage/logos garbled, swapped letters, or inconsistent spelling if readable. Architectural lines that bend or duplicate subtly.

**E. "Hyper-real stock" prior**
Faces or scenes that look like idealized catalog renders—perfect skin tone gradients, overly symmetrical styling, everything harmonized—**raise suspicion** unless optics and microtexture remain consistent with one real capture.

**F. Distinguish heavy retouching**
Beautifying a real photo rarely breaks finger count or physics of reflections. If flaws are structural/optical across regions, lean **synthetic**, not "retouched real".

Output JSON only (no markdown):

- "isDeepfake": boolean — **true** if likely AI/diffusion/composite-with-generative-fill style manipulation; **false** only when evidence clearly fits one authentic capture with no meaningful synthesis cues.
- "confidence": 0–100 (use the cue-stacking logic above; stacked subtleties justify 60–80).
- "explanation": 1–2 sentences citing **concrete** observations (body region + artifact type), not vague adjectives.

{
  "isDeepfake": boolean,
  "confidence": number,
  "explanation": string
}
`;

        const ai = new GoogleGenAI({ apiKey });

        // Try primary model first, then fallbacks when a tier is overloaded (e.g. 503) or unavailable.
        const preferred = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const fallbacks = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest",
            "gemini-pro-latest",
        ];
        const modelsToTry = [preferred, ...fallbacks.filter((m) => m !== preferred)];

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
            }
        }

        if (!resp) {
            const msg =
                lastError?.message ||
                (typeof lastError === "string" ? lastError : null) ||
                "All Gemini models failed";
            throw new GraphQLError(msg, { originalError: lastError });
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
    } catch (err: any) {
        console.error(err);
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError(err?.message || "Image analysis failed", { originalError: err });
    }
}

/** Persist an existing analysis to the DB without calling Gemini again (e.g. guest ran scan, then signed in). */
export async function saveAnalysisResult(
    _: any,
    args: {
        mediaType: string;
        imageUrl?: string | null;
        isDeepfake: boolean;
        confidence: number;
        explanation: string;
    },
    context: { req?: Request; auth?: { userId?: string } }
) {
    try {
        const clerkId = context?.auth?.userId;
        if (!clerkId) {
            throw new GraphQLError("Sign in to save scans to your account.");
        }

        const user = await ensureUserForClerkId(clerkId);
        if (!user) {
            throw new GraphQLError("Could not load your account.");
        }

        const mt = args.mediaType === "text" ? "text" : "image";
        const url = args.imageUrl?.trim() || null;
        if (mt === "image" && !url) {
            throw new GraphQLError("Missing image URL for this scan.");
        }

        const r = await db.scan.create({
            data: {
                userId: user.id,
                mediaType: mt,
                imageUrl: mt === "text" ? null : url,
                isDeepfake: Boolean(args.isDeepfake),
                confidence: typeof args.confidence === "number" ? args.confidence : 0,
                explanation: typeof args.explanation === "string" ? args.explanation : "",
                rawResponse: { source: "saveAnalysisResult" },
            },
        });

        return {
            imageUrl: mt === "text" ? null : url,
            isDeepfake: Boolean(args.isDeepfake),
            confidence: typeof args.confidence === "number" ? args.confidence : 0,
            explanation: typeof args.explanation === "string" ? args.explanation : "",
            saved: true,
            scanId: r.id,
        };
    } catch (err: any) {
        if (err instanceof GraphQLError) throw err;
        console.error("saveAnalysisResult error:", err);
        return null;
    }
}

export async function analyzeText(
    _: any,
    args: { input: string; factCheck?: boolean },
    context: { req?: Request, auth?: { userId?: string } }
) {
    try {
        const inputRaw = (args.input || "").trim();
        if (!inputRaw) throw new Error("No text provided");

        const factCheck = Boolean((args as any).factCheck);

        const apiKey = process.env.GEMINI_API_KEY_2 || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Missing API Key');
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];

        const prompt = factCheck
            ? `
You are TruthSeeker, an advanced AI fact-checking assistant.

### CONTEXT (CRITICAL)
Current Date: ${currentDate}
Use this date as the absolute reference point for all age calculations, timelines, and status checks.

### Your Task
Analyze the provided user claim and determine its factual accuracy relative to the "Current Date" provided above.

### Output Format
Respond ONLY with a valid JSON object (no markdown, no code fences).

{
  "claim": "The original claim.",
  "verdict": "True | False | Misleading | Unverified | Needs Context",
  "confidence_score": 0-100,
  "analysis": "Explain the verdict. If calculating age or time passed, explicitly show the math (e.g., 'Born 1950, Current Year 2025, so Age is 75').",
  "corrections": "Correct facts if verdict is False/Misleading.",
  "sources": ["List authoritative sources"]
}

### Input Claim

${inputRaw.slice(0, 8000)}
`
            : `
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
        const preferred = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const fallbacks = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest",
            "gemini-pro-latest",
        ];
        const modelsToTry = [preferred, ...fallbacks.filter((m) => m !== preferred)];

        let resp: any = null;
        let lastError: any = null;
        for (const modelName of modelsToTry) {
            try {
                console.log(
                    `Trying Gemini text model (${factCheck ? "fact-check" : "detection"}): ${modelName}`
                );
                resp = await ai.models.generateContent({
                    model: modelName,
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: { temperature: 0, responseMimeType: "application/json" },
                } as any);
                if (resp) break;
            } catch (e: any) {
                console.warn(`Text model ${modelName} failed:`, e?.message || e);
                lastError = e;
            }
        }

        if (!resp) {
            const msg =
                lastError?.message ||
                (typeof lastError === "string" ? lastError : null) ||
                "All Gemini models failed";
            throw new GraphQLError(msg, { originalError: lastError });
        }

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
            parsed = factCheck
                ? {
                    claim: inputRaw,
                    verdict: "Unverified",
                    confidence_score: 0,
                    analysis: "Failed to parse result",
                    corrections: null,
                    sources: [],
                }
                : { ai_probability: 0, explanation: "Failed to parse result" };
        }

        console.log("Gemini text parsed JSON:", parsed);

        let isDeepfake: boolean;
        let confidence: number;
        let explanation: string;

        if (factCheck) {
            const verdictRaw = typeof parsed.verdict === "string" ? parsed.verdict.trim() : "Unverified";
            const verdict = verdictRaw || "Unverified";
            const confRaw = typeof parsed.confidence_score === "number" ? parsed.confidence_score : 0;
            confidence = Math.max(0, Math.min(100, confRaw));

            const analysis = typeof parsed.analysis === "string" ? parsed.analysis : "";
            const corrections = typeof parsed.corrections === "string" ? parsed.corrections : "";

            const parts: string[] = [];
            parts.push(`Verdict: ${verdict}`);
            if (analysis) parts.push(analysis);
            if (corrections) parts.push(`Corrections: ${corrections}`);
            explanation = parts.join(" — ");

            // Treat clearly false/misleading claims as "deepfake-like" in UI; others as not.
            const lowerVerdict = verdict.toLowerCase();
            isDeepfake = lowerVerdict === "false" || lowerVerdict === "misleading";
        } else {
            const aiProbRaw = typeof parsed.ai_probability === "number" ? parsed.ai_probability : 0;
            confidence = Math.max(0, Math.min(100, aiProbRaw));
            isDeepfake = confidence >= 60; // treat 60%+ AI probability as likely AI-generated text
            explanation = typeof parsed.explanation === "string" ? parsed.explanation : "";
        }

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
    } catch (err: any) {
        console.error("analyzeText error:", err);
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError(err?.message || "Text analysis failed", { originalError: err });
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