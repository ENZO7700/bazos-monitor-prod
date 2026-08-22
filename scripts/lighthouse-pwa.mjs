import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const url = process.env.PRODUCTION_URL ?? process.argv[2];
const outputPath = "./lighthouse-pwa.json";

if (!url) {
  console.error("Usage: PRODUCTION_URL=https://app.vercel.app npm run pwa:lighthouse");
  process.exit(1);
}

function runLighthouse(args) {
  return spawnSync("npx", ["lighthouse", url, ...args], {
    stdio: "inherit",
    shell: true,
  });
}

let result = runLighthouse([
  "--chrome-flags=--headless",
  "--output=json",
  `--output-path=${outputPath}`,
  "--only-categories=pwa",
  "--quiet",
]);

if (result.status !== 0) {
  console.warn("PWA category run failed, falling back to full Lighthouse audit...");
  result = runLighthouse([
    "--chrome-flags=--headless",
    "--output=json",
    `--output-path=${outputPath}`,
    "--quiet",
  ]);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (existsSync(outputPath)) {
  const report = JSON.parse(readFileSync(outputPath, "utf8"));
  const auditCount = Object.keys(report.audits ?? {}).length;
  if (auditCount === 0) {
    console.error("Lighthouse report has no audits — check Chrome/Lighthouse version.");
    process.exit(1);
  }
  const pwaScore = report.categories?.pwa?.score;
  if (pwaScore != null) {
    console.log(`PWA score: ${Math.round(pwaScore * 100)}`);
  }
}

console.log(`Lighthouse PWA report saved to ${outputPath}`);
