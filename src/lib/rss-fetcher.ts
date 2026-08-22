import Parser from "rss-parser";
import {
  buildRssUrl,
  extractExternalId,
  extractThumbnail,
  parsePriceFromTitle,
  stripHtml,
  type BazosCountry,
  type ParsedListing,
} from "./bazos-rss";
import { matchesWatchFilters, type WatchFilters } from "./filters";

const parser = new Parser({
  customFields: {
    item: [],
  },
  headers: {
    "User-Agent": "BazosMonitor/1.0 (+https://bazos-monitor.vercel.app)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
  timeout: 10000,
});

export async function fetchCategoryListings(
  category: string,
  country: BazosCountry = "SK"
): Promise<ParsedListing[]> {
  try {
    const feed = await parser.parseURL(buildRssUrl(category, country));
    const listings: ParsedListing[] = [];

    for (const item of feed.items) {
      if (!item.link) continue;

      const externalId = extractExternalId(item.link);
      if (!externalId) continue;

      const { name, price, label, currency } = parsePriceFromTitle(
        item.title ?? "",
        country
      );
      const description = stripHtml(item.content ?? item.contentSnippet ?? item.summary);

      listings.push({
        externalId,
        title: name,
        price,
        priceLabel: label,
        currency,
        country,
        url: item.link,
        thumbnail: extractThumbnail(item.content ?? item.contentSnippet),
        description,
        location: null,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      });
    }

    return listings;
  } catch (error) {
    console.error(`Failed to fetch RSS for category '${category}' (${country}):`, error);
    return [];
  }
}

export async function fetchFilteredListings(
  category: string,
  filters: WatchFilters,
  countries: BazosCountry[] = ["SK", "CZ"]
): Promise<ParsedListing[]> {
  const activeCountries: BazosCountry[] =
    countries.length > 0 ? countries : ["SK", "CZ"];

  const resultsByCountry = await Promise.all(
    activeCountries.map((country) => fetchCategoryListings(category, country))
  );

  const allListings = resultsByCountry.flat();
  return allListings.filter((listing) => matchesWatchFilters(listing, filters));
}
