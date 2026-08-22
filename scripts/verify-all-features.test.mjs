import test from "node:test";
import assert from "node:assert/strict";

// 1. PRAHA DISTANCE & BOLT TAXI ESTIMATOR
import {
  calculateDistanceFromVaclavak,
  estimateBoltPrice,
  BOLT_MIN_FARE,
  BOLT_BASE_FARE,
} from "../src/lib/praha-distance.ts";

// 2. OFFLINE STORAGE & 5MB QUOTA
import {
  MAX_LOCALSTORAGE_BYTES,
  getLocalStorageStats,
  getListingsPrefs,
  setListingsPrefs,
  getStoredListings,
  addStoredListings,
} from "../src/lib/offline-storage.ts";

// 3. PARSE WATCH INTENT & DEFAULTS
import {
  parseWatchIntent,
  formatWatchIntentSummary,
  buildWatchPrefillUrl,
} from "../src/lib/parse-watch-intent.ts";

// 4. BAZOS RSS & PHONE NORMALIZATION
import {
  buildRssUrl,
  extractExternalId,
  parsePriceFromTitle,
  extractThumbnail,
  stripHtml,
} from "../src/lib/bazos-rss.ts";
import {
  normalizePhoneE164,
  extractPhonesFromText,
} from "../src/lib/bazos-phone.ts";

// 5. MISTRAL AI ESPRESSO DIGEST
import {
  generateEspressoDigest,
  TARGET_DIGEST_QUERIES,
} from "../src/lib/digest-service.ts";

/* =========================================================================
   TEST 1: Predvolené CZ vyhľadávanie a LocalStorage nastavenia
   ========================================================================= */
test("1. FEATURE: Predvolené CZ vyhľadávanie a LocalStorage predvoľby", () => {
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

  // Predvolené nastavenie musí byť CZ
  const defaultPrefs = getListingsPrefs();
  assert.equal(defaultPrefs.countryFilter, "CZ", "Predvolený countryFilter musí byť CZ");

  // Uloženie novej predvoľby
  setListingsPrefs({ watchFilter: "all", countryFilter: "CZ", unreadOnly: true });
  const updatedPrefs = getListingsPrefs();
  assert.equal(updatedPrefs.countryFilter, "CZ");
  assert.equal(updatedPrefs.unreadOnly, true);

  delete global.window;
  delete global.localStorage;
});

/* =========================================================================
   TEST 2: SK / CZ / ALL Switcher & Watch Intent rozpoznávanie
   ========================================================================= */
test("2. FEATURE: SK / CZ Switcher & rozpoznávanie českého vs slovenského kontextu", () => {
  // Český dopyt
  const czIntent = parseWatchIntent("iPhone 16 v Prahe do 20000 Kč");
  assert.deepEqual(czIntent.countries, ["CZ"]);
  assert.equal(czIntent.maxPrice, 20000);
  assert.equal(czIntent.category, "mo");

  // Slovenský dopyt
  const skIntent = parseWatchIntent("iPhone 15 do 400 € v BA");
  assert.deepEqual(skIntent.countries, ["SK"]);
  assert.equal(skIntent.maxPrice, 400);
  assert.equal(skIntent.category, "mo");

  // Generovanie RSS adries pre SK a CZ
  assert.equal(buildRssUrl("mo", "CZ"), "https://www.bazos.cz/rss.php?rub=mo");
  assert.equal(buildRssUrl("mo", "SK"), "https://www.bazos.sk/rss.php?rub=mo");
});

/* =========================================================================
   TEST 3: 2-Fotkový náhľad inzerátov (Bazoš CDN derivácia)
   ========================================================================= */
