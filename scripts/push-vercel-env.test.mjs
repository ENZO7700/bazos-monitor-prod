import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseDeploySecrets } from "./push-vercel-env.mjs";

test("parseDeploySecrets preserves values with + / = characters", () => {
  const dir = mkdtempSync(join(tmpdir(), "deploy-secrets-"));
  const file = join(dir, ".deploy-secrets");

  try {
    writeFileSync(
      file,
      `# comment
CRON_SECRET=HaO43ISG81Bnf8SOvj/MnoCsbNhJCA0ztuyZuVq+fkU=
NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN=abc+def/ghi=xyz/sig/eyJ0ZXN0IjoxfQ==
`
    );

    const vars = parseDeploySecrets(file);
    assert.equal(vars.get("CRON_SECRET"), "HaO43ISG81Bnf8SOvj/MnoCsbNhJCA0ztuyZuVq+fkU=");
    assert.equal(
      vars.get("NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN"),
      "abc+def/ghi=xyz/sig/eyJ0ZXN0IjoxfQ=="
    );
  } finally {
    unlinkSync(file);
  }
});
