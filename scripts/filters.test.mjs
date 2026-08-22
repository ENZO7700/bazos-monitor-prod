import test from "node:test";
import assert from "node:assert/strict";
import { matchesWatchFilters } from "../src/lib/filters.ts";

test("Filters: strictly matches multi-word query (macbook pro) with AND logic", () => {
  const macbookProAd = {
    externalId: "1",
    title: "Apple MacBook Pro 14 M2",
    price: 35000,
    priceLabel: "35 000 Kč",
    currency: "CZK",
    country: "CZ",
    url: "https://pc.bazos.cz/1",
    thumbnail: null,
    description: "Krásný stav, Praha 1",
    location: "Praha 1",
    publishedAt: new Date(),
  };

  const nintendoAd = {
    externalId: "2",
    title: "Nintendo switch Lite",
    price: 3000,
    priceLabel: "3 000 Kč",
    currency: "CZK",
    country: "CZ",
    url: "https://pc.bazos.cz/2",
    thumbnail: null,
    description: "Prodám konzoli v Praze 4",
    location: "Praha 4",
    publishedAt: new Date(),
  };

  const ps5Ad = {
    externalId: "3",
    title: "Ovladače na PS5",
    price: null,
    priceLabel: "V textu",
    currency: "CZK",
    country: "CZ",
    url: "https://pc.bazos.cz/3",
    thumbnail: null,
    description: "Plzeň-sever prodam ovladac",
    location: "Plzeň",
    publishedAt: new Date(),
  };

  const filters = {
    keywords: ["macbook", "pro"],
  };

  // MacBook Pro must match
  assert.equal(matchesWatchFilters(macbookProAd, filters), true);

  // Nintendo Switch Lite (even if in Praha) must NOT match
  assert.equal(matchesWatchFilters(nintendoAd, filters), false);

  // PS5 Controllers (even with "prodam") must NOT match
  assert.equal(matchesWatchFilters(ps5Ad, filters), false);
});

test("Filters: handles diacritics insensitivity (počítač matches pocitac)", () => {
  const ad = {
    externalId: "4",
    title: "Herní počítač i7",
    price: 15000,
    priceLabel: "15 000 Kč",
    currency: "CZK",
    country: "CZ",
    url: "https://pc.bazos.cz/4",
    thumbnail: null,
    description: "Praha",
    location: "Praha",
    publishedAt: new Date(),
  };

  assert.equal(matchesWatchFilters(ad, { keywords: ["pocitac"] }), true);
  assert.equal(matchesWatchFilters(ad, { keywords: ["počítač"] }), true);
});
