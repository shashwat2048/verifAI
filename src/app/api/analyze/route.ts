export const runtime = "nodejs";
import { GoogleGenAI } from "@google/genai";
import db from "@/services/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { uploadImageBase64 } from "@/services/cloudinary";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No file" }), { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API Key" }), { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Upload to Cloudinary for persistence
    let imageUrl = null;
    try {
      const uploaded = await uploadImageBase64(base64, 'verifai');
      imageUrl = uploaded.secureUrl;
    } catch (e) {
      console.error("Cloudinary upload failed", e);
    }

    const prompt = `Strict forensic classifier for diffusion / AI-generated images. Users suffer false negatives when you label polished AI as real.

Rules: Do not certify "real" only because the image looks sharp or professional. Err toward isDeepfake when multiple subtle cues stack (hands/teeth/edges/lighting/optics/texture/text garbling). Major anatomy or reflection failure → synthetic.

Mental checklist (score weak cues across categories): anatomy & object interactions; diffusion-like texture smear; lighting vs shadows vs catchlights; depth-of-field plausibility; edge halos & background bleed; garbled text/signs; "catalog-perfect" hyper-real scenes without plausible camera microtexture.

Return ONLY valid JSON:
{
  "isDeepfake": boolean,
  "confidence": number,
  "explanation": string,
  "signals": object
}

- isDeepfake: true if likely AI/diffusion/generative composite; false only if clearly one authentic capture with no meaningful synthesis cues.
- confidence: 0-100; stacked subtleties can justify 60-80.
- explanation: concrete regions + artifact types.
- signals: key-value map (e.g. "texture": "waxy_smear", "lighting": "catchlight_mismatch").`;


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
                { inlineData: { mimeType: 'image/jpeg', data: base64 } },
              ],
            },
          ],
          config: { temperature: 0, responseMimeType: "application/json" },
        } as any);

        resp = await model;
        if (resp) break;
      } catch (e: any) {
        console.warn(`Model ${modelName} failed:`, e?.message || e);
        lastError = e;
        if (e.status === 404 || e.status === 429) continue;
      }
    }

    if (!resp) {
      throw lastError || new Error("All Gemini models failed");
    }

    const text = (resp as any).text || JSON.stringify(resp);

    let result: any = {};
    try {
      result = JSON.parse(text);
    } catch {
      // Fallback if JSON parsing fails
      result = { isDeepfake: false, confidence: 0, explanation: "Failed to parse analysis result." };
    }

    // Save to DB if user is logged in
    const { userId } = getAuth(req as any);
    let saved = false;
    let scanId = null;

    if (userId) {
      const user = await db.user.findUnique({ where: { clerkId: userId } });
      if (user) {
        const scan = await db.scan.create({
          data: {
            userId: user.id,
            mediaType: "image",
            imageUrl: imageUrl,
            isDeepfake: result.isDeepfake,
            confidence: result.confidence,
            explanation: result.explanation,
            rawResponse: result,
          }
        });
        saved = true;
        scanId = scan.id;

        // Increment usage
        await db.user.update({
          where: { id: user.id },
          data: { analysesDone: { increment: 1 } }
        });
      }
    }

    return new Response(JSON.stringify({ ...result, saved, scanId, imageUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { status: 500 });
  }
}



