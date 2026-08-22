import type { ParsedListing } from "./bazos-rss";

export interface WatchFilters {
  keywords: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
}

/**
 * Normalizes text for search (lowercased, removes diacritics / accents).
 */
function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function matchesWatchFilters(
  listing: ParsedListing,
  filters: WatchFilters
): boolean {
  const fullText = normalizeForSearch(
    `${listing.title} ${listing.description ?? ""} ${listing.location ?? ""}`
  );

  // Strict AND matching: All specified keywords must match in title/description/location
  if (filters.keywords && filters.keywords.length > 0) {
    const validKeywords = filters.keywords
      .map((kw) => normalizeForSearch(kw.trim()))
      .filter((kw) => kw.length > 0);

    if (validKeywords.length > 0) {
      const matchesAll = validKeywords.every((kw) => fullText.includes(kw));
      if (!matchesAll) return false;
    }
  }

  // Minimum price filter
  if (filters.minPrice != null) {
    if (listing.price === null) return false;
    if (listing.price < filters.minPrice) return false;
  }

  // Maximum price filter
  if (filters.maxPrice != null) {
    if (listing.price !== null && listing.price > filters.maxPrice) return false;
  }

  return true;
}
