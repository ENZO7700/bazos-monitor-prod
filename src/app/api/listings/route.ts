import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const watchId = searchParams.get("watchId");
    const unread = searchParams.get("unread") === "true";
    const country = searchParams.get("country");
    const limit = searchParams.get("limit");

    const listings = await db.listing.findMany({
      where: {
        ...(watchId ? { watchId } : {}),
        ...(unread ? { isRead: false } : {}),
        ...(country && country !== "ALL" ? { country } : {}),
      },
      include: {
        watch: { select: { name: true, category: true } },
        listingPhones: {
          select: { phoneE164: true, phoneRaw: true },
        },
      },
      orderBy: { publishedAt: "desc" },
      ...(limit ? { take: parseInt(limit, 10) } : {}),
    });

    return NextResponse.json(listings);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
