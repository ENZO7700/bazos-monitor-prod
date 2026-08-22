import test from "node:test";
import assert from "node:assert/strict";
import { parseLocationFromListingHtml } from "../src/lib/bazos-rss.ts";

const sampleHtml = `
<meta name="description" content="Inzerát č. 193435956: Vymenim Xiaomi, Cena: 560 €, Lokalita: Bratislava. Popis: ...">
<meta property="og:title" content="Vymenim Xiaomi - Bratislava">
`;

test("parseLocationFromListingHtml reads Lokalita from meta description", () => {
  assert.equal(parseLocationFromListingHtml(sampleHtml), "Bratislava");
});

test("parseLocationFromListingHtml falls back to og:title suffix", () => {
  const html = `<meta property="og:title" content="iPhone 15 - Košice">`;
  assert.equal(parseLocationFromListingHtml(html), "Košice");
});

test("parseLocationFromListingHtml returns null when missing", () => {
  assert.equal(parseLocationFromListingHtml("<html></html>"), null);
});
