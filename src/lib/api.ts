import {
  getStoredWatches,
  saveStoredWatch,
  deleteStoredWatch,
  getStoredListings,
  markStoredListingRead,
  addStoredListings,
  getStoredStats,
  getStoredPhoneWatches,
  saveStoredPhoneWatch,
  deleteStoredPhoneWatch,
} from "./offline-storage";

export interface Watch {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  minPrice: number | null;
  maxPrice: number | null;
  countries: string[];
  isActive: boolean;
  lastChecked: string | null;
  createdAt: string;
  _count?: { listings: number };
}

export interface ListingPhone {
  phoneE164: string;
  phoneRaw: string;
}

export interface Listing {
  id: string;
  externalId: string;
  title: string;
  price: number | null;
  priceLabel: string | null;
  currency: string;
  country: string;
  url: string;
  thumbnail: string | null;
  description: string | null;
  location: string | null;
  publishedAt: string;
  isRead: boolean;
  watchId: string;
  watch?: { name: string; category: string };
  listingPhones?: ListingPhone[];
  phonesFetchedAt?: string | null;
}

export interface PhoneWatch {
  id: string;
  label: string | null;
  phoneE164: string;
  phoneRaw: string;
  notes: string | null;
  active: boolean;
  createdAt: string;
  matchCount?: number;
  unreadMatches?: number;
}

export interface PhoneSearchListing {
  id: string;
  title: string;
  price: number | null;
  priceLabel: string | null;
  url: string;
  location: string | null;
  publishedAt: string;
  phoneRaw: string;
  phoneE164: string;
  foundAt: string;
  watch?: { name: string; category: string };
}

export interface PhoneSearchResult {
  phoneE164: string;
  query: string;
  enriched: number;
  listings: PhoneSearchListing[];
  phoneWatch: {
    id: string;
    label: string | null;
    active: boolean;
    matches: Array<{
      id: string;
      matchedAt: string;
      seen: boolean;
      listing: PhoneSearchListing & { watch?: { name: string; category: string } };
    }>;
  } | null;
}

export interface PhoneMatch {
  id: string;
  matchedAt: string;
  seen: boolean;
  phoneWatch: {
    id: string;
    label: string | null;
    phoneE164: string;
    phoneRaw: string;
  };
  listing: {
    id: string;
    title: string;
    price: number | null;
    priceLabel: string | null;
    url: string;
    location: string | null;
    publishedAt: string;
    watch?: { name: string; category: string };
  };
}

export interface Stats {
  activeWatches: number;
  newToday: number;
  unread: number;
}

