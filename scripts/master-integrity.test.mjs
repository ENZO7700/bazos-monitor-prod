import test from "node:test";
import assert from "node:assert/strict";

import { matchesWatchFilters } from "../src/lib/filters.ts";
import { parsePriceFromTitle, extractExternalId, buildRssUrl } from "../src/lib/bazos-rss.ts";
import { extractPhonesFromText, normalizePhoneE164 } from "../src/lib/bazos-phone.ts";
import { calculateDistanceFromVaclavak, estimateBoltPrice } from "../src/lib/praha-distance.ts";
import { extractContactsFromListings, generateVcfContacts, generateCsvContacts } from "../src/lib/contacts-export.ts";
import { parseWatchIntent } from "../src/lib/parse-watch-intent.ts";
import { BAZOS_CATEGORIES } from "../src/lib/categories.ts";

/* =========================================================================
   INTEGRITY TEST 1: Filtrovanie a prísna zhoda kľúčových slov (AND logika)
   ========================================================================= */
test("INTEGRITY 1: Presnosť vyhľadávania a ochrana pred nerelevantnými inzerátmi", () => {
  const targetListing = {
    externalId: "101",
    title: "Apple MacBook Pro 16 M3 Max",
    price: 65000,
    priceLabel: "65 000 Kč",
    currency: "CZK",
    country: "CZ",
    url: "https://pc.bazos.cz/inzerat/101/macbook.php",
    thumbnail: null,
    description: "Predám zachovalý notebook v Prahe 1.",
    location: "Praha 1",
    publishedAt: new Date(),
  };

  const junkListing1 = {
    externalId: "102",
    title: "Nintendo Switch Lite",
    price: 3500,
    priceLabel: "3 500 Kč",
    currency: "CZK",
    country: "CZ",
    url: "https://pc.bazos.cz/inzerat/102/nintendo.php",
    thumbnail: null,
    description: "Predám v Prahe 4",
    location: "Praha 4",
    publishedAt: new Date(),
  };

  const junkListing2 = {
    externalId: "103",
    title: "WiFi Extender TP-Link",
    price: 300,
    priceLabel: "300 Kč",
    currency: "CZK",
    country: "CZ",
    url: "https://pc.bazos.cz/inzerat/103/wifi.php",
    thumbnail: null,
    description: "Prodam funkcni extender",
    location: "Brno",
    publishedAt: new Date(),
  };

  const filters = { keywords: ["macbook", "pro"] };

  // Cieľový inzerát MUSÍ prejsť
  assert.equal(matchesWatchFilters(targetListing, filters), true);

  // Nerelevantné inzeráty MUSIA byť striktne odmietnuté
  assert.equal(matchesWatchFilters(junkListing1, filters), false);
  assert.equal(matchesWatchFilters(junkListing2, filters), false);
});

/* =========================================================================
   INTEGRITY TEST 2: Parsing cien, mien a titulkov pre CZ aj SK
   ========================================================================= */
test("INTEGRITY 2: Integrita extrakcie cien a mien z Bazoš RSS feedov", () => {
  // Český inzerát s cenou v Kč
  const czParsed = parsePriceFromTitle("iPhone 15 Pro Max: 24 500 Kč", "CZ");
  assert.equal(czParsed.price, 24500);
  assert.equal(czParsed.currency, "CZK");
  assert.equal(czParsed.name, "iPhone 15 Pro Max");

  // Slovenský inzerát s cenou v €
  const skParsed = parsePriceFromTitle("PlayStation 5 Slim: 420 €", "SK");
  assert.equal(skParsed.price, 420);
  assert.equal(skParsed.currency, "EUR");
  assert.equal(skParsed.name, "PlayStation 5 Slim");

  // Inzerát s textom namiesto ceny
  const textPrice = parsePriceFromTitle("Staré hodinky Prim: Dohodou", "CZ");
  assert.equal(textPrice.price, null);
  assert.equal(textPrice.label, "Dohodou");
});

/* =========================================================================
   INTEGRITY TEST 3: Extrakcia, normalizácia a formátovanie telefónnych kontaktov
   ========================================================================= */