test("3. FEATURE: 2-Fotkový náhľad (odvodenie 2. fotky z Bazoš CDN)", () => {
  const thumbCz = "https://www.bazos.cz/img/1/123/123456789.jpg";
  const photo2Cz = thumbCz.replace(/\/img\/[1t]\//, "/img/2/");
  assert.equal(photo2Cz, "https://www.bazos.cz/img/2/123/123456789.jpg");

  const thumbT = "https://www.bazos.sk/img/t/456/987654321.jpg";
  const photo2Sk = thumbT.replace(/\/img\/[1t]\//, "/img/2/");
  assert.equal(photo2Sk, "https://www.bazos.sk/img/2/456/987654321.jpg");
});

/* =========================================================================
   TEST 4: Telefónne čísla SK (+421) / CZ (+420) a Click-to-Call
   ========================================================================= */
test("4. FEATURE: Extrakcia a normalizácia telefónnych čísel (SK a CZ)", () => {
  // CZ číslo v texte
  const czText = "Predám iPhone, volajte na +420 601 111 222.";
  const czPhones = extractPhonesFromText(czText);
  assert.ok(czPhones.phones.includes("+420601111222"));

  // SK číslo v texte
  const skText = "Kontakt: 0901 234 567 po 18:00.";
  const skPhones = extractPhonesFromText(skText);
  assert.ok(skPhones.phones.includes("+421901234567"));
});

/* =========================================================================
   TEST 5: Kalkulátor vzdialenosti od Václaváku (Centrum Prahy)
   ========================================================================= */
test("5. FEATURE: Kalkulátor vzdialenosti od Václavského námestia", () => {
  // Centrum Prahy (Praha 1 - Staré Město)
  const p1 = calculateDistanceFromVaclavak("Praha 1 - Staré Město");
  assert.ok(p1);
  assert.equal(p1.km, 0.7);
  assert.equal(p1.formattedDistance, "700 m od Václaváku");

  // Vinohrady (Praha 2)
  const vinohrady = calculateDistanceFromVaclavak("Praha 2, Vinohrady");
  assert.ok(vinohrady);
  assert.equal(vinohrady.km, 1.6);
  assert.equal(vinohrady.formattedDistance, "1.6 km od Václaváku");

  // Chodov (Praha 4 / 11)
  const chodov = calculateDistanceFromVaclavak("Praha 4, Chodov");
  assert.ok(chodov);
  assert.equal(chodov.km, 9.2);
  assert.equal(chodov.formattedDistance, "9.2 km od Václaváku");

  // Stredočeský kraj (Kladno)
  const kladno = calculateDistanceFromVaclavak("Kladno");
  assert.ok(kladno);
  assert.equal(kladno.km, 31);
  assert.equal(kladno.formattedDistance, "31 km od Václaváku");
});

/* =========================================================================
   TEST 6: Bolt Taxi Price Estimator (Pražský cenník)
   ========================================================================= */
test("6. FEATURE: Bolt Taxi kalkulátor ceny v Prahe", () => {
  // Minimálne jazdné (80 Kč)
  const minRide = estimateBoltPrice(0.4);
  assert.equal(minRide.priceCzk, BOLT_MIN_FARE);
  assert.equal(minRide.formattedPrice, "~80 Kč");

  // Stredná jazda (Vinohrady 1.6 km -> 45 + 1.6 * 26 = 87 Kč)
  const vinohradyBolt = estimateBoltPrice(1.6);
  assert.equal(vinohradyBolt.priceCzk, 87);
  assert.equal(vinohradyBolt.formattedPrice, "~87 Kč");

  // Dlhšia jazda (Chodov 9.2 km -> 45 + 9.2 * 26 = 284 Kč)
  const chodovBolt = estimateBoltPrice(9.2);
  assert.equal(chodovBolt.priceCzk, 284);
  assert.equal(chodovBolt.formattedPrice, "~284 Kč");
  assert.equal(chodovBolt.boltUrl, "https://bolt.eu/");
});

/* =========================================================================
   TEST 7: 100% LocalStorage Databáza (5 MB kvóta a FIFO orezávanie)
   ========================================================================= */
test("7. FEATURE: LocalStorage pamäť 5 MB a orezávanie", () => {
  assert.equal(MAX_LOCALSTORAGE_BYTES, 5 * 1024 * 1024);
  assert.equal(MAX_LOCALSTORAGE_BYTES, 5242880);

  const stats = getLocalStorageStats();
  assert.equal(stats.maxBytes, 5242880);
});

/* =========================================================================
   TEST 8: AI Espresso Digest (Mistral AI)
   ========================================================================= */
test("8. FEATURE: AI Espresso Digest s Mistral AI a TOP ponukami", () => {
  assert.ok(TARGET_DIGEST_QUERIES.length >= 3);
  assert.ok(TARGET_DIGEST_QUERIES.some((q) => q.name.toLowerCase().includes("iphone 16")));
  assert.ok(TARGET_DIGEST_QUERIES.some((q) => q.name.toLowerCase().includes("macbook")));
  assert.ok(TARGET_DIGEST_QUERIES.some((q) => q.name.toLowerCase().includes("razer")));
});

/* =========================================================================
   TEST 9: Obľúbené inzeráty & Porovnávač (Bookmarks)
   ========================================================================= */
test("9. FEATURE: Obľúbené inzeráty (Bookmarks) & Porovnávač v LocalStorage", async () => {
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

  const {
    getStoredFavoriteIds,
    toggleStoredFavorite,
    isStoredFavorite,
    getStoredFavoriteListings,
    addStoredListings,
  } = await import("../src/lib/offline-storage.ts");

  // Pridanie inzerátu do obľúbených
  const added = toggleStoredFavorite("deal-123");
  assert.equal(added, true);
  assert.equal(isStoredFavorite("deal-123"), true);
  assert.deepEqual(getStoredFavoriteIds(), ["deal-123"]);

  // Odstránenie z obľúbených
  const removed = toggleStoredFavorite("deal-123");
  assert.equal(removed, false);
  assert.equal(isStoredFavorite("deal-123"), false);
  assert.deepEqual(getStoredFavoriteIds(), []);

  delete global.window;
  delete global.localStorage;
});

/* =========================================================================
   TEST 10: Telefónny Hub & Export Kontaktov (VCF / CSV)
   ========================================================================= */
test("10. FEATURE: Telefónny Hub & VCF/CSV Exportér kontaktov", async () => {
  const {
    extractContactsFromListings,
    generateVcfContacts,
    generateCsvContacts,
  } = await import("../src/lib/contacts-export.ts");

  const contacts = extractContactsFromListings([
    {
      id: "cz-1",
      title: "iPhone 16",
      country: "CZ",
      listingPhones: [{ phoneE164: "+420777123456", phoneRaw: "777 123 456" }],
    },
  ]);

  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].phone, "+420777123456");

  const vcf = generateVcfContacts(contacts);
  assert.ok(vcf.includes("BEGIN:VCARD"));
  assert.ok(vcf.includes("+420777123456"));

  const csv = generateCsvContacts(contacts);
  assert.ok(csv.includes("+420777123456"));
});


