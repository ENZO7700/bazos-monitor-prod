"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { runManualPoll } from "@/app/actions/poll";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/ListingCard";
import { StatsCards } from "@/components/StatsCards";
import { StatsCardsSkeleton } from "@/components/StatsCardsSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { WatchQuickStart } from "@/components/WatchQuickStart";
import { EspressoDigestCard } from "@/components/EspressoDigestCard";
import { QueryErrorBanner } from "@/components/QueryErrorBanner";
import { getListings, getStats, markListingRead } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  const [dashboardCountry, setDashboardCountry] = useState<string>("ALL");

  const {
    data: listings,
    isLoading: listingsLoading,
    isError: listingsError,
  } = useQuery({
    queryKey: ["listings", { limit: 6, country: dashboardCountry }],
    queryFn: () =>
      getListings({
        limit: 6,
        country: dashboardCountry === "ALL" ? undefined : dashboardCountry,
      }),
  });

  const pollMutation = useMutation({
    mutationFn: runManualPoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["watches"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: markListingRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const hasQueryError = statsError || listingsError;

  const pollMessage = pollMutation.isError
    ? "Obnovenie zlyhalo. Skús znova alebo skontroluj databázu."
    : pollMutation.isSuccess
      ? `Spracovaných ${pollMutation.data.watchesProcessed} sledovaní, ${pollMutation.data.newListings} nových inzerátov`
      : null;

  const pollTone = pollMutation.isError
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : "border-primary/30 bg-primary/10 text-primary";

  return (
    <div className="space-y-8">
      <WatchQuickStart />

      <EspressoDigestCard />

      {hasQueryError && (
        <QueryErrorBanner
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ["stats"] });
            void queryClient.invalidateQueries({ queryKey: ["listings"] });
          }}
        />
      )}

      <PageHeader
        title="Bazoš Monitor"
        description="Povedz čo hľadáš — my to budeme sledovať"
        actions={
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => pollMutation.mutate()}
            disabled={pollMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${pollMutation.isPending ? "animate-spin" : ""}`} />
            Obnoviť teraz
          </Button>
        }
      />

      <div className="min-h-[2.75rem]" aria-live="polite">
        {pollMessage ? (
          <p className={cn("rounded-md border px-4 py-2 text-sm", pollTone)}>
            {pollMessage}
          </p>
        ) : null}
      </div>

      {statsLoading ? (
        <StatsCardsSkeleton />
      ) : stats ? (
        <StatsCards
          activeWatches={stats.activeWatches}
          newToday={stats.newToday}
          unread={stats.unread}
        />
      ) : null}

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Najnovšie inzeráty</h2>
            {/* SK / CZ Switcher */}
            <div className="flex items-center gap-1 rounded-md border border-border/80 bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setDashboardCountry("ALL")}
                className={cn(
                  "rounded px-2 py-1 font-medium transition-all",
                  dashboardCountry === "ALL"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                🌍 Všetko
              </button>
              <button
                type="button"
                onClick={() => setDashboardCountry("CZ")}
                className={cn(
                  "rounded px-2 py-1 font-medium transition-all",
                  dashboardCountry === "CZ"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                🇨🇿 ČR
              </button>
              <button
                type="button"
                onClick={() => setDashboardCountry("SK")}
                className={cn(
                  "rounded px-2 py-1 font-medium transition-all",
                  dashboardCountry === "SK"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                🇸🇰 SR
              </button>
            </div>
          </div>
          <Button variant="link" asChild className="text-primary p-0 h-auto sm:p-2 sm:h-9">
            <Link href="/listings">Zobraziť všetky</Link>
          </Button>
        </div>

        <div className="min-h-[15rem]">
          {listingsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="min-h-[7rem]" />
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
            <div className="flex min-h-[15rem] items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">
                Zatiaľ žiadne inzeráty. Vyber šablónu vyššie alebo napíš čo hľadáš.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
