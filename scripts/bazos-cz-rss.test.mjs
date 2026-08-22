import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRssUrl,
  extractExternalId,
  parsePriceFromTitle,
  parseLocationFromListingHtml,
} from "../src/lib/bazos-rss.ts";
import { formatPrice } from "../src/lib/utils.ts";
import { parseWatchIntent } from "../src/lib/parse-watch-intent.ts";

test("buildRssUrl generates correct URL for SK and CZ", () => {
  assert.equal(buildRssUrl("mo", "SK"), "https://www.bazos.sk/rss.php?rub=mo");
  assert.equal(buildRssUrl("mo", "CZ"), "https://www.bazos.cz/rss.php?rub=mo");
  assert.equal(buildRssUrl("au", "CZ"), "https://www.bazos.cz/rss.php?rub=au");
});

test("extractExternalId handles both SK and CZ URLs", () => {
  assert.equal(
    extractExternalId("https://mobil.bazos.cz/inzerat/222874564/iphone-11-64-gb.php"),
    "222874564"
  );
  assert.equal(
    extractExternalId("https://auto.bazos.sk/inzerat/189000123/skoda-octavia.php"),
    "189000123"
  );
});

test("parsePriceFromTitle handles CZ prices with Kč and spaces", () => {
  const result1 = parsePriceFromTitle("iPhone 11 64 gb: 1 500", "CZ");
  assert.equal(result1.name, "iPhone 11 64 gb");
  assert.equal(result1.price, 1500);
  assert.equal(result1.currency, "CZK");
  assert.match(result1.label, /1\s*500\s*Kč/);

  const result2 = parsePriceFromTitle("Google pixel 8 pro: 7 500 Kč", "CZ");
  assert.equal(result2.price, 7500);
  assert.equal(result2.currency, "CZK");

  const result3 = parsePriceFromTitle("Apple Watch: 800", "CZ");
  assert.equal(result3.price, 800);
  assert.equal(result3.currency, "CZK");
});

test("parsePriceFromTitle handles non-numeric labels in CZ", () => {
  const vTextu = parsePriceFromTitle("Kryt na mobil: V textu", "CZ");
  assert.equal(vTextu.price, null);
  assert.equal(vTextu.label, "V textu");

  const nabidnete = parsePriceFromTitle("Stará Nokia: Nabídněte", "CZ");
  assert.equal(nabidnete.price, null);
  assert.equal(nabidnete.label, "Nabídněte");

  const zdarma = parsePriceFromTitle("Krabice od telefonu: Zdarma", "CZ");
  assert.equal(zdarma.price, null);
  assert.equal(zdarma.label, "Zdarma");

  const dohodou = parsePriceFromTitle("Samsung S24: Dohodou", "CZ");
  assert.equal(dohodou.price, null);
  assert.equal(dohodou.label, "Dohodou");
});

test("parseLocationFromListingHtml extracts CZ locations", () => {
  const html1 = `<div class="inzeratydetail">Lokalita: <span>Praha 4 - Chodov</span></div>`;
  assert.equal(parseLocationFromListingHtml(html1), "Praha 4 - Chodov");

  const html2 = `<div>Místo: Brno město</div>`;
  assert.equal(parseLocationFromListingHtml(html2), "Brno město");
});

test("formatPrice formats EUR and CZK correctly", () => {
  assert.match(formatPrice(1500, null, "CZK"), /1\s*500\s*Kč/);
  assert.match(formatPrice(250, null, "EUR"), /250\s*€/);
  assert.equal(formatPrice(null, "Dohodou", "CZK"), "Dohodou");
});

test("parseWatchIntent recognizes CZ context and currency", () => {
  const czIntent = parseWatchIntent("iPhone 14 do 12000 kč v praze");
  assert.equal(czIntent.category, "mo");
  assert.equal(czIntent.maxPrice, 12000);
  assert.deepEqual(czIntent.countries, ["CZ"]);

  const skIntent = parseWatchIntent("Škoda Octavia do 7000 eur v bratislave");
  assert.equal(skIntent.category, "au");
  assert.equal(skIntent.maxPrice, 7000);
  assert.deepEqual(skIntent.countries, ["SK"]);
});
