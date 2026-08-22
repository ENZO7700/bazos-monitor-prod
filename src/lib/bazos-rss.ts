export type BazosCountry = "SK" | "CZ";
export type BazosCurrency = "EUR" | "CZK";

export interface ParsedListing {
  externalId: string;
  title: string;
  price: number | null;
  priceLabel: string;
  currency: BazosCurrency;
  country: BazosCountry;
  url: string;
  thumbnail: string | null;
  description: string | null;
  location: string | null;
  publishedAt: Date;
}

import { BAZOS_USER_AGENT } from "@/lib/bazos-phone";

export { BAZOS_USER_AGENT };

export function buildRssUrl(category: string, country: BazosCountry = "SK"): string {
  const host = country === "CZ" ? "www.bazos.cz" : "www.bazos.sk";
  return `https://${host}/rss.php?rub=${category}`;
}

export function extractExternalId(url: string): string | null {
  const match = url.match(/\/inzerat\/(\d+)\//);
  return match?.[1] ?? null;
}

export function parsePriceFromTitle(
  title: string,
  country: BazosCountry = "SK"
): {
  name: string;
  price: number | null;
  label: string;
  currency: BazosCurrency;
} {
  const defaultCurrency: BazosCurrency = country === "CZ" ? "CZK" : "EUR";
  const colonIndex = title.lastIndexOf(":");
  if (colonIndex === -1) {
    return { name: title.trim(), price: null, label: "Dohodou", currency: defaultCurrency };
  }

  const name = title.slice(0, colonIndex).trim();
  const rawPrice = title.slice(colonIndex + 1).trim();
  const lower = rawPrice.toLowerCase();

  const nonNumericTokens = [
    "dohodou",
    "v texte",
    "v textu",
    "ponúknite",
    "nabídněte",
    "zadarmo",
    "zdarma",
    "výměna",
    "vymena",
  ];

  if (nonNumericTokens.some((token) => lower === token || lower.includes(token))) {
    return { name, price: null, label: rawPrice || "Dohodou", currency: defaultCurrency };
  }

  let currency = defaultCurrency;
  if (lower.includes("kč") || lower.includes("czk") || lower.includes("kc")) {
    currency = "CZK";
  } else if (lower.includes("€") || lower.includes("eur")) {
    currency = "EUR";
  }

  const numeric = rawPrice
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(/eur/gi, "")
    .replace(/kč/gi, "")
    .replace(/czk/gi, "")
    .replace(/kc/gi, "")
    .replace(/,/g, "");

  const parsed = parseInt(numeric, 10);
  if (!isNaN(parsed)) {
    const formattedPrice =
      currency === "CZK"
        ? `${parsed.toLocaleString("cs-CZ")} Kč`
        : `${parsed.toLocaleString("sk-SK")} €`;
    return { name, price: parsed, label: formattedPrice, currency };
  }

  return { name, price: null, label: rawPrice || "Dohodou", currency };
}

export function extractThumbnail(description: string | undefined): string | null {
  if (!description) return null;
  const match = description.match(/<img[^>]+src="([^"]+)"/i);
  return match?.[1] ?? null;
}

export function stripHtml(description: string | undefined): string | null {
  if (!description) return null;
  return description
    .replace(/<img[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

/** Parsuje mesto z meta tagov alebo textu detailu inzerátu na Bazoši (SK aj CZ). */
export function parseLocationFromListingHtml(html: string): string | null {
  const plain = html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

  const metaMatch = plain.match(/(?:Lokalita|Místo|Miesto):\s*([A-Za-zÁ-ž0-9\s-]+?)(?:\s{2,}|[.,;]|\s+(?:Cena|Meno|Jméno|Telefón|Telefon|Zobrazeno|Videlo)|$)/i);
  if (metaMatch?.[1]) {
    const loc = metaMatch[1].trim();
    if (loc.length >= 2 && loc.length < 80) {
      return loc;
    }
  }

  const ogTitleMatch = html.match(/property="og:title"\s+content="[^"]+\s-\s([^"]+)"/i);
  if (ogTitleMatch?.[1]) {
    return ogTitleMatch[1].trim();
  }

  return null;
}

export async function fetchListingLocation(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": BAZOS_USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;

    const html = await response.text();
    return parseLocationFromListingHtml(html.slice(0, 16384));
  } catch {
    return null;
  }
}
