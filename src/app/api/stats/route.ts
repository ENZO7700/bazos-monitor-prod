import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/api-error";
import { startOfDay } from "date-fns";

export async function GET() {
  try {
    const today = startOfDay(new Date());

    const [activeWatches, newToday, unread] = await Promise.all([
      db.watch.count({ where: { isActive: true } }),
      db.listing.count({ where: { createdAt: { gte: today } } }),
      db.listing.count({ where: { isRead: false } }),
    ]);

    return NextResponse.json({ activeWatches, newToday, unread });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
