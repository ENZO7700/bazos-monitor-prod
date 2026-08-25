import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { generateEspressoDigest, sendEspressoDigestPush } from "@/lib/digest-service";

export async function GET() {
  try {
    const digest = await generateEspressoDigest();
    return NextResponse.json(digest);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const shouldPush = url.searchParams.get("push") === "true";

    if (shouldPush) {
      const result = await sendEspressoDigestPush();
      return NextResponse.json(result);
    }

    const digest = await generateEspressoDigest();
    return NextResponse.json({ digest, sentCount: 0 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
