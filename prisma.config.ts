import "dotenv/config";
import { defineConfig } from "prisma/config";

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const isRemoteBuild = Boolean(process.env.VERCEL || process.env.CI);
  if (isRemoteBuild) {
    throw new Error(
      "DATABASE_URL is required for Prisma in CI/Vercel builds. Sync preview env: npm run vercel:env"
    );
  }

  return "postgresql://user:password@localhost:5433/bazos_monitor?schema=public";
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
