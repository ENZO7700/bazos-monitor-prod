#!/usr/bin/env node
/**
 * Lokálna kontrola PWA pripravenosti pred Lighthouse auditom na produkcii.
 * Spustenie: node scripts/verify-pwa-checklist.mjs
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const errors = [];
const warnings = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

const requiredIcons = [
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
  "public/icons/icon-192-maskable.png",
  "public/icons/icon-512-maskable.png",
  "public/favicon.ico",
];

for (const icon of requiredIcons) {
  check(existsSync(join(root, icon)), `Missing: ${icon}`);
}

const screenshots = ["public/screenshots/desktop.png", "public/screenshots/mobile.png"];
for (const shot of screenshots) {
  check(existsSync(join(root, shot)), `Missing: ${shot}`);
}

const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
check(!layout.includes("maximumScale"), "Remove maximumScale from viewport in layout.tsx");

const manifest = readFileSync(join(root, "src/app/manifest.ts"), "utf8");
check(manifest.includes("screenshots"), "Add screenshots to manifest.ts");
check(manifest.includes("maskable"), "Add maskable icons to manifest.ts");

warn(existsSync(join(root, "DEPLOY.md")), "Missing DEPLOY.md");
warn(existsSync(join(root, ".env.production.example")), "Missing .env.production.example");

if (errors.length) {
  console.error("PWA checklist FAILED:");
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log("PWA checklist OK");
warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
