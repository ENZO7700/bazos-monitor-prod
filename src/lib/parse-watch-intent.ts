import { getCategoryName } from "@/lib/categories";
import { localMistralClassifier } from "@/lib/mistral";

export interface ParsedWatchIntent {
  name: string;
  category: string;
  keywords: string[];
  minPrice: number | null;
  maxPrice: number | null;
  countries: string[];
  confidence: "high" | "low";
}

export function parseWatchIntent(input: string): ParsedWatchIntent {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      name: "",
      category: "mo",
      keywords: [],
      minPrice: null,
      maxPrice: null,
      countries: ["SK", "CZ"],
      confidence: "low",
    };
  }

  const result = localMistralClassifier(trimmed);
  const hasPrice = result.minPrice !== null || result.maxPrice !== null;
  const hasCategoryPattern =
    trimmed.toLowerCase() !== "niečo lacné" &&
    (result.category !== "mo" ||
      /(?:mobil|telef[oó]n|iphone|samsung|smartf[oó]n)/i.test(trimmed));
  const isSpecific =
    (hasCategoryPattern && result.keywords.length > 0) ||
    (hasPrice && result.keywords.length > 0);

  return {
    name: result.name,
    category: result.category,
    keywords: result.keywords,
    minPrice: result.minPrice,
    maxPrice: result.maxPrice,
    countries: result.countries,
    confidence: isSpecific ? "high" : "low",
  };
}

export function formatWatchIntentSummary(intent: ParsedWatchIntent): string {
  const parts = [getCategoryName(intent.category)];
  if (intent.countries && intent.countries.length === 1) {
    parts.push(intent.countries[0] === "CZ" ? "🇨🇿 Bazoš.cz" : "🇸🇰 Bazoš.sk");
  }
  if (intent.keywords && intent.keywords.length) parts.push(intent.keywords.join(", "));
  if (intent.maxPrice != null) parts.push(`max ${intent.maxPrice} €`);
  if (intent.minPrice != null) parts.push(`min ${intent.minPrice} €`);
  return parts.join(" · ");
}

export function buildWatchPrefillUrl(intent: ParsedWatchIntent): string {
  const params = new URLSearchParams();
  if (intent.name) params.set("name", intent.name);
  if (intent.category) params.set("category", intent.category);
  if (intent.keywords.length) params.set("keywords", intent.keywords.join(", "));
  if (intent.minPrice !== null) params.set("minPrice", String(intent.minPrice));
  if (intent.maxPrice !== null) params.set("maxPrice", String(intent.maxPrice));
  if (intent.countries && intent.countries.length > 0) {
    params.set("countries", intent.countries.join(","));
  }
  return `/watches/new?${params.toString()}`;
}
