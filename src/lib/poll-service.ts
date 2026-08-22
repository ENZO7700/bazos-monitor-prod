import { db } from "@/lib/db";
import { fetchListingPublicDetails } from "@/lib/bazos-phone";
import { fetchFilteredListings } from "@/lib/rss-fetcher";
import { sendPushNotification } from "@/lib/push";
import { sleep } from "@/lib/utils";

export interface PollResult {
  watchesProcessed: number;
  newListings: number;
  notificationsSent: number;
  phoneMatches: number;
}

async function storeListingPhones(
  listingId: string,
  phones: string[],
  raw: string[]
): Promise<void> {
  for (let i = 0; i < phones.length; i++) {
    const phoneE164 = phones[i];
    const phoneRaw = raw[i] ?? phoneE164;
    await db.listingPhone.upsert({
      where: {
        listingId_phoneE164: { listingId, phoneE164 },
      },
      create: { listingId, phoneE164, phoneRaw },
      update: { phoneRaw },
    });
  }

  await db.listing.update({
    where: { id: listingId },
    data: { phonesFetchedAt: new Date() },
  });
}

/**
 * Match listing phones against active PhoneWatch entries; create PhoneMatch + optional push.
 */
export async function matchListingPhones(
  listingId: string,
  listingTitle: string,
  listingUrl: string,
  phoneE164List: string[]
): Promise<{ matches: number; notificationsSent: number }> {
  if (phoneE164List.length === 0) return { matches: 0, notificationsSent: 0 };

  const watches = await db.phoneWatch.findMany({
    where: {
      active: true,
      phoneE164: { in: phoneE164List },
    },
  });

  let matches = 0;
  let notificationsSent = 0;
  for (const watch of watches) {
    const existing = await db.phoneMatch.findUnique({
      where: {
        phoneWatchId_listingId: {
          phoneWatchId: watch.id,
          listingId,
        },
      },
    });
    if (existing) continue;

    await db.phoneMatch.create({
      data: {
        phoneWatchId: watch.id,
        listingId,
      },
    });
    matches++;

    const label = watch.label ? ` (${watch.label})` : "";
    notificationsSent += await sendPushNotification(
      `Podozrivé číslo ${watch.phoneE164}${label}`,
      `V inzeráte: ${listingTitle}`,
      listingUrl
    );
  }

  return { matches, notificationsSent };
}

export async function pollAllWatches(): Promise<PollResult> {
  const watches = await db.watch.findMany({ where: { isActive: true } });
  let newListings = 0;
  let notificationsSent = 0;
  let phoneMatches = 0;

  for (const watch of watches) {
    const countries =
      Array.isArray(watch.countries) && watch.countries.length > 0
        ? (watch.countries as Array<"SK" | "CZ">)
        : (["SK", "CZ"] as Array<"SK" | "CZ">);

    const listings = await fetchFilteredListings(
      watch.category,
      {
        keywords: watch.keywords,
        minPrice: watch.minPrice,
        maxPrice: watch.maxPrice,
      },
      countries
    );

    for (const listing of listings) {
      const existing = await db.listing.findUnique({
        where: {
          watchId_externalId_country: {
            watchId: watch.id,
            externalId: listing.externalId,
            country: listing.country,
          },
        },
        include: { listingPhones: true },
      });

      // Already in DB with phones fetched — skip detail re-fetch
      if (existing?.phonesFetchedAt) continue;

      // Existing but phones not yet fetched — backfill phones only
      if (existing && !existing.phonesFetchedAt) {
        const details = await fetchListingPublicDetails(listing.url);
        await storeListingPhones(existing.id, details.phones, details.raw);
        if (!existing.location && details.location) {
          await db.listing.update({
            where: { id: existing.id },
            data: { location: details.location },
          });
        }
        const backfillMatch = await matchListingPhones(
          existing.id,
          existing.title,
          existing.url,
          details.phones
        );
        phoneMatches += backfillMatch.matches;
        notificationsSent += backfillMatch.notificationsSent;
        await sleep(400);
        continue;
      }

      // New listing — one public HTML fetch for location + phones
      const details = await fetchListingPublicDetails(listing.url);

      const created = await db.listing.create({
        data: {
          externalId: listing.externalId,
          title: listing.title,
          price: listing.price,
          priceLabel: listing.priceLabel,
          currency: listing.currency,
          country: listing.country,
          url: listing.url,
          thumbnail: listing.thumbnail,
          description: listing.description,
          location: details.location,
          publishedAt: listing.publishedAt,
          watchId: watch.id,
          phonesFetchedAt: new Date(),
          listingPhones: {
            create: details.phones.map((phoneE164, i) => ({
              phoneE164,
              phoneRaw: details.raw[i] ?? phoneE164,
            })),
          },
        },
      });

      newListings++;
      const flag = listing.country === "CZ" ? "🇨🇿" : "🇸🇰";
      const sent = await sendPushNotification(
        `${flag} Nový inzerát: ${watch.name}`,
        `${listing.title}${details.location ? ` — ${details.location}` : ""} — ${listing.priceLabel}`,
        listing.url
      );
      notificationsSent += sent;

      const newMatch = await matchListingPhones(
        created.id,
        listing.title,
        listing.url,
        details.phones
      );
      phoneMatches += newMatch.matches;
      notificationsSent += newMatch.notificationsSent;

      await sleep(400);
    }

    await db.watch.update({
      where: { id: watch.id },
      data: { lastChecked: new Date() },
    });

    await sleep(1500);
  }

  return {
    watchesProcessed: watches.length,
    newListings,
    notificationsSent,
    phoneMatches,
  };
}
