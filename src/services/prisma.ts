import { PrismaClient } from "@prisma/client";

// Avoid creating multiple clients in dev / hot-reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;