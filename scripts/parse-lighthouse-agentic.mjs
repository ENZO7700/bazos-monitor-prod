import { readFileSync, existsSync } from "node:fs";

const reportPath = process.argv[2] ?? "./lighthouse-agentic.json";
const minScore = Number(process.env.AGENTIC_MIN_SCORE ?? "0");

if (!existsSync(reportPath)) {
  console.error(`Report not found: ${reportPath}`);
  console.error("Run: PRODUCTION_URL=https://app.vercel.app npm run agentic:lighthouse");
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const category = report.categories?.["agentic-browsing"];

if (!category) {
  console.error("No agentic-browsing category in report (Chrome 150+ required).");
  process.exit(1);
}

const score = category.score ?? 0;
const auditRefs = category.auditRefs ?? [];
const clsAudit = report.audits?.["cumulative-layout-shift"];
const clsValue = clsAudit?.numericValue;

console.log(`Agentic browsing pass ratio: ${score} (${Math.round(score * 100)}%)`);

if (clsValue != null) {
  console.log(`Cumulative Layout Shift: ${clsValue.toFixed(3)} (audit score: ${clsAudit?.score ?? "n/a"})`);
}

console.log("");

const criticalIds = new Set([
  "llms-txt",
  "llms-txt-file",
  "document-title",
  "html-has-lang",
  "meta-description",
]);

let criticalFailures = 0;

for (const ref of auditRefs) {
  const audit = report.audits?.[ref.id];
  if (!audit) continue;

  const status =
    audit.score === 1 ? "pass" : audit.score === 0 ? "fail" : audit.score == null ? "na" : "partial";
  const weight = ref.weight ?? 0;
  console.log(`  [${status}] ${ref.id} (weight ${weight}) — ${audit.title}`);

  if (criticalIds.has(ref.id) && audit.score !== 1) {
    criticalFailures += 1;
  }
}

console.log("");
console.log(`Category score: ${score}`);

if (criticalFailures > 0) {
  console.error(`\n${criticalFailures} critical audit(s) failed.`);
  process.exit(1);
}

if (clsValue != null && clsValue > 0.1) {
  console.warn(`\nWarning: CLS ${clsValue.toFixed(3)} exceeds 0.1 target.`);
}

if (score < 0.95) {
  console.warn(`\nWarning: agentic browsing score below 95% target (current: ${Math.round(score * 100)}%).`);
}

if (score < 0.5) {
  console.warn("\nWarning: agentic browsing score below 50% (partial readiness).");
}

if (minScore > 0 && score < minScore) {
  console.error(`\nScore ${score} is below AGENTIC_MIN_SCORE=${minScore}.`);
  process.exit(1);
}
