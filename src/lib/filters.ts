import type { ParsedListing } from "./bazos-rss";

export interface WatchFilters {
  keywords: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
}

export function matchesWatchFilters(
  listing: ParsedListing,
  filters: WatchFilters
): boolean {
  const haystack = `${listing.title} ${listing.description ?? ""}`.toLowerCase();

  if (filters.keywords.length > 0) {
    const hasKeyword = filters.keywords.some((kw) =>
      haystack.includes(kw.toLowerCase().trim())
    );
    if (!hasKeyword) return false;
  }

  if (filters.minPrice != null && listing.price != null) {
    if (listing.price < filters.minPrice) return false;
  }

  if (filters.maxPrice != null && listing.price != null) {
    if (listing.price > filters.maxPrice) return false;
  }

  if (filters.minPrice != null && listing.price === null) {
    return false;
  }

  return true;
}
