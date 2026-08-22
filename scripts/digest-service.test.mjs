import test from "node:test";
import assert from "node:assert/strict";
import { generateEspressoDigest, TARGET_DIGEST_QUERIES } from "../src/lib/digest-service.ts";

test("TARGET_DIGEST_QUERIES covers requested CZ queries", () => {
  assert.equal(TARGET_DIGEST_QUERIES.length, 3);
  assert.equal(TARGET_DIGEST_QUERIES[0].name, "iPhone 16 / 17");
  assert.equal(TARGET_DIGEST_QUERIES[1].name, "Apple MacBook (od 20 000 Kč)");
  assert.equal(TARGET_DIGEST_QUERIES[1].minPrice, 20000);
  assert.equal(TARGET_DIGEST_QUERIES[2].name, "Notebook Razer");
});

test("generateEspressoDigest produces valid structured output from live Bazos.cz", async () => {
  const result = await generateEspressoDigest({ preferPraha: true });

  assert.ok(result.title.includes("Espresso Digest"));
  assert.ok(result.summary.includes("Bazoš.cz"));
  assert.ok(result.targetLocation.includes("Praha"));
  assert.ok(typeof result.totalListingsAnalyzed === "number");
  assert.ok(result.totalListingsAnalyzed > 0, "Should analyze real live listings from Bazos.cz");
  assert.ok(Array.isArray(result.topDeals));
  assert.ok(result.topDeals.length <= 3, "Should return at most TOP 3 deals");

  if (result.topDeals.length > 0) {
    const deal = result.topDeals[0];
    assert.ok(deal.title, "Deal must have title");
    assert.ok(deal.priceFormatted, "Deal must have formatted price");
    assert.ok(deal.currency === "CZK" || deal.currency === "EUR", "Currency must be CZK or EUR");
    assert.ok(deal.url.includes("bazos.cz"), "URL must point to bazos.cz");
    assert.ok(deal.highlightReason, "Deal must have highlight reason");
    assert.ok(deal.badge, "Deal must have badge");
  }

  assert.ok(typeof result.pushNotificationBody === "string");
  console.log("\n[TEST DIGEST OUTPUT]");
  console.log("Title:", result.title);
  console.log("Summary:", result.summary);
  console.log("TOP Deals Count:", result.topDeals.length);
  result.topDeals.forEach((d, i) => {
    console.log(`  ${i + 1}. [${d.badge}] ${d.title} -> ${d.priceFormatted} (${d.location}) - ${d.highlightReason}`);
  });
  console.log("Push Body:", result.pushNotificationBody);
});
