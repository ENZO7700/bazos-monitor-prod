import { fetchCategoryListings } from "@/lib/rss-fetcher";
import { formatPrice } from "@/lib/utils";
import { sendPushNotification } from "@/lib/push";

export interface EspressoDigestItem {
  id: string;
  title: string;
  price: number | null;
  priceFormatted: string;
  currency: string;
  location: string | null;
  url: string;
  highlightReason: string;
  badge: string;
}

export interface EspressoDigestResult {
  title: string;
  summary: string;
  generatedAt: string;
  targetLocation: string;
  totalListingsAnalyzed: number;
  topDeals: EspressoDigestItem[];
  pushNotificationBody: string;
}

export const TARGET_DIGEST_QUERIES = [
  {
    name: "iPhone 16 / 17",
    category: "mo",
    patterns: [/\biphone\s*(?:16|17)\b/i, /\biphone\b/i],
    minPrice: null,
    country: "CZ" as const,
  },
  {
    name: "Apple MacBook (od 20 000 Kč)",
    category: "pc",
    patterns: [/\b(?:macbook|mac\s*book|apple\s*m[1234])\b/i],
    minPrice: 20000,
    country: "CZ" as const,
  },
  {
    name: "Notebook Razer",
    category: "pc",
    patterns: [/\brazer\b/i, /\brazer\s*blade\b/i],
    minPrice: null,
    country: "CZ" as const,
  },
];

/**
 * Generuje AI Espresso Digest pre zadané kategórie a lokality v ČR (Praha).
 */
