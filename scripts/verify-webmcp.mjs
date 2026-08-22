#!/usr/bin/env node
/**
 * Overí WebMCP origin trial token lokálne a na produkcii.
 * Usage: npm run webmcp:verify
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDeploySecrets } from "./push-vercel-env.mjs";
import {
  getWebMcpResponseHeaders,
  isThirdPartyOriginTrialToken,
  parseOriginTrialPayload,
} from "../src/lib/webmcp-token.ts";

const root = process.cwd();
const secretsPath = join(root, ".deploy-secrets");
const errors = [];
const warnings = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function warn(message) {
  warnings.push(message);
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

function readToken() {
  const vars = parseDeploySecrets(secretsPath);
  return vars.get("NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN") ?? "";
}

function verifyLocalToken(token, expectedOrigin) {
  console.log("\n→ Lokálny token (.deploy-secrets)");

  if (!token || token.length < 50) {
    check(false, "Chýba alebo je príliš krátky NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN");
    return;
  }

  const payload = parseOriginTrialPayload(token);
  check(payload !== null, "Token payload sa nepodarilo dekódovať");

  if (payload) {
    console.log(`  origin: ${payload.origin ?? "(missing)"}`);
    console.log(`  isThirdParty: ${payload.isThirdParty ?? false}`);
    console.log(`  feature: ${payload.feature ?? "(missing)"}`);

    if (isThirdPartyOriginTrialToken(token)) {
      check(
        false,
        "Token je Third party — zaregistruj znova s Third party: No pre https://bazos-monitor.vercel.app"
      );
    }

    if (payload.origin) {
      const normalized = normalizeOrigin(payload.origin);
      const expected = normalizeOrigin(expectedOrigin);
      check(
        normalized === expected,
        `Token origin ${normalized} nesedí s ${expected}`
      );
    }
  }

  const headers = getWebMcpResponseHeaders(token);
  if (headers["Permissions-Policy"]) {
    console.log("  ✓ Token by mal aktivovať Permissions-Policy: tools=(self)");
  } else {
    warn("Token neaktivuje Permissions-Policy (third-party alebo neplatný)");
  }
}

async function verifyProduction(productionUrl, token) {
  console.log(`\n→ Produkcia (${productionUrl})`);

  const healthRes = await fetch(`${productionUrl}/api/health`);
  check(healthRes.ok, `/api/health vracia ${healthRes.status}`);

  const llmsRes = await fetch(`${productionUrl}/llms.txt`);
  check(llmsRes.ok, `/llms.txt vracia ${llmsRes.status}`);
  if (llmsRes.ok) {
    const llms = await llmsRes.text();
    check(llms.includes("Bazoš Monitor"), "llms.txt neobsahuje popis aplikácie");
  }

  const homeRes = await fetch(productionUrl, { redirect: "follow" });
  check(homeRes.ok, `Homepage vracia ${homeRes.status}`);

  const policy = homeRes.headers.get("permissions-policy") ?? "";
  const originTrial = homeRes.headers.get("origin-trial") ?? "";

  console.log(`  permissions-policy: ${policy || "(none)"}`);
  console.log(`  origin-trial: ${originTrial ? `${originTrial.slice(0, 24)}...` : "(none)"}`);

  const expectsHeaders = token && !isThirdPartyOriginTrialToken(token) && token.length >= 50;

  if (expectsHeaders) {
    check(
      policy.toLowerCase().includes("tools=(self)"),
      "Produkcia nemá Permissions-Policy: tools=(self) — spusti npm run vercel:deploy"
    );
    check(originTrial.length > 20, "Produkcia nemá Origin-Trial hlavičku");
  } else if (token && isThirdPartyOriginTrialToken(token)) {
    check(
      !policy.toLowerCase().includes("tools"),
      "Produkcia stále posiela Permissions-Policy tools — treba first-party token"
    );
    console.log("  (third-party token: hlavičky zámerne chýbajú)");
  } else {
    console.log("  (bez tokenu: hlavičky nie sú očakávané)");
  }
}

async function main() {
  const vars = parseDeploySecrets(secretsPath);
  const productionUrl =
    vars.get("PRODUCTION_URL") ?? "https://bazos-monitor.vercel.app";
  const token = readToken();

  console.log("WebMCP verify");
  verifyLocalToken(token, productionUrl);

  try {
    await verifyProduction(productionUrl, token);
  } catch (error) {
    errors.push(`Produkčná kontrola zlyhala: ${error instanceof Error ? error.message : error}`);
  }

  if (warnings.length) {
    console.warn("\nVarovania:");
    warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  }

  if (errors.length) {
    console.error("\nWebMCP verify FAILED:");
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log("\nWebMCP verify OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
