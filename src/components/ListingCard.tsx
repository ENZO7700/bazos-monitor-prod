import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryName } from "@/lib/categories";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import Image from "next/image";

export interface ListingData {
  id: string;
  title: string;
  price: number | null;
  priceLabel?: string | null;
  currency?: string | null;
  country?: string | null;
  url: string;
  thumbnail?: string | null;
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
  const isCz = listing.country === "CZ" || listing.url.includes(".bazos.cz");
  const currency = listing.currency ?? (isCz ? "CZK" : "EUR");

  return (
    <Card className="overflow-hidden transition-colors hover:border-primary/50">
      <CardContent className="p-0">
        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-4 p-4"
          onClick={() => !listing.isRead && onMarkRead?.(listing.id)}
        >
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            {listing.thumbnail ? (
              <Image
                src={listing.thumbnail}
                alt={listing.title}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Bez foto
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-medium leading-snug">{listing.title}</h3>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
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
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {listing.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {listing.location}
                </span>
              )}
              <span>{formatRelativeTime(listing.publishedAt)}</span>
            </div>
            {listing.listingPhones && listing.listingPhones.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
                {listing.listingPhones.map((p) => (
                  <Badge key={p.phoneE164} variant="outline" className="font-mono text-[10px]">
                    {p.phoneE164}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </a>
      </CardContent>
    </Card>
  );
}
