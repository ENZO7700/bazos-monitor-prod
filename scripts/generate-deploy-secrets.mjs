#!/usr/bin/env node
/**
 * Generates production secrets into .deploy-secrets (gitignored).
 * Usage: node scripts/generate-deploy-secrets.mjs
 */
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const cronSecret = randomBytes(32).toString("base64");
const vapid = spawnSync("npx", ["web-push", "generate-vapid-keys"], {
  encoding: "utf8",
  shell: true,
});

if (vapid.status !== 0) {
  console.error("Failed to generate VAPID keys");
  process.exit(1);
}

const publicMatch = vapid.stdout.match(/Public Key:\s*(\S+)/);
const privateMatch = vapid.stdout.match(/Private Key:\s*(\S+)/);

if (!publicMatch || !privateMatch) {
  console.error("Could not parse VAPID keys");
  process.exit(1);
}

const contents = `# Auto-generated — DO NOT COMMIT
CRON_SECRET=${cronSecret}
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicMatch[1]}
VAPID_PRIVATE_KEY=${privateMatch[1]}
VAPID_SUBJECT=mailto:youh4ck3dme@users.noreply.github.com
PRODUCTION_URL=https://bazos-monitor.vercel.app
# NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN=  # Chrome origin trial — dopln po registrácii
`;

const outPath = join(process.cwd(), ".deploy-secrets");
writeFileSync(outPath, contents, { mode: 0o600 });
console.log(`Secrets written to ${outPath}`);