export interface PollResponse {
  watchesProcessed: number;
  newListings: number;
  notificationsSent: number;
  phoneMatches?: number;
  listings?: Listing[];
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export async function getWatches(): Promise<Watch[]> {
  try {
    const remote = await fetchJson<Watch[]>("/api/watches");
    if (Array.isArray(remote) && remote.length > 0) {
      return remote;
    }
    return getStoredWatches();
  } catch {
    return getStoredWatches();
  }
}

export async function createWatch(data: {
  name: string;
  category: string;
  keywords: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  countries?: string[];
}): Promise<Watch> {
  try {
    const created = await fetchJson<Watch>("/api/watches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    saveStoredWatch(created);
    return created;
  } catch {
    return saveStoredWatch({
      name: data.name,
      category: data.category,
      keywords: data.keywords,
      minPrice: data.minPrice ?? null,
      maxPrice: data.maxPrice ?? null,
      countries: data.countries ?? ["SK", "CZ"],
      isActive: true,
    });
  }
}

export async function updateWatch(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    keywords: string[];
    minPrice: number | null;
    maxPrice: number | null;
    countries: string[];
    isActive: boolean;
  }>
): Promise<Watch> {
  try {
    const updated = await fetchJson<Watch>(`/api/watches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    saveStoredWatch(updated);
    return updated;
  } catch {
    const stored = getStoredWatches().find((w) => w.id === id);
    if (stored) {
      return saveStoredWatch({
        ...stored,
        ...data,
        id,
      });
    }
    throw new Error("Sledovanie nenájdené");
  }
}

export async function deleteWatch(id: string): Promise<void> {
  try {
    await fetchJson(`/api/watches/${id}`, { method: "DELETE" });
  } catch {
    // Offline mode
  }
  deleteStoredWatch(id);
}

export async function getListings(params?: {
  watchId?: string;
  unread?: boolean;
  country?: string;
  limit?: number;
}): Promise<Listing[]> {
  try {
    const search = new URLSearchParams();
    if (params?.watchId) search.set("watchId", params.watchId);
    if (params?.unread) search.set("unread", "true");
    if (params?.country && params.country !== "ALL") search.set("country", params.country);
    if (params?.limit) search.set("limit", String(params.limit));
    const qs = search.toString();

    const remote = await fetchJson<Listing[]>(`/api/listings${qs ? `?${qs}` : ""}`);
    if (Array.isArray(remote)) {
      addStoredListings(remote);
      return remote;
    }
    return getStoredListings(params);
  } catch {
    return getStoredListings(params);
  }
}

export async function markListingRead(id: string): Promise<Listing> {
  try {
    return await fetchJson(`/api/listings/${id}/read`, { method: "PATCH" });
  } catch {
    const updated = markStoredListingRead(id);
    if (updated) return updated;
    return { id, isRead: true } as Listing;
  }
}

export async function getStats(): Promise<Stats> {
  try {
    return await fetchJson<Stats>("/api/stats");
  } catch {
    return getStoredStats();
  }
}

export async function triggerPoll(): Promise<PollResponse> {
  try {
    const watches = getStoredWatches();
    const res = await fetchJson<PollResponse>("/api/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ watches }),
    });

    if (res.listings && Array.isArray(res.listings)) {
      addStoredListings(res.listings);
    }
    return res;
  } catch {
    return {
      watchesProcessed: getStoredWatches().length,
      newListings: 0,
      notificationsSent: 0,
    };
  }
}

export function subscribePush(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON();
  return fetchJson("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });
}

export function unsubscribePush(endpoint: string): Promise<void> {
  return fetchJson("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}

export async function getPhoneWatches(): Promise<PhoneWatch[]> {
  try {
    return await fetchJson("/api/phone-watches");
  } catch {
    return getStoredPhoneWatches();
  }
}

export async function createPhoneWatch(data: {
  phone: string;
  label?: string | null;
  notes?: string | null;
}): Promise<PhoneWatch> {
  try {
    return await fetchJson("/api/phone-watches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    return saveStoredPhoneWatch(data);
  }
}

export async function updatePhoneWatch(
  id: string,
  data: Partial<{
    phone: string;
    label: string | null;
    notes: string | null;
    active: boolean;
  }>
): Promise<PhoneWatch> {
  try {
    return await fetchJson(`/api/phone-watches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    const list = getStoredPhoneWatches();
    const item = list.find((p) => p.id === id);
    if (item) {
      Object.assign(item, data);
      return item;
    }
    throw new Error("Phone watch not found");
  }
}

export async function deletePhoneWatch(id: string): Promise<void> {
  try {
    await fetchJson(`/api/phone-watches/${id}`, { method: "DELETE" });
  } catch {
    // Offline
  }
  deleteStoredPhoneWatch(id);
}

export function searchPhone(
  phone: string,
  options?: { enrich?: boolean }
): Promise<PhoneSearchResult> {
  const search = new URLSearchParams({ phone });
  if (options?.enrich) search.set("enrich", "true");
  return fetchJson(`/api/phone-watches/search?${search.toString()}`);
}

export function getPhoneMatches(params?: {
  unseen?: boolean;
  limit?: number;
}): Promise<PhoneMatch[]> {
  const search = new URLSearchParams();
  if (params?.unseen) search.set("unseen", "true");
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return fetchJson(`/api/phone-watches/matches${qs ? `?${qs}` : ""}`);
}

export function markPhoneMatchesSeen(data: {
  ids?: string[];
  markAllSeen?: boolean;
}): Promise<{ updated: number }> {
  return fetchJson("/api/phone-watches/matches", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
