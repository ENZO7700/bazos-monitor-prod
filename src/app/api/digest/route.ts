import { NextResponse } from "next/server";
import { generateEspressoDigest, sendEspressoDigestPush } from "@/lib/digest-service";

export async function GET() {
  try {
    const digest = await generateEspressoDigest();
    return NextResponse.json(digest);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chyba pri generovaní digestu";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const message = error instanceof Error ? error.message : "Chyba pri generovaní digestu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
