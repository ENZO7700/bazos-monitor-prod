import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Placeholder for `prisma generate` when DATABASE_URL is unset (e.g. Vercel preview). */
const PRISMA_BUILD_PLACEHOLDER_URL =
  "postgresql://user:password@localhost:5433/bazos_monitor?schema=public";

function resolveDatabaseUrl() {
  return process.env.DATABASE_URL ?? PRISMA_BUILD_PLACEHOLDER_URL;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
