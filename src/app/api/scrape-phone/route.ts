import { NextResponse } from "next/server";
import { extractPhonesFromText } from "@/lib/bazos-phone";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const listingId = searchParams.get("id");

    if (!url) {
      return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
    }

    // Validate that it's a bazos URL
    if (!url.includes("bazos.sk") && !url.includes("bazos.cz")) {
      return NextResponse.json({ error: "Invalid Bazos URL" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "cs,sk;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Bazos returned HTTP ${response.status}`, phones: [] },
        { status: response.status }
      );
    }

    const html = await response.text();

    // 1. Parse phones from full page
    const extracted = extractPhonesFromText(html);

    // 2. Parse seller name (e.g. Jméno: / Meno: <td>...</td> or <b>...</b>)
    let sellerName: string | null = null;
    const nameMatch = html.match(/(?:Jm[eé]no|Meno)\s*:\s*<\/td>\s*<td[^>]*><b>([^<]+)<\/b>/i) ||
                      html.match(/(?:Jm[eé]no|Meno)\s*:\s*<b>([^<]+)<\/b>/i) ||
                      html.match(/(?:Jm[eé]no|Meno)\s*:\s*([^<\n]+)/i);
    if (nameMatch && nameMatch[1]) {
      sellerName = nameMatch[1].trim();
    }

    // 3. Parse location
    let location: string | null = null;
    const locMatch = html.match(/(?:Lokalita|Mesto|M[eě]sto)\s*:\s*<\/td>\s*<td[^>]*>([^<]+)/i) ||
                     html.match(/(?:Lokalita|Mesto|M[eě]sto)\s*:\s*<b>([^<]+)<\/b>/i);
    if (locMatch && locMatch[1]) {
      location = locMatch[1].replace(/&nbsp;/g, " ").trim();
    }

    // If listingId provided and DB is online, update database
    if (listingId && extracted.phones.length > 0) {
      try {
        for (const phone of extracted.phones) {
          await db.listingPhone.upsert({
            where: {
              listingId_phoneE164: {
                listingId,
                phoneE164: phone,
              },
            },
            update: {},
            create: {
              listingId,
              phoneE164: phone,
              phoneRaw: phone,
            },
          });
        }
      } catch {
        // DB not available - ignore and return client response
      }
    }

    return NextResponse.json({
      success: true,
      url,
      phones: extracted.phones,
      raw: extracted.raw,
      sellerName,
      location,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to scrape phone";
    return NextResponse.json({ error: message, phones: [] }, { status: 500 });
  }
}
