import type { Listing } from "@/lib/api";
import { extractPhonesFromText } from "@/lib/bazos-phone";

export interface ContactEntry {
  phone: string;
  name: string;
  location: string;
  country: "CZ" | "SK";
  listingCount: number;
  listings: Array<{
    id: string;
    title: string;
    price: number | null;
    priceFormatted: string;
    url: string;
  }>;
}

/**
 * Extracts and groups unique seller contacts from a list of listings.
 */
export function extractContactsFromListings(listings: Listing[]): ContactEntry[] {
  const map = new Map<string, ContactEntry>();

  for (const item of listings) {
    const phones =
      item.listingPhones && item.listingPhones.length > 0
        ? item.listingPhones.map((p) => p.phoneE164)
        : extractPhonesFromText(`${item.title} ${item.description || ""}`).phones;

    const isCz = item.country === "CZ" || item.url.includes(".bazos.cz");
    const country = isCz ? "CZ" : "SK";
    const location = item.location || (isCz ? "Česká republika" : "Slovensko");
    const sellerName = `Predajca ${item.location ? `(${item.location})` : item.id.slice(0, 6)}`;

    for (const phone of phones) {
      if (!map.has(phone)) {
        map.set(phone, {
          phone,
          name: sellerName,
          location,
          country,
          listingCount: 0,
          listings: [],
        });
      }

      const entry = map.get(phone)!;
      entry.listingCount += 1;
      entry.listings.push({
        id: item.id,
        title: item.title,
        price: item.price ?? null,
        priceFormatted: item.price ? `${item.price} ${country === "CZ" ? "Kč" : "€"}` : "Dohodou",
        url: item.url,
      });
    }
  }

  // Sort by number of listings descending (multi-ad sellers first)
  return Array.from(map.values()).sort((a, b) => b.listingCount - a.listingCount);
}

/**
 * Generates standard vCard 3.0 string for iOS / Android contacts import.
 */
export function generateVcfContacts(contacts: ContactEntry[]): string {
  const cards = contacts.map((c) => {
    const titles = c.listings.map((l) => l.title).slice(0, 3).join(", ");
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:Bazoš: ${c.name} (${c.country})`,
      `N:${c.name};;;;`,
      `TEL;TYPE=CELL:${c.phone}`,
      `ADR;TYPE=HOME:;;;${c.location};;;`,
      `NOTE:Bazoš inzeráty (${c.listingCount}x): ${titles}`,
      "END:VCARD",
    ].join("\r\n");
  });

  return cards.join("\r\n");
}

/**
 * Generates CSV string with UTF-8 BOM for Excel.
 */
export function generateCsvContacts(contacts: ContactEntry[]): string {
  const header = "Telefón,Krajina,Lokalita,Počet inzerátov,Inzeráty";
  const rows = contacts.map((c) => {
    const titles = c.listings.map((l) => `"${l.title.replace(/"/g, '""')} (${l.priceFormatted})"`).join(" | ");
    return `"${c.phone}","${c.country}","${c.location.replace(/"/g, '""')}",${c.listingCount},"${titles}"`;
  });

  return "\uFEFF" + [header, ...rows].join("\r\n");
}

/**
 * Triggers a browser file download.
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
