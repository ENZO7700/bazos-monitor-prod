import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/api-error";
import { normalizePhoneE164 } from "@/lib/bazos-phone";
import { createPhoneWatchSchema } from "@/lib/validations";

export async function GET() {
  try {
    const watches = await db.phoneWatch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
        matches: {
          where: { seen: false },
          select: { id: true },
        },
      },
    });

    const payload = watches.map((w) => ({
      id: w.id,
      label: w.label,
      phoneE164: w.phoneE164,
      phoneRaw: w.phoneRaw,
      notes: w.notes,
      active: w.active,
      createdAt: w.createdAt,
      matchCount: w._count.matches,
      unreadMatches: w.matches.length,
    }));

    return NextResponse.json(payload);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createPhoneWatchSchema.parse(body);
    const phoneE164 = normalizePhoneE164(data.phone);

    if (!phoneE164) {
      return NextResponse.json(
        { error: "Neplatné telefónne číslo (očakávaný SK/CZ formát)" },
        { status: 400 }
      );
    }

    const existing = await db.phoneWatch.findUnique({
      where: { phoneE164 },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Toto číslo už je vo watchliste", id: existing.id },
        { status: 409 }
      );
    }

    const watch = await db.phoneWatch.create({
      data: {
        phoneE164,
        phoneRaw: data.phone.trim(),
        label: data.label?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    // Match against already stored listing phones
    const listingPhones = await db.listingPhone.findMany({
      where: { phoneE164 },
      select: { listingId: true },
    });

    for (const lp of listingPhones) {
      await db.phoneMatch.upsert({
        where: {
          phoneWatchId_listingId: {
            phoneWatchId: watch.id,
            listingId: lp.listingId,
          },
        },
        create: {
          phoneWatchId: watch.id,
          listingId: lp.listingId,
        },
        update: {},
      });
    }

    return NextResponse.json(
      { ...watch, matchCount: listingPhones.length, unreadMatches: listingPhones.length },
      { status: 201 }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
