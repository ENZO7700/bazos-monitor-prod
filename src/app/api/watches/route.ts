import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/api-error";
import { createWatchSchema } from "@/lib/validations";

export async function GET() {
  try {
    const watches = await db.watch.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { listings: true } } },
    });
    return NextResponse.json(watches);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createWatchSchema.parse(body);

    const watch = await db.watch.create({
      data: {
        name: data.name,
        category: data.category,
        keywords: data.keywords,
        minPrice: data.minPrice ?? null,
        maxPrice: data.maxPrice ?? null,
        countries: data.countries ?? ["SK", "CZ"],
      },
    });

    return NextResponse.json(watch, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
