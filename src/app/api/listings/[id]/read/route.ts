import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: Params) {
  const { id } = await params;
  const listing = await db.listing.update({
    where: { id },
    data: { isRead: true },
  });
  return NextResponse.json(listing);
}
