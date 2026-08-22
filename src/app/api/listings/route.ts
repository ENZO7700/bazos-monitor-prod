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

    // Prioritizácia inzerátov s verejným telefónnym číslom
    const sorted = [...listings].sort((a, b) => {
      const aHasPhone = a.listingPhones && a.listingPhones.length > 0 ? 1 : 0;
      const bHasPhone = b.listingPhones && b.listingPhones.length > 0 ? 1 : 0;
      if (aHasPhone !== bHasPhone) {
        return bHasPhone - aHasPhone; // Telefón na prvom mieste
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return NextResponse.json(sorted);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
