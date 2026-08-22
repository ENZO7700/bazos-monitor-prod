"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Phone, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { QueryErrorBanner } from "@/components/QueryErrorBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  createPhoneWatch,
  deletePhoneWatch,
  getPhoneMatches,
  getPhoneWatches,
  markPhoneMatchesSeen,
  searchPhone,
  updatePhoneWatch,
  type PhoneSearchResult,
} from "@/lib/api";
import { formatPrice, formatRelativeTime } from "@/lib/utils";

export default function PhonesPage() {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<PhoneSearchResult | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const {
    data: watches,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["phone-watches"],
    queryFn: getPhoneWatches,
  });

  const {
    data: matches,
    isError: matchesError,
  } = useQuery({
    queryKey: ["phone-matches"],
    queryFn: () => getPhoneMatches({ limit: 30 }),
  });

  const unreadCount =
    watches?.reduce((sum, w) => sum + (w.unreadMatches ?? 0), 0) ?? 0;

  const addMutation = useMutation({
    mutationFn: () =>
      createPhoneWatch({
        phone: phone.trim(),
        label: label.trim() || null,
      }),
    onSuccess: () => {
      setPhone("");
      setLabel("");
      setAddError(null);
      void queryClient.invalidateQueries({ queryKey: ["phone-watches"] });
      void queryClient.invalidateQueries({ queryKey: ["phone-matches"] });
    },
    onError: (err: Error) => {
      setAddError(err.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updatePhoneWatch(id, { active }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["phone-watches"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePhoneWatch(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["phone-watches"] });
      void queryClient.invalidateQueries({ queryKey: ["phone-matches"] });
    },
  });

  const searchMutation = useMutation({
    mutationFn: ({ q, enrich }: { q: string; enrich?: boolean }) =>
      searchPhone(q, { enrich }),
    onSuccess: (data) => {
      setSearchResult(data);
      void queryClient.invalidateQueries({ queryKey: ["phone-matches"] });
    },
  });

  const markSeenMutation = useMutation({
    mutationFn: () => markPhoneMatchesSeen({ markAllSeen: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["phone-matches"] });
      void queryClient.invalidateQueries({ queryKey: ["phone-watches"] });
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Telefóny"
        description="Watchlist podozrivých čísel z verejných inzerátov Bazoša (RSS + verejný detail)"
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markSeenMutation.mutate()}
              disabled={markSeenMutation.isPending}
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Označiť {unreadCount} ako prečítané
            </Button>
          ) : undefined
        }
      />

      {(isError || matchesError) && (
        <QueryErrorBanner
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ["phone-watches"] });
            void queryClient.invalidateQueries({ queryKey: ["phone-matches"] });
          }}
        />
      )}

      {/* Add form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Pridať číslo do watchlistu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!phone.trim()) return;
              addMutation.mutate();
            }}
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="phone-input">Telefón</Label>
              <Input
                id="phone-input"
                inputMode="tel"
                placeholder="0901 234 567 alebo +421…"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="label-input">Label (voliteľné)</Label>
              <Input
                id="label-input"
                placeholder='napr. "948 Fabia"'
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={addMutation.isPending || !phone.trim()}>
              Pridať
            </Button>
          </form>
          {addError && (
            <p className="mt-2 text-sm text-destructive">{addError}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Číslo sa normalizuje na +421… / +420…. Matching beží pri polle nových
            verejných inzerátov a voči už stiahnutým telefónom.
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Vyhľadať číslo v stiahnutých inzerátoch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!searchQuery.trim()) return;
              searchMutation.mutate({ q: searchQuery.trim() });
            }}
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="search-input">Telefón</Label>
              <Input
                id="search-input"
                inputMode="tel"
                placeholder="090x… / +421…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              disabled={searchMutation.isPending || !searchQuery.trim()}
            >
              Hľadať
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={searchMutation.isPending || !searchQuery.trim()}
              onClick={() =>
                searchMutation.mutate({ q: searchQuery.trim(), enrich: true })
              }
              title="Doplní telefóny z verejných detailov pre inzeráty bez phones (max 15)"
            >
              Hľadať + dohľadať
            </Button>
          </form>

          {searchMutation.isError && (
            <p className="text-sm text-destructive">
              {(searchMutation.error as Error).message}
            </p>
          )}

          {searchResult && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Normalizované:{" "}
                <span className="font-mono text-foreground">
                  {searchResult.phoneE164}
                </span>
                {searchResult.enriched > 0 && (
                  <> · doplnených detailov: {searchResult.enriched}</>
                )}
                {" · "}
                nájdené v {searchResult.listings.length} inzerátoch
              </p>
              {searchResult.listings.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  V stiahnutých inzerátoch sa toto číslo nenašlo.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {searchResult.listings.map((l) => (
                    <li key={l.id} className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-primary"
                        >
                          {l.title}
                          <ExternalLink className="ml-1 inline h-3 w-3" />
                        </a>
                        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{formatPrice(l.price, l.priceLabel)}</span>
                          {l.location && <span>{l.location}</span>}
                          <span className="font-mono">{l.phoneRaw}</span>
                          <span>
                            nájdené {formatRelativeTime(l.foundAt)}
                          </span>
                          {l.watch && <Badge variant="secondary">{l.watch.name}</Badge>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Watchlist */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Watchlist čísel</h2>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : watches && watches.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {watches.map((w) => (
              <Card key={w.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{w.phoneE164}</span>
                      {!w.active && <Badge variant="outline">neaktívne</Badge>}
                      {(w.unreadMatches ?? 0) > 0 && (
                        <Badge variant="new">{w.unreadMatches} nových</Badge>
                      )}
                    </div>
                    {w.label && (
                      <p className="mt-1 text-sm text-muted-foreground">{w.label}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {w.matchCount ?? 0} matchov · raw: {w.phoneRaw}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      checked={w.active}
                      onCheckedChange={(active) =>
                        toggleMutation.mutate({ id: w.id, active })
                      }
                      disabled={toggleMutation.isPending}
                      aria-label={w.active ? "Deaktivovať" : "Aktivovať"}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Zmazať"
                      onClick={() => {
                        if (confirm(`Zmazať ${w.phoneE164}?`)) {
                          deleteMutation.mutate(w.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Zatiaľ žiadne sledované čísla.
          </div>
        )}
      </section>

      {/* Recent matches */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Posledné matchy</h2>
        {matches && matches.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {matches.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{m.phoneWatch.phoneE164}</span>
                    {m.phoneWatch.label && (
                      <Badge variant="secondary">{m.phoneWatch.label}</Badge>
                    )}
                    {!m.seen && <Badge variant="new">Nové</Badge>}
                  </div>
                  <a
                    href={m.listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-sm font-medium hover:text-primary"
                  >
                    {m.listing.title}
                    <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(m.listing.price, m.listing.priceLabel)}
                    {m.listing.location ? ` · ${m.listing.location}` : ""}
                    {" · "}
                    {formatRelativeTime(m.matchedAt)}
                    {m.listing.watch ? ` · ${m.listing.watch.name}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Žiadne matchy — pri polle sa porovnajú telefóny z verejných inzerátov s watchlistom.
          </p>
        )}
      </section>
    </div>
  );
}
