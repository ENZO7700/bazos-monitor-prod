#!/usr/bin/env node
/**
 * Writes DATABASE_URL to .deploy-secrets without printing credentials.
 * Usage: node scripts/set-deploy-database.mjs "<connection-string>"
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const databaseUrl = process.argv[2];
if (!databaseUrl) {
  console.error("Missing DATABASE_URL argument");
  process.exit(1);
}

const outPath = join(process.cwd(), ".deploy-secrets");
let contents = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";

if (contents.includes("DATABASE_URL=")) {
  contents = contents.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${databaseUrl}`);
} else {
  contents += `${contents.endsWith("\n") || contents.length === 0 ? "" : "\n"}DATABASE_URL=${databaseUrl}\n`;
}

import { writeFileSync } from "node:fs";
writeFileSync(outPath, contents, { mode: 0o600 });
console.log("DATABASE_URL saved to .deploy-secrets");
