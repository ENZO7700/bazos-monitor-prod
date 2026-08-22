import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/api-error";
import {
  fetchListingPublicDetails,
  normalizePhoneE164,
} from "@/lib/bazos-phone";
import { sleep } from "@/lib/utils";

/**
 * GET /api/phone-watches/search?phone=0901...&enrich=true
 * Search already downloaded listings for a phone.
 * Optional enrich=true: backfill phones on listings without phonesFetchedAt (rate-limited).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneParam = searchParams.get("phone") ?? "";
    const enrich = searchParams.get("enrich") === "true";

    const phoneE164 = normalizePhoneE164(phoneParam);
    if (!phoneE164) {
      return NextResponse.json(
        { error: "Neplatné telefónne číslo" },
        { status: 400 }
      );
    }

    let enriched = 0;
    if (enrich) {
      // Only listings from active watches that never had phones fetched — max 15 per request
      const pending = await db.listing.findMany({
        where: {
          phonesFetchedAt: null,
          watch: { isActive: true },
        },
        take: 15,
        orderBy: { publishedAt: "desc" },
        select: { id: true, url: true, location: true },
      });

      for (const row of pending) {
        const details = await fetchListingPublicDetails(row.url);
        for (let i = 0; i < details.phones.length; i++) {
          await db.listingPhone.upsert({
            where: {
              listingId_phoneE164: {
                listingId: row.id,
                phoneE164: details.phones[i],
              },
            },
            create: {
              listingId: row.id,
              phoneE164: details.phones[i],
              phoneRaw: details.raw[i] ?? details.phones[i],
            },
            update: {
              phoneRaw: details.raw[i] ?? details.phones[i],
            },
          });
        }
        await db.listing.update({
          where: { id: row.id },
          data: {
            phonesFetchedAt: new Date(),
            ...(row.location || !details.location
              ? {}
              : { location: details.location }),
          },
        });
        enriched++;
        await sleep(400);
      }
    }

    const listingPhones = await db.listingPhone.findMany({
      where: { phoneE164 },
      include: {
        listing: {
          include: {
            watch: { select: { name: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Deduplicate by listing id (same listing can appear under multiple watches)
    const seenListings = new Set<string>();
    const listings = [];
    for (const lp of listingPhones) {
      if (seenListings.has(lp.listingId)) continue;
      seenListings.add(lp.listingId);
      listings.push({
        id: lp.listing.id,
        title: lp.listing.title,
        price: lp.listing.price,
        priceLabel: lp.listing.priceLabel,
        url: lp.listing.url,
        location: lp.listing.location,
        publishedAt: lp.listing.publishedAt,
        phoneRaw: lp.phoneRaw,
        phoneE164: lp.phoneE164,
        foundAt: lp.createdAt,
        watch: lp.listing.watch,
      });
    }

    const phoneWatch = await db.phoneWatch.findUnique({
      where: { phoneE164 },
      include: {
        matches: {
          include: {
            listing: {
              include: {
                watch: { select: { name: true, category: true } },
              },
            },
          },
          orderBy: { matchedAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      phoneE164,
      query: phoneParam,
      enriched,
      listings,
      phoneWatch: phoneWatch
        ? {
            id: phoneWatch.id,
            label: phoneWatch.label,
            active: phoneWatch.active,
            matches: phoneWatch.matches.map((m) => ({
              id: m.id,
              matchedAt: m.matchedAt,
              seen: m.seen,
              listing: {
                id: m.listing.id,
                title: m.listing.title,
                price: m.listing.price,
                priceLabel: m.listing.priceLabel,
                url: m.listing.url,
                location: m.listing.location,
                publishedAt: m.listing.publishedAt,
                watch: m.listing.watch,
              },
            })),
          }
        : null,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
