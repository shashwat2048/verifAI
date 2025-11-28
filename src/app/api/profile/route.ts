import { getAuth, clerkClient } from "@clerk/nextjs/server";
import db from "@/services/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name: string | null | undefined = body?.name;

    const data: any = {};
    if (typeof name !== "undefined" && name !== null) {
      data.name = String(name).trim().slice(0, 80);
    }

    // Pull canonical name/email from Clerk for initial create
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const emailFromClerk =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      `${userId}@example.com`;
    const fullName = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();
    const nameFromClerk = fullName.length > 0 ? fullName : "User";

    const existing = await db.user.findUnique({ where: { clerkId: userId } });
    if (!existing) {
      await db.user.create({
        data: {
          clerkId: userId,
          email: emailFromClerk,
          name: data.name || nameFromClerk,
          ...data,
        },
      });
    } else {
      await db.user.update({ where: { clerkId: userId }, data });
    }

    return Response.json({ success: true, message: "Profile updated" });
  } catch (err: any) {
    console.error("/api/profile error", err);
    return Response.json({ success: false, message: err?.message || "Failed" }, { status: 500 });
  }
}