test("INTEGRITY 3: Integrita telefónneho modulu a exportov", () => {
  const czNorm = normalizePhoneE164("777 123 456");
  assert.equal(czNorm, "+420777123456");

  const skNorm = normalizePhoneE164("0901 987 654");
  assert.equal(skNorm, "+421901987654");

  const mockListings = [
    {
      id: "ad-1",
      title: "MacBook Pro",
      price: 30000,
      country: "CZ",
      location: "Praha 1",
      url: "https://pc.bazos.cz/1",
      listingPhones: [{ phoneE164: "+420777123456", phoneRaw: "777 123 456" }],
    },
  ];

  const contacts = extractContactsFromListings(mockListings);
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].phone, "+420777123456");

  const vcf = generateVcfContacts(contacts);
  assert.ok(vcf.includes("BEGIN:VCARD"));
  assert.ok(vcf.includes("+420777123456"));

  const csv = generateCsvContacts(contacts);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes("+420777123456"));
});

/* =========================================================================
   INTEGRITY TEST 4: Geolokácia, vzdialenosti v Prahe a Bolt kalkulátor
   ========================================================================= */
test("INTEGRITY 4: Integrita kalkulátora vzdialenosti od Václaváku a Bolt taxi", () => {
  // Centrum Prahy (Praha 1)
  const distP1 = calculateDistanceFromVaclavak("Praha 1 - Staré Město");
  assert.ok(distP1 !== null && distP1.km <= 2.0);

  // Širšie centrum (Praha 4)
  const distP4 = calculateDistanceFromVaclavak("Praha 4 - Nusle");
  assert.ok(distP4 !== null && distP4.km >= 2.0 && distP4.km <= 8.0);

  // Bolt taxi odhad ceny
  const boltP1 = estimateBoltPrice(distP1.km);
  assert.equal(boltP1.priceCzk, 80); // Minimálne jazdné

  const boltP4 = estimateBoltPrice(distP4.km);
  assert.ok(boltP4.priceCzk >= 100);
});

/* =========================================================================
   INTEGRITY TEST 5: Mistral AI Intent Parser a klasifikácia kategórií
   ========================================================================= */
test("INTEGRITY 5: Integrita Mistral AI klasifikátora dopytov", () => {
  const intent = parseWatchIntent("macbook pro do 30000 kč praha");
  assert.equal(intent.category, "pc");
  assert.equal(intent.maxPrice, 30000);
  assert.deepEqual(intent.countries, ["CZ"]);
  assert.ok(intent.keywords.includes("macbook"));
  assert.ok(intent.keywords.includes("pro"));
});

/* =========================================================================
   INTEGRITY TEST 6: LocalStorage a správa stavu obľúbených inzerátov
   ========================================================================= */
test("INTEGRITY 6: Integrita offline úložiska (Favorites & Bookmarks)", async () => {
  const mockStorage = new Map();
  global.window = {
    localStorage: {
      getItem: (k) => mockStorage.get(k) ?? null,
      setItem: (k, v) => mockStorage.set(k, String(v)),
      removeItem: (k) => mockStorage.delete(k),
      clear: () => mockStorage.clear(),
      get length() { return mockStorage.size; },
      key: (i) => Array.from(mockStorage.keys())[i] ?? null,
    },
  };
  global.localStorage = global.window.localStorage;

  const { toggleStoredFavorite, isStoredFavorite, getStoredFavoriteIds } =
    await import("../src/lib/offline-storage.ts");

  assert.equal(isStoredFavorite("fav-deal-1"), false);
  toggleStoredFavorite("fav-deal-1");
  assert.equal(isStoredFavorite("fav-deal-1"), true);
  assert.deepEqual(getStoredFavoriteIds(), ["fav-deal-1"]);

  toggleStoredFavorite("fav-deal-1");
  assert.equal(isStoredFavorite("fav-deal-1"), false);
  assert.deepEqual(getStoredFavoriteIds(), []);

  delete global.window;
  delete global.localStorage;
});
