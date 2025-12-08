import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7: move datasource URL out of schema.prisma into prisma.config.ts
export default defineConfig({
  // The current PrismaConfig type may not list `datasource` yet, but the
  // runtime supports it in Prisma 7 for configuring the DB URL.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});


