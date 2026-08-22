import type { Listing, Watch, PhoneWatch, Stats } from "@/lib/api";
import { extractPhonesFromText } from "@/lib/bazos-phone";

const LISTINGS_PREFS_KEY = "bazos:listings-prefs";
const INSTALL_DISMISSED_KEY = "bazos:install-dismissed";
const LAST_SYNC_KEY = "bazos:last-sync";
const CACHED_LISTINGS_KEY = "bazos:cached-listings";
const WATCHES_KEY = "bazos:watches";
const PHONE_WATCHES_KEY = "bazos:phone-watches";

/**
 * Pevný limit pamäte pre LocalStorage na zariadenie: 5 MB (5 * 1024 * 1024 bajtov)
 */
export const MAX_LOCALSTORAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ListingsPrefs {
  watchFilter: string;
  countryFilter?: string;
  unreadOnly: boolean;
}

export interface StorageStats {
  usedBytes: number;
  maxBytes: number;
  percentUsed: number;
  availableBytes: number;
}

/**
 * Predvolené počiatočné sledovania (ČR & SK) pre čistý štart bez databázy
 */
export const DEFAULT_LOCAL_WATCHES: Watch[] = [
  {
    id: "local-watch-iphone-cz",
    name: "iPhone 16 / 17 (Praha & ČR)",
    category: "mo",
    keywords: ["iphone"],
    minPrice: null,
    maxPrice: null,
    countries: ["CZ"],
    isActive: true,
    lastChecked: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "local-watch-macbook-cz",
    name: "Apple MacBook od 20 000 Kč (Praha & ČR)",
    category: "pc",
    keywords: ["macbook"],
    minPrice: 20000,
    maxPrice: null,
    countries: ["CZ"],
    isActive: true,
    lastChecked: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "local-watch-razer-cz",
    name: "Notebook Razer Gaming (Praha & ČR)",
    category: "pc",
    keywords: ["razer"],
    minPrice: null,
    maxPrice: null,
    countries: ["CZ"],
    isActive: true,
    lastChecked: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "local-watch-phone-sk",
    name: "Mobil do 400 € (Slovensko)",
    category: "mo",
    keywords: [],
    minPrice: null,
    maxPrice: 400,
    countries: ["SK"],
    isActive: true,
    lastChecked: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

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

  if (itemBytes > MAX_LOCALSTORAGE_BYTES) {
    console.warn(`[LocalStorage] Položka ${key} prekračuje maximálny limit 5MB.`);
    return false;
  }

  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    // Pri pretečení kvóty uvoľníme staré inzeráty a skúsime znova
    try {
      localStorage.removeItem(CACHED_LISTINGS_KEY);
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  }
}

/* =========================================================================
   WATCHES (Sledovania v LocalStorage)
   ========================================================================= */

export function getStoredWatches(): Watch[] {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_LOCAL_WATCHES;
  const raw = localStorage.getItem(WATCHES_KEY);
  if (!raw) {
    writeJson(WATCHES_KEY, DEFAULT_LOCAL_WATCHES);
    return DEFAULT_LOCAL_WATCHES;
  }
  try {
    const parsed = JSON.parse(raw) as Watch[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LOCAL_WATCHES;
  } catch {
    return DEFAULT_LOCAL_WATCHES;
  }
}

export function saveStoredWatch(data: Omit<Watch, "id" | "createdAt" | "lastChecked"> & { id?: string }): Watch {
  const current = getStoredWatches();
  const id = data.id || `local-watch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const existingIndex = current.findIndex((w) => w.id === id);
  let updatedWatch: Watch;

  if (existingIndex >= 0) {
    updatedWatch = {
      ...current[existingIndex],
      ...data,
      id,
    };
    current[existingIndex] = updatedWatch;
  } else {
    updatedWatch = {
      id,
      name: data.name,
      category: data.category,
      keywords: data.keywords,
      minPrice: data.minPrice ?? null,
      maxPrice: data.maxPrice ?? null,
      countries: data.countries ?? ["SK", "CZ"],
      isActive: data.isActive ?? true,
      lastChecked: now,
      createdAt: now,
      _count: { listings: 0 },
    };
    current.unshift(updatedWatch);
  }

  writeJson(WATCHES_KEY, current);
  return updatedWatch;
}

export function deleteStoredWatch(id: string): void {
  const current = getStoredWatches();
  const filtered = current.filter((w) => w.id !== id);
  writeJson(WATCHES_KEY, filtered);
}

/* =========================================================================
   LISTINGS (Inzeráty v LocalStorage)
   ========================================================================= */

/**
 * Zistí, či inzerát obsahuje verejné telefónne číslo (v objekte listingPhones, popise alebo nadpise).
 */
export function hasPublicPhone(l: Listing): boolean {
  if (l.listingPhones && l.listingPhones.length > 0) return true;
  if (l.description || l.title) {
    const text = `${l.title} ${l.description || ""}`;
    const extracted = extractPhonesFromText(text);
    return extracted.phones.length > 0;
  }
  return false;
}

export function getStoredListings(params?: {
  watchId?: string;
  unread?: boolean;
  country?: string;
  limit?: number;
}): Listing[] {
  let listings = readJson<Listing[]>(CACHED_LISTINGS_KEY, []);

  if (params?.watchId) {
    listings = listings.filter((l) => l.watchId === params.watchId);
  }
  if (params?.unread) {
    listings = listings.filter((l) => !l.isRead);
  }
  if (params?.country && params.country !== "ALL") {
    listings = listings.filter((l) => l.country === params.country);
  }

  // ⭐ PRIORITA: Inzeráty s verejným telefónnym číslom sa zobrazujú ako prvé!
  listings.sort((a, b) => {
    const aHasPhone = hasPublicPhone(a) ? 1 : 0;
    const bHasPhone = hasPublicPhone(b) ? 1 : 0;
    if (aHasPhone !== bHasPhone) {
      return bHasPhone - aHasPhone; // Inzeráty s telefónom idú dopredu!
    }
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  if (params?.limit && params.limit > 0) {
    listings = listings.slice(0, params.limit);
  }

  return listings;
}

export function markStoredListingRead(id: string): Listing | null {
  const listings = readJson<Listing[]>(CACHED_LISTINGS_KEY, []);
  const index = listings.findIndex((l) => l.id === id);
  if (index >= 0) {
    listings[index].isRead = true;
    writeJson(CACHED_LISTINGS_KEY, listings);
    return listings[index];
  }
  return null;
}

export function addStoredListings(newListings: Listing[]): { added: number; total: number } {
  const current = readJson<Listing[]>(CACHED_LISTINGS_KEY, []);
  const existingExternalIds = new Set(current.map((l) => `${l.country}:${l.externalId}`));

  let added = 0;
  const toAdd: Listing[] = [];

  for (const item of newListings) {
    const key = `${item.country}:${item.externalId}`;
    if (!existingExternalIds.has(key)) {
      // Automaticky doplň telefónne čísla z popisu, ak chýbajú
      const resolvedPhones =
        item.listingPhones && item.listingPhones.length > 0
          ? item.listingPhones
          : extractPhonesFromText(`${item.title} ${item.description || ""}`).phones.map((p) => ({
              phoneE164: p,
              phoneRaw: p,
            }));

      toAdd.push({
        ...item,
        listingPhones: resolvedPhones,
      });
      existingExternalIds.add(key);
      added++;
    }
  }

  // Prepend new listings and trim to max 200 items (under 5MB)
  const merged = [...toAdd, ...current].slice(0, 200);
  writeJson(CACHED_LISTINGS_KEY, merged);
  setLastSync(new Date().toISOString());

  return { added, total: merged.length };
}

/* =========================================================================
   STATS & PREFERENCES (Štatistiky v LocalStorage)
   ========================================================================= */

export function getStoredStats(): Stats {
  const watches = getStoredWatches();
  const listings = readJson<Listing[]>(CACHED_LISTINGS_KEY, []);
  const todayStr = new Date().toISOString().slice(0, 10);

  const activeWatches = watches.filter((w) => w.isActive).length;
  const newToday = listings.filter((l) => l.publishedAt && l.publishedAt.slice(0, 10) === todayStr).length;
  const unread = listings.filter((l) => !l.isRead).length;

  return { activeWatches, newToday, unread };
}

export function getListingsPrefs(): ListingsPrefs {
  return readJson<ListingsPrefs>(LISTINGS_PREFS_KEY, {
    watchFilter: "all",
    countryFilter: "CZ",
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

export function cacheListings(listings: Listing[]): void {
  setLastSync(new Date().toISOString());
  const trimmed = listings.slice(0, 200);
  writeJson(CACHED_LISTINGS_KEY, trimmed);
}

export function getCachedListings(): Listing[] {
  return readJson<Listing[]>(CACHED_LISTINGS_KEY, []);
}

/* =========================================================================
   PHONE WATCHES (Watchlist v LocalStorage)
   ========================================================================= */

export function getStoredPhoneWatches(): PhoneWatch[] {
  return readJson<PhoneWatch[]>(PHONE_WATCHES_KEY, []);
}

export function saveStoredPhoneWatch(data: { phone: string; label?: string | null; notes?: string | null }): PhoneWatch {
  const list = getStoredPhoneWatches();
  const id = `local-phone-${Date.now()}`;
  const item: PhoneWatch = {
    id,
    label: data.label ?? null,
    phoneE164: data.phone.startsWith("+") ? data.phone : `+${data.phone}`,
    phoneRaw: data.phone,
    notes: data.notes ?? null,
    active: true,
    createdAt: new Date().toISOString(),
    matchCount: 0,
    unreadMatches: 0,
  };
  list.unshift(item);
  writeJson(PHONE_WATCHES_KEY, list);
  return item;
}

export function deleteStoredPhoneWatch(id: string): void {
  const list = getStoredPhoneWatches();
  writeJson(PHONE_WATCHES_KEY, list.filter((p) => p.id !== id));
}
