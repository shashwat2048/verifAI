import { getAuth } from "@clerk/nextjs/server";
import db from "@/services/prisma";

export const runtime = "nodejs";

// Simple endpoint to ensure the currently signed-in Clerk user
// has a corresponding record in the VerifAI database.
export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name: string | null | undefined = body?.name;
    const email: string | null | undefined = body?.email;

    await db.user.upsert({
      where: { clerkId: userId },
      update: {
        name: typeof name === "string" && name.trim() ? name.trim().slice(0, 80) : undefined,
        email: typeof email === "string" && email.trim() ? email.trim() : undefined,
      },
      create: {
        clerkId: userId,
        email: (typeof email === "string" && email.trim() ? email.trim() : `${userId}@example.com`),
        name: (typeof name === "string" && name.trim() ? name.trim().slice(0, 80) : "User"),
      },
    });

    return Response.json({ success: true, message: "User synced" });
  } catch (err: any) {
    console.error("/api/users/sync error", err);
    return Response.json(
      { success: false, message: err?.message || "Failed to sync user" },
      { status: 500 },
    );
  }
}





