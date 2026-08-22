"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ExternalLink,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  MessageSquare,
  PhoneCall,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryName } from "@/lib/categories";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import { extractPhonesFromText } from "@/lib/bazos-phone";
import { calculateDistanceFromVaclavak } from "@/lib/praha-distance";
import { isStoredFavorite, toggleStoredFavorite, addStoredListings } from "@/lib/offline-storage";

export interface ListingData {
  id: string;
  externalId?: string;
  watchId?: string;
  title: string;
  price: number | null;
  priceLabel?: string | null;
  currency?: string | null;
  country?: string | null;
  url: string;
  thumbnail?: string | null;
  description?: string | null;
  location?: string | null;
  publishedAt: string;
  isRead: boolean;
  watch?: { name: string; category?: string };
  listingPhones?: Array<{ phoneE164: string; phoneRaw: string }>;
}

interface ListingCardProps {
  listing: ListingData;
  onMarkRead?: (id: string) => void;
}

export function ListingCard({ listing, onMarkRead }: ListingCardProps) {
  const [secondPhotoFailed, setSecondPhotoFailed] = useState(false);
  const isCz = listing.country === "CZ" || listing.url.includes(".bazos.cz");
  const currency = listing.currency ?? (isCz ? "CZK" : "EUR");

  // Derive secondary photo if thumbnail exists
  const primaryThumbnail = listing.thumbnail;
  const secondaryThumbnail =
    primaryThumbnail && !secondPhotoFailed
      ? primaryThumbnail.replace(/\/img\/[1t]\//, "/img/2/")
      : null;

  // Extract phones from listingPhones prop or fallback to description/title
  const knownPhones = listing.listingPhones?.map((p) => p.phoneE164) || [];
  if (knownPhones.length === 0 && (listing.description || listing.title)) {
    const textToScan = `${listing.title} ${listing.description || ""}`;
    const extracted = extractPhonesFromText(textToScan);
    knownPhones.push(...extracted.phones);
  }
  const uniquePhones = Array.from(new Set(knownPhones));

  // Vzdialenosť od centra Prahy (Václavák) a odhad ceny Bolt taxíka
  const vaclavakInfo = isCz && listing.location ? calculateDistanceFromVaclavak(listing.location) : null;

  // Stav obľúbeného inzerátu (Záložky / Bookmarks)
  const [isFav, setIsFav] = useState(() => (typeof window !== "undefined" ? isStoredFavorite(listing.id) : false));

  // On-demand phone discovery state
  const [discoveredPhones, setDiscoveredPhones] = useState<string[]>([]);
  const [isScrapingPhone, setIsScrapingPhone] = useState(false);

  const allPhones = Array.from(new Set([...uniquePhones, ...discoveredPhones]));

  const handleScrapePhone = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isScrapingPhone) return;
    setIsScrapingPhone(true);
    try {
      const res = await fetch(`/api/scrape-phone?url=${encodeURIComponent(listing.url)}&id=${listing.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.phones && data.phones.length > 0) {
          setDiscoveredPhones(data.phones);
          // Persist to LocalStorage
          addStoredListings([
            {
              id: listing.id,
              externalId: listing.externalId || listing.id,
              watchId: listing.watchId || "general",
              title: listing.title,
              price: listing.price,
              priceLabel: listing.priceLabel ?? null,
              currency: listing.currency ?? (isCz ? "CZK" : "EUR"),
              country: listing.country ?? (isCz ? "CZ" : "SK"),
              url: listing.url,
              thumbnail: listing.thumbnail ?? null,
              description: listing.description ?? null,
              location: data.location || listing.location,
              publishedAt: listing.publishedAt,
              isRead: listing.isRead,
              watch: listing.watch ? { name: listing.watch.name, category: listing.watch.category || "mo" } : undefined,
              listingPhones: data.phones.map((p: string) => ({ phoneE164: p, phoneRaw: p })),
            },
          ]);
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsScrapingPhone(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
      <CardContent className="p-0">
        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-3 p-4 sm:flex-row sm:gap-4"
          onClick={() => !listing.isRead && onMarkRead?.(listing.id)}
        >
          {/* Photo gallery preview (At least 2 photos if available) */}
          <div className="flex shrink-0 gap-1.5 sm:flex-col">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/50">
              {primaryThumbnail ? (
                <Image
                  src={primaryThumbnail}
                  alt={listing.title}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                  Bez foto
                </div>
              )}
            </div>

            {/* 2nd Photo if available */}
            {secondaryThumbnail && secondaryThumbnail !== primaryThumbnail && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/50">
                <Image
                  src={secondaryThumbnail}
                  alt={`${listing.title} - foto 2`}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  unoptimized
                  onError={() => setSecondPhotoFailed(true)}
                />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-medium leading-snug">{listing.title}</h3>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const next = toggleStoredFavorite(listing.id);
                    setIsFav(next);
                  }}
                  className="rounded-full p-1 text-muted-foreground transition-all hover:bg-rose-500/10 hover:text-rose-500"
                  title={isFav ? "Odstrániť z obľúbených" : "Uložiť do obľúbených"}
                >
                  <Heart
                    className={`h-4 w-4 transition-transform active:scale-125 ${
                      isFav ? "fill-rose-500 text-rose-500 scale-110" : ""
                    }`}
                  />
                </button>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-primary">
                {formatPrice(listing.price, listing.priceLabel, currency)}
              </span>
              <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                {isCz ? "🇨🇿 CZ" : "🇸🇰 SK"}
              </Badge>
              {!listing.isRead && <Badge variant="new">Nové</Badge>}
              {listing.watch?.category && (
                <Badge variant="outline">{getCategoryName(listing.watch.category)}</Badge>
              )}
              {listing.watch && (
                <Badge variant="secondary">{listing.watch.name}</Badge>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              {listing.location && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {listing.location}
                </span>
              )}
              <span>{formatRelativeTime(listing.publishedAt)}</span>

              {/* Vzdialenosť od Václaváku a Bolt taxi kalkulátor */}
              {vaclavakInfo && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-medium px-2 py-0.5">
                    📍 {vaclavakInfo.formattedDistance}
                  </Badge>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(vaclavakInfo.bolt.boltUrl, "_blank", "noopener,noreferrer");
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-2xs"
                    title={`Odhadovaná cena odvozu z/do centra: ${vaclavakInfo.bolt.formattedPrice}`}
                  >
                    <span>🚕 Bolt {vaclavakInfo.bolt.formattedPrice}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Prominent Phone Number section with WhatsApp, SMS and On-demand Scraper */}
            <div className="mt-2.5 pt-2 border-t border-border/40 flex flex-wrap items-center gap-2">
              {allPhones.length > 0 ? (
                allPhones.map((phone) => {
                  const cleanDigits = phone.replace(/\D/g, "");
                  const inquiryMsg = encodeURIComponent(
                    `Dobrý deň, mám záujem o Váš inzerát na Bazoši: "${listing.title}" za ${formatPrice(listing.price, listing.priceLabel, currency)}. Je ešte voľný?`
                  );
                  return (
                    <div key={phone} className="flex flex-wrap items-center gap-1.5">
                      {/* 1-Click Direct Call */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `tel:${phone}`;
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold font-mono text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors shadow-xs"
                        title="Klikni pre vytočenie hovoru"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>{phone}</span>
                      </button>

                      {/* 1-Click WhatsApp */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(`https://wa.me/${cleanDigits}?text=${inquiryMsg}`, "_blank", "noopener,noreferrer");
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-green-500/30 bg-green-500/10 px-2 py-1 text-[11px] font-medium text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
                        title="Napísať predajcovi na WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>WhatsApp</span>
                      </button>

                      {/* 1-Click SMS */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `sms:${phone}?body=${inquiryMsg}`;
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                        title="Poslať SMS predajcovi"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>SMS</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <button
                  type="button"
                  disabled={isScrapingPhone}
                  onClick={handleScrapePhone}
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-60"
                  title="Zistiť telefónne číslo z detailu inzerátu"
                >
                  {isScrapingPhone ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Zisťujem tel. číslo...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5" />
                      <span>🔍 Zistiť tel. číslo</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  );
}
