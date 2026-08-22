#!/usr/bin/env node
/**
 * Kompletné nastavenie env: secrets → lokálny .env → Vercel + GitHub.
 * Usage: npm run env:bootstrap
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const secretsPath = join(root, ".deploy-secrets");

function run(label, args) {
  console.log(`\n→ ${label}`);
  const result = spawnSync("npm", args, { stdio: "inherit", cwd: root, shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(secretsPath)) {
  run("Generujem .deploy-secrets", ["run", "secrets:generate"]);
}

run("Lokálny .env", ["run", "env:setup"]);
run("Sync Vercel + GitHub", ["run", "vercel:env"]);

console.log("\n✓ Env bootstrap hotový.");
console.log("  WebMCP setup: npm run webmcp:setup");
console.log("  Deploy:       npm run vercel:deploy");
