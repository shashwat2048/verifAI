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
    - signals: object (key-value pairs of specific artifacts found, e.g., "lighting": "inconsistent", "eyes": "asymmetric")
    
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
        if (user.role !== 'pro') {
          await db.user.update({
            where: { id: user.id },
            data: { analysesDone: { increment: 1 } }
          });
        }
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



