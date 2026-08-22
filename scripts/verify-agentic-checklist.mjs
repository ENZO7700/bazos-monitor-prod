#!/usr/bin/env node
/**
 * Lokálna kontrola agentic browsing / WebMCP pripravenosti.
 * Spustenie: npm run agentic:verify
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

check(existsSync(join(root, "public/llms.txt")), "Missing: public/llms.txt");
check(existsSync(join(root, "src/components/WebMcpTools.tsx")), "Missing: WebMcpTools.tsx");
check(existsSync(join(root, "scripts/lighthouse-agentic.mjs")), "Missing: lighthouse-agentic.mjs");
check(existsSync(join(root, "scripts/parse-lighthouse-agentic.mjs")), "Missing: parse-lighthouse-agentic.mjs");

const llms = readFileSync(join(root, "public/llms.txt"), "utf8");
check(llms.includes("Bazoš Monitor"), "llms.txt must describe the app");
check(llms.includes("create_watch"), "llms.txt must document create_watch tool");

const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
check(layout.includes('lang="sk"'), "layout.tsx must set html lang");
check(layout.includes("#main-content"), "layout.tsx must include skip link to #main-content");

const appShell = readFileSync(join(root, "src/components/layout/AppShell.tsx"), "utf8");
check(appShell.includes('id="main-content"'), "AppShell must expose #main-content");

const watchForm = readFileSync(join(root, "src/components/WatchForm.tsx"), "utf8");
check(watchForm.includes('toolname="create_watch"'), "WatchForm must expose create_watch tool");

const watchQuickStart = readFileSync(join(root, "src/components/WatchQuickStart.tsx"), "utf8");
check(
  watchQuickStart.includes('toolname="quick_start_watch"'),
  "WatchQuickStart must expose quick_start_watch tool"
);

const middleware = readFileSync(join(root, "src/middleware.ts"), "utf8");
check(
  middleware.includes("getWebMcpResponseHeaders") &&
    middleware.includes("NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN"),
  "middleware.ts must gate WebMCP headers on NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN"
);

const webmcpToken = readFileSync(join(root, "src/lib/webmcp-token.ts"), "utf8");
check(
  webmcpToken.includes("isThirdPartyOriginTrialToken") &&
    webmcpToken.includes("Permissions-Policy"),
  "webmcp-token.ts must skip Permissions-Policy for third-party tokens"
);

const webmcpTools = readFileSync(join(root, "src/components/WebMcpTools.tsx"), "utf8");
for (const tool of ["poll_listings", "list_watches", "get_stats", "navigate_listings"]) {
  check(webmcpTools.includes(tool), `WebMcpTools must register ${tool}`);
}
check(
  !webmcpTools.includes('name: "quick_start_watch"'),
  "WebMcpTools must not imperatively register quick_start_watch (declarative on homepage)"
);

if (errors.length) {
  console.error("Agentic checklist FAILED:");
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log("Agentic checklist OK");
