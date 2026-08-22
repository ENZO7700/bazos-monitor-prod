import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/auth";
import { pollAllWatches } from "@/lib/poll-service";
import { fetchFilteredListings } from "@/lib/rss-fetcher";
import type { BazosCountry } from "@/lib/bazos-rss";

export async function POST(request: Request) {
  const isAuth = isCronAuthorized(request);

  try {
    let clientWatches: Array<{
      id: string;
      name: string;
      category: string;
      keywords: string[];
      minPrice?: number | null;
      maxPrice?: number | null;
      countries?: string[];
    }> = [];

    try {
      const body = await request.json();
      if (body && Array.isArray(body.watches)) {
        clientWatches = body.watches;
      }
    } catch {
      // Body is optional
    }

    // 1. Ak máme zadané klientske sledovania (alebo bežíme v režime bez DB)
    if (clientWatches.length > 0) {
      const collectedListings = [];

      for (const watch of clientWatches) {
        const countries = (watch.countries && watch.countries.length > 0
          ? watch.countries
          : ["SK", "CZ"]) as BazosCountry[];

        const listings = await fetchFilteredListings(
          watch.category,
          {
            keywords: watch.keywords || [],
            minPrice: watch.minPrice ?? null,
            maxPrice: watch.maxPrice ?? null,
          },
          countries
        );

        for (const item of listings) {
          collectedListings.push({
            id: `local-${item.country}-${item.externalId}`,
            externalId: item.externalId,
            title: item.title,
            price: item.price,
            priceLabel: item.priceLabel,
            currency: item.currency,
            country: item.country,
            url: item.url,
            thumbnail: item.thumbnail,
            description: item.description,
            location: item.location,
            publishedAt: item.publishedAt.toISOString(),
            isRead: false,
            watchId: watch.id,
            watch: { name: watch.name, category: watch.category },
          });
        }
      }

      return NextResponse.json({
        watchesProcessed: clientWatches.length,
        newListings: collectedListings.length,
        notificationsSent: 0,
        listings: collectedListings,
      });
    }

    // 2. Ak ide o štandardný cron alebo DB polling
    if (!isAuth) {
      // Ak nie je cron secret, skúsime live fallback
      return NextResponse.json({
        watchesProcessed: 0,
        newListings: 0,
        notificationsSent: 0,
        listings: [],
      });
    }

    const result = await pollAllWatches();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Poll failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
