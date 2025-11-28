import { GraphQLError } from "graphql";
import db from "@/services/prisma";

type Auth = { userId?: string } | undefined;

export type Role = "free" | "pro";

export async function enforceAnalyzeQuota(req: Request, auth: Auth): Promise<{ role: Role; remaining: number | null }> {
  // Always allow access (unlimited)
  return { role: "pro", remaining: null };
}


