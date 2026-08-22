import type { Listing } from "@/lib/api";

const LISTINGS_PREFS_KEY = "bazos:listings-prefs";
const INSTALL_DISMISSED_KEY = "bazos:install-dismissed";
const LAST_SYNC_KEY = "bazos:last-sync";
const CACHED_LISTINGS_KEY = "bazos:cached-listings";

/**
 * Pevný limit pamäte pre LocalStorage na zariadenie: 5 MB (5 * 1024 * 1024 bajtov)
 */
export const MAX_LOCALSTORAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ListingsPrefs {
  watchFilter: string;
  unreadOnly: boolean;
}

export interface StorageStats {
  usedBytes: number;
  maxBytes: number;
  percentUsed: number;
  availableBytes: number;
}

/**
 * Zmeria aktuálnu veľkosť dát uložených v localStorage.
 */
export function getLocalStorageUsage(): number {
  if (typeof window === "undefined" || !window.localStorage) return 0;
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) ?? "";
        // UTF-16 znaky = 2 bajty
        total += (key.length + value.length) * 2;
      }
    }
  } catch {
    // Ignorovať chyby prístupu
  }
  return total;
}

/**
 * Vráti štatistiky zaplnenia 5MB pamäte.
 */
export function getLocalStorageStats(): StorageStats {
  const usedBytes = getLocalStorageUsage();
  const maxBytes = MAX_LOCALSTORAGE_BYTES;
  const percentUsed = Math.min(100, Math.round((usedBytes / maxBytes) * 100));
  const availableBytes = Math.max(0, maxBytes - usedBytes);

  return {
    usedBytes,
    maxBytes,
    percentUsed,
    availableBytes,
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Bezpečný zápis do localStorage s ochranou proti prekročeniu 5MB kvóty.
 */
function writeJson(key: string, value: unknown): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  const serialized = JSON.stringify(value);
  const itemBytes = (key.length + serialized.length) * 2;

  // Ak samotná položka presahuje 5MB limit
  if (itemBytes > MAX_LOCALSTORAGE_BYTES) {
    console.warn(`[LocalStorage] Položka ${key} prekračuje maximálny limit 5MB.`);
    return false;
  }

  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    // Pri pretečení kvóty uvoľníme staré inzeráty a skúsime znova
    console.warn("[LocalStorage] QuotaExceededError – uvoľňujem cache inzerátov...");
    try {
      localStorage.removeItem(CACHED_LISTINGS_KEY);
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  }
}

export function getListingsPrefs(): ListingsPrefs {
  return readJson<ListingsPrefs>(LISTINGS_PREFS_KEY, {
    watchFilter: "all",
    unreadOnly: false,
  });
}

export function setListingsPrefs(prefs: ListingsPrefs): void {
  writeJson(LISTINGS_PREFS_KEY, prefs);
}

export function isInstallDismissed(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  return localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
}

export function setInstallDismissed(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
}

export function getLastSync(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSync(iso: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  localStorage.setItem(LAST_SYNC_KEY, iso);
}

/**
 * Uloží inzeráty do offline pamäte (s limitom na max 200 najnovších pre úsporu miesta pod 5MB).
 */
export function cacheListings(listings: Listing[]): void {
  setLastSync(new Date().toISOString());
  // Uložíme max 200 najnovších inzerátov, aby sme nikdy neprekročili 5MB pamäte
  const trimmed = listings.slice(0, 200);
  writeJson(CACHED_LISTINGS_KEY, trimmed);
}

export function getCachedListings(): Listing[] {
  return readJson<Listing[]>(CACHED_LISTINGS_KEY, []);
}
