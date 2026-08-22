import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/auth";
import { sendEspressoDigestPush } from "@/lib/digest-service";

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendEspressoDigestPush();
    return NextResponse.json({
      success: true,
      sentCount: result.sentCount,
      title: result.digest.title,
      topDealsCount: result.digest.topDeals.length,
      generatedAt: result.digest.generatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron digest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
