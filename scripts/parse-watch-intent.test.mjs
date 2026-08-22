import test from "node:test";
import assert from "node:assert/strict";
import {
  parseWatchIntent,
  formatWatchIntentSummary,
  buildWatchPrefillUrl,
} from "../src/lib/parse-watch-intent.ts";

test("parseWatchIntent extracts phone category and max price", () => {
  const intent = parseWatchIntent("iPhone 15 pod 400€");
  assert.equal(intent.category, "mo");
  assert.equal(intent.maxPrice, 400);
  assert.ok(intent.keywords.some((k) => k.includes("iphone")));
  assert.equal(intent.confidence, "high");
});

test("parseWatchIntent handles auto with high price", () => {
  const intent = parseWatchIntent("Škoda Octavia do 8000 eur");
  assert.equal(intent.category, "au");
  assert.equal(intent.maxPrice, 8000);
  assert.equal(intent.confidence, "high");
});

test("parseWatchIntent maps rental keywords to reality", () => {
  const intent = parseWatchIntent("prenájom bytu Bratislava");
  assert.equal(intent.category, "re");
  assert.ok(intent.keywords.includes("prenájom"));
});

test("parseWatchIntent maps console keywords", () => {
  const intent = parseWatchIntent("PS5 pod 300€");
  assert.equal(intent.category, "pc");
  assert.equal(intent.maxPrice, 300);
});

test("parseWatchIntent maps notebook", () => {
  const intent = parseWatchIntent("notebook do 600");
  assert.equal(intent.category, "pc");
  assert.equal(intent.maxPrice, 600);
});

test("parseWatchIntent returns low confidence for vague input", () => {
  const intent = parseWatchIntent("niečo lacné");
  assert.equal(intent.confidence, "low");
});

test("formatWatchIntentSummary joins category keywords and price", () => {
  const summary = formatWatchIntentSummary({
    name: "iPhone",
    category: "mo",
    keywords: ["iphone"],
    minPrice: null,
    maxPrice: 400,
    confidence: "high",
  });
  assert.match(summary, /Mobilné telefóny/);
  assert.match(summary, /iphone/);
  assert.match(summary, /400/);
});

test("buildWatchPrefillUrl encodes query params", () => {
  const url = buildWatchPrefillUrl({
    name: "Test watch",
    category: "mo",
    keywords: ["iphone", "128gb"],
    minPrice: null,
    maxPrice: 350,
    confidence: "low",
  });
  assert.match(url, /^\/watches\/new\?/);
  assert.match(url, /category=mo/);
  assert.match(url, /maxPrice=350/);
});
