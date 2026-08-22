import type { Listing } from "@/lib/api";

const LISTINGS_PREFS_KEY = "bazos:listings-prefs";
const INSTALL_DISMISSED_KEY = "bazos:install-dismissed";
const LAST_SYNC_KEY = "bazos:last-sync";

export interface ListingsPrefs {
  watchFilter: string;
  unreadOnly: boolean;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
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
  if (typeof window === "undefined") return false;
  return localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
}

export function setInstallDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
}

export function getLastSync(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSync(iso: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNC_KEY, iso);
}

export function cacheListings(listings: Listing[]): void {
  setLastSync(new Date().toISOString());
  writeJson("bazos:cached-listings", listings);
}

export function getCachedListings(): Listing[] {
  return readJson<Listing[]>("bazos:cached-listings", []);
}
