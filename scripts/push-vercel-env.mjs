#!/usr/bin/env node
/**
 * Sync .deploy-secrets → Vercel production + preview env (bez bash source — tokeny s + / = zostanú intact).
 * Usage: node scripts/push-vercel-env.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const secretsPath = join(root, ".deploy-secrets");
const VERCEL_SCOPE = process.env.VERCEL_SCOPE ?? "h4ck3d";
const VERCEL_PROJECT = "bazos-monitor";

const VERCEL_KEYS = [
  "DATABASE_URL",
  "CRON_SECRET",
  "MISTRAL_API_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN",
];

export function parseDeploySecrets(filePath) {
  const vars = new Map();
  if (!existsSync(filePath)) return vars;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    vars.set(key, value);
  }

  return vars;
}

function run(cmd, args, input) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    input,
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"],
  });
  return result.status ?? 1;
}

function linkVercel() {
  console.log(`Linking Vercel project (scope: ${VERCEL_SCOPE})...`);
  const link = run("vercel", [
    "link",
    "--yes",
    "--scope",
    VERCEL_SCOPE,
    "--project",
    VERCEL_PROJECT,
  ]);
  if (link !== 0) {
    run("vercel", ["link", "--yes", "--scope", VERCEL_SCOPE]);
  }
}

function pushEnv(name, value, targets = ["production"]) {
  if (!value) {
    console.log(`  skip ${name} (empty)`);
    return 0;
  }

  let lastStatus = 0;
  for (const target of targets) {
    let status = run(
      "vercel",
      ["env", "add", name, target, "--force", "--scope", VERCEL_SCOPE],
      value
    );
    if (status !== 0) {
      status = run(
        "vercel",
        ["env", "add", name, target, "--scope", VERCEL_SCOPE],
        value
      );
    }

    if (status === 0) {
      console.log(`  set ${name} (${target})`);
    } else {
      lastStatus = status;
    }
  }

  return lastStatus;
}

const VERCEL_ENV_TARGETS = ["production", "preview"];

function syncGitHub(vars) {
  const cronSecret = vars.get("CRON_SECRET");
  const productionUrl =
    vars.get("PRODUCTION_URL") ?? "https://bazos-monitor.vercel.app";

  const ghCheck = spawnSync("which", ["gh"], { encoding: "utf8" });
  if (ghCheck.status !== 0) {
    console.log("  skip GitHub (gh CLI not found)");
    return;
  }

  if (cronSecret) {
    run("gh", ["secret", "set", "CRON_SECRET", "--body", cronSecret]);
  }
  run("gh", ["secret", "set", "PRODUCTION_URL", "--body", productionUrl]);
  console.log("  set CRON_SECRET + PRODUCTION_URL on GitHub");
}

function main() {
  if (!existsSync(secretsPath)) {
    console.error("Missing .deploy-secrets — run: npm run secrets:generate");
    process.exit(1);
  }

  const vars = parseDeploySecrets(secretsPath);
  linkVercel();

  console.log("Syncing Vercel production + preview env from .deploy-secrets...");
  let failed = false;
  for (const key of VERCEL_KEYS) {
    const status = pushEnv(key, vars.get(key) ?? "", VERCEL_ENV_TARGETS);
    if (status !== 0) failed = true;
  }

  console.log("Syncing GitHub Actions secrets...");
  syncGitHub(vars);

  if (failed) {
    console.error("Some Vercel env vars failed to sync.");
    process.exit(1);
  }

  console.log("Done. Redeploy for env changes: npm run vercel:deploy");
}

import { fileURLToPath } from "node:url";

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  main();
}
