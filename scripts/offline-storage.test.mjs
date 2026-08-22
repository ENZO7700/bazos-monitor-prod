import test from "node:test";
import assert from "node:assert/strict";
import { MAX_LOCALSTORAGE_BYTES, getLocalStorageStats } from "../src/lib/offline-storage.ts";

test("MAX_LOCALSTORAGE_BYTES is fixed to exactly 5MB", () => {
  assert.equal(MAX_LOCALSTORAGE_BYTES, 5 * 1024 * 1024);
  assert.equal(MAX_LOCALSTORAGE_BYTES, 5242880);
});

test("getLocalStorageStats returns safe fallback when window is undefined", () => {
  const stats = getLocalStorageStats();
  assert.equal(stats.maxBytes, 5242880);
  assert.equal(stats.usedBytes, 0);
  assert.equal(stats.percentUsed, 0);
  assert.equal(stats.availableBytes, 5242880);
});

test("offline listings filter properly by country (SK vs CZ)", async () => {
  // Mock window.localStorage
  const mockStorage = new Map();
  const storageObj = {
    getItem: (k) => mockStorage.get(k) ?? null,
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k),
    clear: () => mockStorage.clear(),
    get length() { return mockStorage.size; },
    key: (i) => Array.from(mockStorage.keys())[i] ?? null,
  };
  global.window = { localStorage: storageObj };
  global.localStorage = storageObj;

  const { addStoredListings, getStoredListings, setListingsPrefs, getListingsPrefs } =
    await import("../src/lib/offline-storage.ts");

  // Add mixed SK and CZ mock listings
  addStoredListings([
    { id: "1", externalId: "e-1", title: "iPhone 16 SK", country: "SK", price: 800, currency: "EUR" },
    { id: "2", externalId: "e-2", title: "iPhone 16 CZ", country: "CZ", price: 20000, currency: "CZK" },
    { id: "3", externalId: "e-3", title: "MacBook CZ", country: "CZ", price: 35000, currency: "CZK" },
    { id: "4", externalId: "e-4", title: "Samsung SK", country: "SK", price: 400, currency: "EUR" },
  ]);

  // Test ALL
  const allListings = getStoredListings({ country: "ALL" });
  assert.equal(allListings.length, 4);

  // Test CZ only
  const czListings = getStoredListings({ country: "CZ" });
  assert.equal(czListings.length, 2);
  assert.ok(czListings.every((l) => l.country === "CZ"));

  // Test SK only
  const skListings = getStoredListings({ country: "SK" });
  assert.equal(skListings.length, 2);
  assert.ok(skListings.every((l) => l.country === "SK"));

  // Test Preferences persistence for Country
  setListingsPrefs({ watchFilter: "all", countryFilter: "CZ", unreadOnly: false });
  const prefs = getListingsPrefs();
  assert.equal(prefs.countryFilter, "CZ");

  // Clean up global mock
  delete global.window;
  delete global.localStorage;
});
