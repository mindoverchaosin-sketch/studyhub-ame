import "dotenv/config";
import { defineConfig } from "@prisma/config";

// Prisma 7+ expects datasource connection URLs to be provided via a config file
// (prisma.config.ts) or programmatically. Runtime Prisma Client stays on
// DATABASE_URL, while Prisma CLI/migration operations prefer a direct Neon
// connection via DIRECT_URL when available.

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
