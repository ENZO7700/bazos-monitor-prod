import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { isCronAuthorized } from "@/lib/auth";
import { pollAllWatches } from "@/lib/poll-service";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pollAllWatches();
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
