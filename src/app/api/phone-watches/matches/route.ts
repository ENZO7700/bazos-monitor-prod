import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/api-error";

/**
 * GET /api/phone-watches/matches?unseen=true
 * List phone matches (alerts).
 * PATCH body: { ids?: string[], markAllSeen?: boolean }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unseen = searchParams.get("unseen") === "true";
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50", 10) || 50,
      100
    );

    const matches = await db.phoneMatch.findMany({
      where: unseen ? { seen: false } : undefined,
      include: {
        phoneWatch: {
          select: {
            id: true,
            label: true,
            phoneE164: true,
            phoneRaw: true,
          },
        },
        listing: {
          include: {
            watch: { select: { name: true, category: true } },
          },
        },
      },
      orderBy: { matchedAt: "desc" },
      take: limit,
    });

    return NextResponse.json(matches);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      ids?: string[];
      markAllSeen?: boolean;
    };

    if (body.markAllSeen) {
      const result = await db.phoneMatch.updateMany({
        where: { seen: false },
        data: { seen: true },
      });
      return NextResponse.json({ updated: result.count });
    }

    if (body.ids?.length) {
      const result = await db.phoneMatch.updateMany({
        where: { id: { in: body.ids } },
        data: { seen: true },
      });
      return NextResponse.json({ updated: result.count });
    }

    return NextResponse.json({ error: "ids or markAllSeen required" }, { status: 400 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
