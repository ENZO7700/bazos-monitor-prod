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
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export function getWatches(): Promise<Watch[]> {
  return fetchJson("/api/watches");
}

export function createWatch(data: {
  name: string;
  category: string;
  keywords: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  countries?: string[];
}): Promise<Watch> {
  return fetchJson("/api/watches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function updateWatch(
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
  return fetchJson(`/api/watches/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function deleteWatch(id: string): Promise<void> {
  return fetchJson(`/api/watches/${id}`, { method: "DELETE" });
}

export function getListings(params?: {
  watchId?: string;
  unread?: boolean;
  country?: string;
  limit?: number;
}): Promise<Listing[]> {
  const search = new URLSearchParams();
  if (params?.watchId) search.set("watchId", params.watchId);
  if (params?.unread) search.set("unread", "true");
  if (params?.country && params.country !== "ALL") search.set("country", params.country);
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return fetchJson(`/api/listings${qs ? `?${qs}` : ""}`);
}

export function markListingRead(id: string): Promise<Listing> {
  return fetchJson(`/api/listings/${id}/read`, { method: "PATCH" });
}

export function getStats(): Promise<Stats> {
  return fetchJson("/api/stats");
}

export function triggerPoll(): Promise<PollResponse> {
  return fetchJson("/api/poll", { method: "POST" });
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

export function getPhoneWatches(): Promise<PhoneWatch[]> {
  return fetchJson("/api/phone-watches");
}

export function createPhoneWatch(data: {
  phone: string;
  label?: string | null;
  notes?: string | null;
}): Promise<PhoneWatch> {
  return fetchJson("/api/phone-watches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function updatePhoneWatch(
  id: string,
  data: Partial<{
    phone: string;
    label: string | null;
    notes: string | null;
    active: boolean;
  }>
): Promise<PhoneWatch> {
  return fetchJson(`/api/phone-watches/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function deletePhoneWatch(id: string): Promise<void> {
  return fetchJson(`/api/phone-watches/${id}`, { method: "DELETE" });
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
