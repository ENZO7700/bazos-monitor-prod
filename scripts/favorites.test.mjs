import test from "node:test";
import assert from "node:assert/strict";
import {
  getStoredFavoriteIds,
  isStoredFavorite,
  toggleStoredFavorite,
  getStoredFavoriteListings,
  addStoredListings,
  FAVORITES_KEY,
} from "../src/lib/offline-storage.ts";

test("Favorites: toggles and persists favorites in LocalStorage", () => {
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

  // Initial state: no favorites
  assert.deepEqual(getStoredFavoriteIds(), []);
  assert.equal(isStoredFavorite("item-100"), false);

  // Toggle on
  const isFav1 = toggleStoredFavorite("item-100");
  assert.equal(isFav1, true);
  assert.equal(isStoredFavorite("item-100"), true);
  assert.deepEqual(getStoredFavoriteIds(), ["item-100"]);

  // Add another favorite
  const isFav2 = toggleStoredFavorite("item-200");
  assert.equal(isFav2, true);
  assert.deepEqual(getStoredFavoriteIds(), ["item-200", "item-100"]);

  // Toggle off item-100
  const isFav1Off = toggleStoredFavorite("item-100");
  assert.equal(isFav1Off, false);
  assert.equal(isStoredFavorite("item-100"), false);
  assert.deepEqual(getStoredFavoriteIds(), ["item-200"]);

  delete global.window;
  delete global.localStorage;
});

test("Favorites: retrieves full listing objects for favorited IDs", () => {
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

  // Add sample listings
  addStoredListings([
    { id: "fav-1", externalId: "ext-1", title: "iPhone 16 Pro", price: 25000, country: "CZ" },
    { id: "fav-2", externalId: "ext-2", title: "MacBook Air M2", price: 21000, country: "CZ" },
    { id: "unfav-3", externalId: "ext-3", title: "Starý monitor", price: 500, country: "CZ" },
  ]);

  // Favorite only fav-1 and fav-2
  toggleStoredFavorite("fav-1");
  toggleStoredFavorite("fav-2");

  const favListings = getStoredFavoriteListings();
  assert.equal(favListings.length, 2);
  assert.ok(favListings.some((l) => l.id === "fav-1"));
  assert.ok(favListings.some((l) => l.id === "fav-2"));
  assert.ok(!favListings.some((l) => l.id === "unfav-3"));

  delete global.window;
  delete global.localStorage;
});
