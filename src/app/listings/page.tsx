"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListingCard } from "@/components/ListingCard";
import { QueryErrorBanner } from "@/components/QueryErrorBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getListings, getWatches, markListingRead, type Listing } from "@/lib/api";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  cacheListings,
  getListingsPrefs,
  setListingsPrefs,
} from "@/lib/offline-storage";
import { queueMarkRead } from "@/lib/offline-queue";

export default function ListingsPage() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const [watchFilter, setWatchFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    const prefs = getListingsPrefs();
    setWatchFilter(prefs.watchFilter);
    setCountryFilter(prefs.countryFilter || "ALL");
    setUnreadOnly(prefs.unreadOnly);
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    setListingsPrefs({ watchFilter, countryFilter, unreadOnly });
  }, [watchFilter, countryFilter, unreadOnly, prefsLoaded]);

  const { data: watches, isError: watchesError } = useQuery({
    queryKey: ["watches"],
    queryFn: getWatches,
  });

  const { data: listings, isLoading, isError: listingsError } = useQuery({
    queryKey: ["listings", { watchFilter, countryFilter, unreadOnly }],
    queryFn: () =>
      getListings({
        watchId: watchFilter === "all" ? undefined : watchFilter,
        country: countryFilter === "ALL" ? undefined : countryFilter,
        unread: unreadOnly || undefined,
      }),
    enabled: prefsLoaded,
  });

  useEffect(() => {
    if (listings?.length) {
      cacheListings(listings);
    }
  }, [listings]);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isOnline) {
        queueMarkRead(id);
        return { id, offline: true };
      }
      return markListingRead(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["listings"] });
      const previous = queryClient.getQueriesData<Listing[]>({ queryKey: ["listings"] });

      queryClient.setQueriesData<Listing[]>({ queryKey: ["listings"] }, (old) =>
        old?.map((l) => (l.id === id ? { ...l, isRead: true } : l))
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      if (isOnline) {
        void queryClient.invalidateQueries({ queryKey: ["listings"] });
        void queryClient.invalidateQueries({ queryKey: ["stats"] });
      }
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inzeráty"
        description="Všetky nájdené inzeráty zo sledovaní"
      />

      {(watchesError || listingsError) && (
        <QueryErrorBanner
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ["watches"] });
            void queryClient.invalidateQueries({ queryKey: ["listings"] });
          }}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <Select value={watchFilter} onValueChange={setWatchFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sledovanie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všetky sledovania</SelectItem>
            {watches?.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Krajina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Všetky krajiny</SelectItem>
            <SelectItem value="SK">🇸🇰 Iba Bazoš.sk</SelectItem>
            <SelectItem value="CZ">🇨🇿 Iba Bazoš.cz</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={unreadOnly ? "default" : "outline"}
          onClick={() => setUnreadOnly(!unreadOnly)}
        >
          {unreadOnly ? "Len neprečítané" : "Všetky"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onMarkRead={(id) => markReadMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Žiadne inzeráty pre zvolené filtre.
        </div>
      )}
    </div>
  );
}
