#!/usr/bin/env node
/**
 * Nastaví NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN do .deploy-secrets, .env a Vercel.
 *
 * Registrácia tokenu (jednorazovo, web + Google login):
 *   npm run webmcp:register
 *
 * Kompletný flow (registrácia → env → Vercel → deploy → verify):
 *   npm run webmcp:setup
 *
 * Len uloženie tokenu:
 *   npm run webmcp:token -- "TvojOriginTrialToken..."
 *   echo "TvojToken" | npm run webmcp:token
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { join } from "node:path";
import {
  isThirdPartyOriginTrialToken,
  parseOriginTrialPayload,
} from "../src/lib/webmcp-token.ts";

const KEY = "NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN";
const REGISTER_URL =
  "https://developer.chrome.com/origintrials#/register_trial/4163014905550602241";
const DEFAULT_ORIGIN = "https://bazos-monitor.vercel.app";
const root = process.cwd();
const secretsPath = join(root, ".deploy-secrets");
const tokenFilePath = join(root, "tokenchrome.md");

function getExpectedOrigin() {
  if (!existsSync(secretsPath)) return DEFAULT_ORIGIN;
  for (const line of readFileSync(secretsPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("PRODUCTION_URL=")) {
      return trimmed.slice("PRODUCTION_URL=".length).trim() || DEFAULT_ORIGIN;
    }
  }
  return DEFAULT_ORIGIN;
}

function normalizeOrigin(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" && parsed.port === "443") {
      parsed.port = "";
    }
    return parsed.origin;
  } catch {
    return url.replace(/\/$/, "").replace(/:443$/, "");
  }
}

function upsertEnvVar(filePath, key, value) {
  let contents = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(contents)) {
    contents = contents.replace(pattern, line);
  } else {
    contents += `${contents.endsWith("\n") || contents.length === 0 ? "" : "\n"}${line}\n`;
  }

  writeFileSync(filePath, contents, { mode: 0o600 });
}

async function readTokenFromStdin() {
  if (process.stdin.isTTY) return null;

  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const value = Buffer.concat(chunks).toString("utf8").trim();
  return value || null;
}

function readTokenFromFile() {
  if (!existsSync(tokenFilePath)) return null;

  for (const line of readFileSync(tokenFilePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.length >= 50 && trimmed.includes("/")) {
      return trimmed;
    }
  }
  return null;
}

async function promptToken() {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const token = await new Promise((resolve) => {
    rl.question(
      "Vlož origin trial token (z Chrome Origin Trials) a stlač Enter:\n> ",
      resolve
    );
  });
  rl.close();
  return token.trim();
}

function openRegistrationPage() {
  const platform = process.platform;
  if (platform === "darwin") {
    spawnSync("open", [REGISTER_URL], { stdio: "ignore" });
    return;
  }
  if (platform === "linux") {
    spawnSync("xdg-open", [REGISTER_URL], { stdio: "ignore" });
    return;
  }
  if (platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", REGISTER_URL], { stdio: "ignore", shell: true });
  }
}

function printRegistrationInstructions(origin) {
  console.error("\n=== Chrome Origin Trials — vyplň formulár ===");
  console.error(`  Web origin:   ${origin}`);
  console.error("  Third party:  No  (dôležité!)");
  console.error("  Match subdomains: voliteľné (Yes je OK)");
  console.error(`\nAk sa stránka neotvorí: ${REGISTER_URL}\n`);
}

function validateToken(token, { strict = false } = {}) {
  if (!token) {
    console.error("Chýba token.");
    process.exit(1);
  }

  if (token.length < 20) {
    console.error("Token vyzerá príliš krátky — skontroluj skopírovanú hodnotu.");
    process.exit(1);
  }

  const payload = parseOriginTrialPayload(token);
  const expectedOrigin = normalizeOrigin(getExpectedOrigin());

  if (isThirdPartyOriginTrialToken(token)) {
    const message =
      "Token je registrovaný ako Third party. Zaregistruj znova s Third party: No pre " +
      expectedOrigin;

    if (strict) {
      console.error(`\n✗ ${message}`);
      process.exit(1);
    }

    console.warn(`\n⚠ ${message}\n`);
  }

  if (payload?.origin) {
    const tokenOrigin = normalizeOrigin(payload.origin);
    if (tokenOrigin !== expectedOrigin) {
      const message = `Token origin ${tokenOrigin} nesedí s očakávaným ${expectedOrigin}`;
      if (strict) {
        console.error(`\n✗ ${message}`);
        process.exit(1);
      }
      console.warn(`\n⚠ ${message}\n`);
    } else {
      console.log(`✓ Token origin: ${tokenOrigin}`);
    }
  }

  if (strict && payload) {
    console.log(`✓ First-party token, feature: ${payload.feature ?? "WebMCP"}`);
  }
}

function runNpm(script) {
  const result = spawnSync("npm", ["run", script], { stdio: "inherit", cwd: root });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function resolveToken(args, { setup = false } = {}) {
  const positional = args.filter((a) => !a.startsWith("--"));
  let token =
    positional[0]?.trim() || process.env.WEBMCP_ORIGIN_TRIAL_TOKEN?.trim() || null;

  if (!token) token = await readTokenFromStdin();
  if (!token) token = readTokenFromFile();

  if (!token) {
    const origin = getExpectedOrigin();
    console.error(setup ? "Spúšťam WebMCP setup — potrebujem nový token.\n" : "Token nebol zadaný.\n");
    printRegistrationInstructions(origin);
    openRegistrationPage();
    token = await promptToken();
  }

  return token;
}

async function saveAndSync(token) {
  if (!existsSync(secretsPath)) {
    console.error("Chýba .deploy-secrets — najprv spusti: npm run secrets:generate");
    process.exit(1);
  }

  upsertEnvVar(secretsPath, KEY, token);
  console.log(`✓ ${KEY} uložený do .deploy-secrets`);

  runNpm("env:setup");
  runNpm("vercel:env");
}

async function main() {
  const args = process.argv.slice(2);
  const setup = args.includes("--setup");

  if (args.includes("--register-only")) {
    const origin = getExpectedOrigin();
    printRegistrationInstructions(origin);
    openRegistrationPage();
    console.error('\nPo registrácii spusti: npm run webmcp:setup -- "TvojToken"');
    return;
  }

  const token = await resolveToken(args, { setup });
  validateToken(token, { strict: setup });

  await saveAndSync(token);

  if (setup) {
    console.log("\n→ Deploy na produkciu...");
    runNpm("vercel:deploy");

    console.log("\n→ Overenie produkcie...");
    runNpm("webmcp:verify");
    console.log("\n✓ WebMCP setup hotový.");
    return;
  }

  console.log("\nHotovo. Pre aktiváciu na produkcii:");
  console.log("  npm run vercel:deploy");
  console.log("  npm run webmcp:verify");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