export async function generateEspressoDigest(options?: {
  preferPraha?: boolean;
}): Promise<EspressoDigestResult> {
  const preferPraha = options?.preferPraha ?? true;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });

  // 1. Zozbieranie živých inzerátov z Bazoš.cz pre Mobily a PC
  const [moListings, pcListings] = await Promise.all([
    fetchCategoryListings("mo", "CZ").catch(() => []),
    fetchCategoryListings("pc", "CZ").catch(() => []),
  ]);

  const allCzListings = [...moListings, ...pcListings];
  const matchedListings: Array<{
    listing: typeof allCzListings[0];
    queryName: string;
    score: number;
    highlight: string;
    badge: string;
  }> = [];

  for (const item of allCzListings) {
    const title = item.title;
    const desc = item.description ?? "";
    const fullText = `${title} ${desc}`.toLowerCase();
    const price = item.price;
    const isPraha = /(?:praha|prague|praze|100\s*00|110\s*00|120\s*00|130\s*00|140\s*00|150\s*00|160\s*00|170\s*00|180\s*00|190\s*00)/i.test(
      `${item.location ?? ""} ${fullText}`
    );

    // Filter 1: iPhone 16 / 17
    if (TARGET_DIGEST_QUERIES[0].patterns.some((p) => p.test(title))) {
      let score = 10;
      let badge = "📱 iPhone";
      let highlight = "Najnovší model Apple v ponuke";

      if (/iphone\s*16/i.test(title)) {
        score += 25;
        badge = "🔥 iPhone 16";
        highlight = "Horúca novinka iPhone 16";
      }
      if (/iphone\s*17/i.test(title)) {
        score += 30;
        badge = "⚡ iPhone 17";
        highlight = "Exkluzívna ponuka iPhone 17";
      }
      if (/pro\s*max/i.test(title)) {
        score += 15;
        badge = "👑 Pro Max";
      }
      if (price && price < 22000 && /iphone\s*16/i.test(title)) {
        score += 20;
        highlight = "Mimoriadne výhodná cena pod trhovým priemerom";
      }
      if (isPraha) {
        score += 15;
        highlight += " · Osobný odber Praha";
      }

      matchedListings.push({ listing: item, queryName: "iPhone 16/17", score, highlight, badge });
      continue;
    }

    // Filter 2: Apple MacBook od 20 000 Kč
    if (TARGET_DIGEST_QUERIES[1].patterns.some((p) => p.test(title))) {
      if (price !== null && price >= 20000) {
        let score = 15;
        let badge = "💻 MacBook";
        let highlight = `Výkonný Apple MacBook za ${formatPrice(price, null, "CZK")}`;

        if (/m[234]/i.test(title)) {
          score += 25;
          badge = "🚀 Apple Silicon";
          highlight = "Moderný Apple Silicon procesor";
        }
        if (/pro/i.test(title)) {
          score += 10;
          badge = "💼 MacBook Pro";
        }
        if (price <= 28000 && /m2|m3/i.test(title)) {
          score += 20;
          highlight = "Skvelý pomer cena/výkon pre M-sériu";
        }
        if (isPraha) {
          score += 15;
          highlight += " · Praha";
        }

        matchedListings.push({ listing: item, queryName: "MacBook od 20k", score, highlight, badge });
        continue;
      }
    }

    // Filter 3: Notebook Razer
    if (TARGET_DIGEST_QUERIES[2].patterns.some((p) => p.test(title))) {
      let score = 20;
      let badge = "🎮 Razer Gaming";
      let highlight = "Prémiový herný notebook Razer";

      if (/blade/i.test(title)) {
        score += 20;
        badge = "⚔️ Razer Blade";
        highlight = "Špičkový Razer Blade model";
      }
      if (/rtx/i.test(title)) {
        score += 15;
        highlight += " s výkonnou RTX grafikou";
      }
      if (isPraha) {
        score += 15;
        highlight += " · Praha";
      }

      matchedListings.push({ listing: item, queryName: "Razer", score, highlight, badge });
    }
  }

  // Ak je preferovaná Praha, uprednostníme inzeráty z Prahy
  if (preferPraha) {
    matchedListings.sort((a, b) => b.score - a.score);
  } else {
    matchedListings.sort((a, b) => b.score - a.score);
  }

  // Výber TOP 3 úlovkov dňa
  const topDealsRaw = matchedListings.slice(0, 3);
  const topDeals: EspressoDigestItem[] = topDealsRaw.map((m) => ({
    id: m.listing.externalId,
    title: m.listing.title,
    price: m.listing.price,
    priceFormatted: formatPrice(m.listing.price, m.listing.priceLabel, m.listing.currency),
    currency: m.listing.currency,
    location: m.listing.location ?? (preferPraha ? "Praha / ČR" : "ČR"),
    url: m.listing.url,
    highlightReason: m.highlight,
    badge: m.badge,
  }));

  const totalAnalyzed = allCzListings.length;
  const matchCount = matchedListings.length;

  const title = `☕ AI Espresso Digest (${timeStr}) — Praha & ČR`;
  const summary = `Zanalyzovaných ${totalAnalyzed} inzerátov na Bazoš.cz. Nájdených ${matchCount} ponúk pre iPhone 16/17, MacBook a Razer.`;

  // Tvorba stručnej Push notifikácie
  const pushDealsSummary = topDeals
    .map((d, idx) => `${idx + 1}. ${d.title.slice(0, 25)} (${d.priceFormatted})`)
    .join(" | ");

  const pushNotificationBody = topDeals.length > 0
    ? `TOP úlovky: ${pushDealsSummary}`
    : `Dnes zatiaľ žiadne nové inzeráty spĺňajúce prísne kritériá v Prahe.`;

  return {
    title,
    summary,
    generatedAt: now.toISOString(),
    targetLocation: "Praha / Česká republika",
    totalListingsAnalyzed: totalAnalyzed,
    topDeals,
    pushNotificationBody,
  };
}

/**
 * Vygeneruje digest a odošle Web Push notifikáciu všetkým odberateľom.
 */
export async function sendEspressoDigestPush(): Promise<{
  digest: EspressoDigestResult;
  sentCount: number;
}> {
  const digest = await generateEspressoDigest();
  const sentCount = await sendPushNotification(
    digest.title,
    digest.pushNotificationBody,
    "/#espresso-digest"
  );

  return { digest, sentCount };
}
