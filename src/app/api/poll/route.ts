import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/auth";
import { pollAllWatches } from "@/lib/poll-service";

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pollAllWatches();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Poll failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
