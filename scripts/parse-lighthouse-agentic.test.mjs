import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const __dirname = dirname(fileURLToPath(import.meta.url));
const parser = join(__dirname, "parse-lighthouse-agentic.mjs");
const fixture = join(__dirname, "fixtures/lighthouse-agentic-sample.json");

function runParser(reportPath) {
  return spawnSync(process.execPath, [parser, reportPath], {
    encoding: "utf8",
  });
}

test("parse-lighthouse-agentic prints pass ratio for valid report", () => {
  const result = runParser(fixture);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Agentic browsing pass ratio: 0\.75 \(75%\)/);
  assert.match(result.stdout, /\[pass\] llms-txt/);
  assert.match(result.stdout, /\[partial\] webmcp-tools/);
});

test("parse-lighthouse-agentic exits when report is missing", () => {
  const result = runParser(join(__dirname, "fixtures/does-not-exist.json"));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Report not found/);
});
