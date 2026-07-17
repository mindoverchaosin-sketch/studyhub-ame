import "dotenv/config";
import { defineConfig } from "@prisma/config";

// Prisma 7+ expects datasource connection URLs to be provided via a config file
// (prisma.config.ts) or programmatically. This file reads DATABASE_URL from the
// environment (loaded from .env by dotenv) and supplies it to the Prisma CLI
// and runtime via the config API.

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  // The datasource URL is provided to Prisma via the DATABASE_URL environment variable
  // Read from .env file via dotenv/config import above
  migrations: {
  seed: "tsx prisma/seed.ts",
  },
});
