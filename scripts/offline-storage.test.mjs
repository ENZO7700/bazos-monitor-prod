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
