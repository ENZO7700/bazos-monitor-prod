/** Phone extraction & SK/CZ normalization from public Bazos listing HTML/text. */

export const BAZOS_USER_AGENT =
  "BazosMonitor/1.0 (+https://bazos-monitor.vercel.app)";

/**
 * Matches common SK/CZ phone formats in free text / HTML.
 * Captures the full candidate; validation happens in normalizePhoneE164.
 */
const PHONE_CANDIDATE_RE =
  /(?:\+|00)?(?:421|420)?[\s./()-]*0?[\s./()-]*(?:\d[\s./()-]*){8,11}\d/g;

/** Strip HTML tags to plain text for phone scanning. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a phone string to E.164-ish SK/CZ form:
 * - 0901234567 → +421901234567
 * - +421 901 234 567 → +421901234567
 * - 00421901234567 → +421901234567
 * - +420 601 123 456 → +420601123456
 * Returns null if not a plausible SK/CZ number.
 */
export function normalizePhoneE164(input: string): string | null {
  if (!input || typeof input !== "string") return null;

  let digits = input.replace(/\D/g, "");
  if (!digits) return null;

  // 00xx international prefix
  if (digits.startsWith("00421")) {
    digits = "421" + digits.slice(5);
  } else if (digits.startsWith("00420")) {
    digits = "420" + digits.slice(5);
  }

  // National SK: 0 + 9 digits (e.g. 0901234567)
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "421" + digits.slice(1);
  }

  // Bare 9-digit SK mobile without leading 0 (e.g. 901234567) — only if starts with 9
  if (digits.length === 9 && digits.startsWith("9")) {
    digits = "421" + digits;
  }

  // SK: +421 + 9 subscriber digits
  if (digits.startsWith("421") && digits.length === 12) {
    const sub = digits.slice(3);
    // Reject obvious non-phone: all same digit, leading 0 after country
    if (/^(\d)\1{8}$/.test(sub)) return null;
    if (sub.startsWith("0")) return null;
    return `+${digits}`;
  }

  // CZ: +420 + 9 subscriber digits
  if (digits.startsWith("420") && digits.length === 12) {
    const sub = digits.slice(3);
    if (/^(\d)\1{8}$/.test(sub)) return null;
    if (sub.startsWith("0")) return null;
    return `+${digits}`;
  }

  return null;
}

function looksLikeFalsePositive(raw: string, e164: string): boolean {
  const digits = raw.replace(/\D/g, "");

  // Very short fragments
  if (digits.length < 9) return true;

  // Slovak postal codes are 5 digits (sometimes with space: 811 01) — already filtered by length,
  // but prices like "1 500 €" or "15000" can appear inside longer digit runs.
  // Reject if the candidate is pure 5-digit-ish after strip of country-ish noise.
  if (digits.length === 5) return true;

  // IČO is typically 8 digits — reject bare 8-digit sequences that didn't expand to E.164 SK/CZ
  // (normalize already fails those). Extra guard: e164 subscriber part that is sequential junk.
  const sub = e164.replace(/^\+42[01]/, "");
  if (sub.length !== 9) return true;

  // Prices often appear as 3–5 digit amounts; if the raw had a euro/currency nearby we can't see it here.
  // Reject numbers that look like years + something short already handled.

  // Common fake / placeholder patterns
  if (/^(\+421|\+420)0{9}$/.test(e164)) return true;
  if (/^(\+421|\+420)123456789$/.test(e164)) return true;

  return false;
}

export interface ExtractedPhones {
  /** Unique E.164 forms */
  phones: string[];
  /** Raw occurrences aligned to first time each E.164 was seen */
  raw: string[];
}

/**
 * Extract and normalize phone numbers from free text or HTML.
 * Returns unique E.164 phones plus a raw sample for each.
 */
export function extractPhonesFromText(htmlOrText: string): ExtractedPhones {
  if (!htmlOrText) return { phones: [], raw: [] };

  const text = htmlOrText.includes("<")
    ? htmlToPlainText(htmlOrText)
    : htmlOrText;

  const phones: string[] = [];
  const raw: string[] = [];
  const seen = new Set<string>();

  const matches = text.match(PHONE_CANDIDATE_RE) ?? [];
  for (const m of matches) {
    const trimmed = m.trim();
    const e164 = normalizePhoneE164(trimmed);
    if (!e164) continue;
    if (looksLikeFalsePositive(trimmed, e164)) continue;
    if (seen.has(e164)) continue;
    seen.add(e164);
    phones.push(e164);
    raw.push(trimmed.replace(/\s+/g, " ").trim());
  }

  return { phones, raw };
}

/**
 * GET public listing URL and extract phones from HTML (same UA as location fetch).
 */
export async function fetchListingPhones(
  url: string
): Promise<ExtractedPhones> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": BAZOS_USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { phones: [], raw: [] };

    const html = await response.text();
    // Full page body — phones often appear in description / contact blocks
    return extractPhonesFromText(html);
  } catch {
    return { phones: [], raw: [] };
  }
}

/**
 * Single public HTML fetch: location + phones (rate-limit friendly).
 */
export async function fetchListingPublicDetails(url: string): Promise<{
  location: string | null;
  phones: string[];
  raw: string[];
}> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": BAZOS_USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return { location: null, phones: [], raw: [] };
    }

    const html = await response.text();
    // Lazy import-free: location parser lives in bazos-rss; inline minimal reuse via dynamic to avoid cycle.
    const { parseLocationFromListingHtml } = await import("@/lib/bazos-rss");
    const location = parseLocationFromListingHtml(html.slice(0, 16384));
    const { phones, raw } = extractPhonesFromText(html);
    return { location, phones, raw };
  } catch {
    return { location: null, phones: [], raw: [] };
  }
}
