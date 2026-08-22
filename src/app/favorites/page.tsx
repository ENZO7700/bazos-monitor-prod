"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Heart, ArrowLeft, Trash2, ArrowUpDown, MapPin, Phone, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getListings, type Listing } from "@/lib/api";
import {
  getStoredFavoriteIds,
  getStoredFavoriteListings,
  FAVORITES_KEY,
} from "@/lib/offline-storage";
import { calculateDistanceFromVaclavak } from "@/lib/praha-distance";
import { formatPrice } from "@/lib/utils";

export default function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setFavoriteIds(getStoredFavoriteIds());

    // Listen to storage events to stay in sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY) {
        setFavoriteIds(getStoredFavoriteIds());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Fetch all listings to match favorites, with fallback to offline storage
  const { data: allListings } = useQuery({
    queryKey: ["listings", { limit: 100 }],
    queryFn: () => getListings({ limit: 100 }),
    enabled: isClient,
  });

  // Resolve favorite listings from live query or offline cached favorites
  const favoriteListings: Listing[] = isClient
    ? (allListings?.filter((l) => favoriteIds.includes(l.id)) ?? getStoredFavoriteListings())
    : [];

  // Comparison metrics (Porovnávač)
  const prices = favoriteListings
    .map((l) => l.price)
    .filter((p): p is number => p !== null && p > 0);

  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;

  const listingsWithPhone = favoriteListings.filter(
    (l) => (l.listingPhones && l.listingPhones.length > 0) || l.description?.includes("+420") || l.description?.includes("+421")
  ).length;

  const czListings = favoriteListings.filter((l) => l.country === "CZ");
  const distances = czListings
    .map((l) => calculateDistanceFromVaclavak(l.location)?.km)
    .filter((d): d is number => d !== undefined);
  const minDistance = distances.length > 0 ? Math.min(...distances) : null;

  const handleClearFavorites = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(FAVORITES_KEY);
      setFavoriteIds([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="❤️ Obľúbené inzeráty"
          description="Tvoje uložené ponuky a rýchly porovnávač cien a vzdialeností."
        />
        {favoriteIds.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFavorites}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Vymazať všetko
          </Button>
        )}
      </div>

      {favoriteListings.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <Heart className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Zatiaľ nemáš žiadne obľúbené inzeráty</h3>
              <p className="text-sm text-muted-foreground">
                Klikni na ikonku ❤️ srdiečka pri akomkoľvek inzeráte a ulož si ho na neskoršie porovnanie.
              </p>
            </div>
            <Button asChild className="mt-4">
              <Link href="/listings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Prezerať inzeráty
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 📊 Porovnávač (Comparison Summary Card) */}
          <Card className="border-primary/20 bg-linear-to-br from-card via-card to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Porovnávač vybraných ponúk ({favoriteListings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {/* Najnižšia cena */}
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowUpDown className="h-3.5 w-3.5 text-emerald-500" />
                    Najnižšia cena
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {minPrice !== null ? formatPrice(minPrice, null, czListings.length > 0 ? "CZK" : "EUR") : "Dohodou"}
                  </div>
                </div>

                {/* Priemerná cena a rozpätie */}
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="text-xs text-muted-foreground">Priemer / Max</div>
                  <div className="mt-1 text-base sm:text-lg font-bold">
                    {avgPrice !== null ? formatPrice(avgPrice, null, czListings.length > 0 ? "CZK" : "EUR") : "—"}
                  </div>
                  {maxPrice !== null && minPrice !== null && maxPrice > minPrice && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Max: {formatPrice(maxPrice, null, czListings.length > 0 ? "CZK" : "EUR")}
                    </div>
                  )}
                </div>

                {/* Najbližšie k Václaváku */}
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    K Václaváku (Centrum)
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                    {minDistance !== null ? `${minDistance.toFixed(1)} km` : "—"}
                  </div>
                </div>

                {/* Overený telefón */}
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    S telefónnym číslom
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-bold">
                    {listingsWithPhone} / {favoriteListings.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zoznam obľúbených inzerátov */}
          <div className="grid gap-3 sm:grid-cols-2">
            {favoriteListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
