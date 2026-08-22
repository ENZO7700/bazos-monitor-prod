"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  MessageCircle,
  MessageSquare,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { QueryErrorBanner } from "@/components/QueryErrorBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createPhoneWatch,
  deletePhoneWatch,
  getListings,
  getPhoneWatches,
  markPhoneMatchesSeen,
} from "@/lib/api";
import {
  extractContactsFromListings,
  generateCsvContacts,
  generateVcfContacts,
  triggerFileDownload,
} from "@/lib/contacts-export";

export default function PhonesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"directory" | "watchlist">("directory");
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [filterCountry, setFilterCountry] = useState<"ALL" | "CZ" | "SK">("ALL");

  // Fetch phone watches
  const {
    data: watches,
    isLoading: watchesLoading,
    isError,
  } = useQuery({
    queryKey: ["phone-watches"],
    queryFn: getPhoneWatches,
  });

  // Fetch all cached/live listings to aggregate contacts
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["listings", { limit: 200 }],
    queryFn: () => getListings({ limit: 200 }),
  });

  const unreadCount =
    watches?.reduce((sum, w) => sum + (w.unreadMatches ?? 0), 0) ?? 0;

  // Extract seller contacts
  const allContacts = listings ? extractContactsFromListings(listings) : [];
  const filteredContacts = allContacts.filter((c) => {
    if (filterCountry !== "ALL" && c.country !== filterCountry) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.phone.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.listings.some((l) => l.title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const addMutation = useMutation({
    mutationFn: (targetPhone: string) =>
      createPhoneWatch({
        phone: targetPhone.trim(),
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePhoneWatch(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["phone-watches"] });
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

  // Handlers for exporting contacts
  const handleExportVcf = () => {
    if (filteredContacts.length === 0) return;
    const vcf = generateVcfContacts(filteredContacts);
    triggerFileDownload(vcf, `bazos-kontakty-${new Date().toISOString().slice(0, 10)}.vcf`, "text/vcard");
  };

  const handleExportCsv = () => {
    if (filteredContacts.length === 0) return;
    const csv = generateCsvContacts(filteredContacts);
    triggerFileDownload(csv, `bazos-kontakty-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8;");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="📞 Telefónny Hub & Adresár"
          description="Všetky telefónne čísla z inzerátov, rýchly 1-klik kontakt a export pre iPhone / Android."
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

        {/* Export buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportVcf}
            disabled={filteredContacts.length === 0}
            className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            title="Stiahnuť VCF súbor pre import do iPhonu / Androidu"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export VCF (Mobil)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredContacts.length === 0}
            className="border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
            title="Stiahnuť CSV tabuľku pre Excel"
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Export CSV (Excel)
          </Button>
        </div>
      </div>

      {(isError || matchesError) && (
        <QueryErrorBanner
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ["phone-watches"] });
            void queryClient.invalidateQueries({ queryKey: ["phone-matches"] });
          }}
        />
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "directory"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Zoznam predajcov ({allContacts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("watchlist")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "watchlist"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Phone className="h-4 w-4" />
          <span>Sledované čísla ({watches?.length ?? 0})</span>
        </button>
      </div>

      {/* 📇 TAB 1: Adresár predajcov */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Hľadať číslo (+420...), mesto alebo inzerát..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Country Pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setFilterCountry("ALL")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterCountry === "ALL"
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Všetky
              </button>
              <button
                type="button"
                onClick={() => setFilterCountry("CZ")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterCountry === "CZ"
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                🇨🇿 ČR (+420)
              </button>
              <button
                type="button"
                onClick={() => setFilterCountry("SK")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterCountry === "SK"
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                🇸🇰 SR (+421)
              </button>
            </div>
          </div>

          {/* Contacts Grid */}
          {listingsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <Card className="border-dashed py-10 text-center">
              <CardContent>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Phone className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Zatiaľ neboli nájdené žiadne telefónne čísla zodpovedajúce filtru.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredContacts.map((c) => {
                const cleanDigits = c.phone.replace(/\D/g, "");
                const isMultiSeller = c.listingCount > 1;
                const sampleListing = c.listings[0];
                const inquiryMsg = encodeURIComponent(
                  `Dobrý deň, reagujem na Váš inzerát na Bazoši: "${sampleListing?.title || "inzerát"}". Je ešte voľný?`
                );

                return (
                  <Card
                    key={c.phone}
                    className="overflow-hidden border border-border/80 transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-bold text-foreground">
                              {c.phone}
                            </span>
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                              {c.country === "CZ" ? "🇨🇿 CZ" : "🇸🇰 SK"}
                            </Badge>
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{c.location}</div>
                        </div>

                        {isMultiSeller && (
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                            {c.listingCount}x inzerát
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-3">
                      {/* Listings Preview */}
                      <div className="rounded-md bg-muted/40 p-2 text-xs space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Inzeráty predajcu ({c.listings.length}):
                        </div>
                        {c.listings.slice(0, 2).map((l) => (
                          <div key={l.id} className="flex items-center justify-between gap-2">
                            <a
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="line-clamp-1 hover:underline text-foreground/90 font-medium"
                            >
                              {l.title}
                            </a>
                            <span className="shrink-0 font-bold text-primary">{l.priceFormatted}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons: Call, WhatsApp, SMS */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.location.href = `tel:${c.phone}`;
                          }}
                          className="h-8 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs px-2"
                        >
                          <PhoneCall className="mr-1 h-3.5 w-3.5" />
                          Zavolať
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.open(`https://wa.me/${cleanDigits}?text=${inquiryMsg}`, "_blank", "noopener,noreferrer");
                          }}
                          className="h-8 border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 text-xs px-2"
                        >
                          <MessageCircle className="mr-1 h-3.5 w-3.5" />
                          WhatsApp
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.location.href = `sms:${c.phone}?body=${inquiryMsg}`;
                          }}
                          className="h-8 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs px-2"
                        >
                          <MessageSquare className="mr-1 h-3.5 w-3.5" />
                          SMS
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🎯 TAB 2: Sledované telefónne čísla (Watchlist) */}
      {activeTab === "watchlist" && (
        <div className="space-y-6">
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
                  addMutation.mutate(phone);
                }}
              >
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="phone-input">Telefón</Label>
                  <Input
                    id="phone-input"
                    inputMode="tel"
                    placeholder="777 123 456 alebo +420…"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="label-input">Popis (voliteľné)</Label>
                  <Input
                    id="label-input"
                    placeholder="napr. podvodník, predať auto…"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Ukladám…" : "Sledovať"}
                </Button>
              </form>
              {addError && (
                <p className="mt-2 text-xs text-destructive">{addError}</p>
              )}
            </CardContent>
          </Card>

          {/* Active Watches List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Aktívne sledované čísla ({watches?.length ?? 0})</h3>
            {watchesLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : watches?.length === 0 ? (
              <p className="text-xs text-muted-foreground">Zatiaľ nesleduješ žiadne konkrétne čísla.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {watches?.map((w) => (
                  <Card key={w.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-sm">{w.phoneE164}</div>
                      {w.label && <div className="text-xs text-muted-foreground">{w.label}</div>}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(w.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
