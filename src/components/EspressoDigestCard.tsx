"use client";

import { useState, useEffect } from "react";
import { Coffee, Sparkles, RefreshCw, Send, ExternalLink, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EspressoDigestResult } from "@/lib/digest-service";

export function EspressoDigestCard() {
  const [digest, setDigest] = useState<EspressoDigestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const fetchDigest = async (shouldPush = false) => {
    try {
      if (shouldPush) {
        setPushing(true);
        setPushStatus(null);
      } else {
        setLoading(true);
      }

      const res = await fetch(`/api/digest${shouldPush ? "?push=true" : ""}`, {
        method: shouldPush ? "POST" : "GET",
      });

      if (res.ok) {
        const data = await res.json();
        if (shouldPush) {
          setDigest(data.digest);
          setPushStatus(`Odoslané ${data.sentCount} odberateľom!`);
        } else {
          setDigest(data);
        }
      }
    } catch (err) {
      console.error("Failed to load digest:", err);
    } finally {
      setLoading(false);
      setPushing(false);
    }
  };

  useEffect(() => {
    fetchDigest();
  }, []);

  return (
    <Card
      id="espresso-digest"
      className="relative overflow-hidden border-amber-500/30 bg-linear-to-br from-amber-500/10 via-background to-orange-500/5 shadow-lg shadow-amber-500/5"
    >
      <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />

      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold sm:text-xl">
                  AI Espresso Digest
                </CardTitle>
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400">
                  <Sparkles className="mr-1 h-3 w-3 inline animate-pulse" />
                  Mistral Agent
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Ranný & večerný výber najlepších úlovkov pre 🇨🇿 <strong>Prahu & ČR</strong>
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDigest(false)}
              disabled={loading || pushing}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Analyzujem…" : "Aktualizovať"}
            </Button>
            <Button
              size="sm"
              onClick={() => fetchDigest(true)}
              disabled={loading || pushing}
              className="h-8 gap-1.5 bg-amber-600 text-xs text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-400"
            >
              <Send className="h-3.5 w-3.5" />
              {pushing ? "Odosielam…" : "Push Digest"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {pushStatus && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/15 p-2.5 text-center text-xs font-medium text-amber-700 dark:text-amber-300 animate-in fade-in">
            🔔 {pushStatus}
          </div>
        )}

        {digest ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-b border-border/50 pb-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-amber-500" />
                Cieľ: <strong>{digest.targetLocation}</strong>
              </span>
              <span>
                Zanalyzovaných: <strong>{digest.totalListingsAnalyzed} inzerátov</strong> (iPhone 16/17, MacBook, Razer)
              </span>
            </div>

            {digest.topDeals.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                Dnes zatiaľ žiadne nové inzeráty spĺňajúce zadané kritériá na Bazoš.cz.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {digest.topDeals.map((deal, idx) => (
                  <a
                    key={deal.id || idx}
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col justify-between rounded-lg border border-border/70 bg-card/60 p-3.5 transition-all hover:border-amber-500/50 hover:bg-card hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-1.5">
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/15 text-[11px] font-medium text-amber-700 dark:text-amber-300"
                        >
                          {deal.badge}
                        </Badge>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          #{idx + 1}
                        </span>
                      </div>

                      <h4 className="line-clamp-2 text-sm font-semibold group-hover:text-amber-500 transition-colors">
                        {deal.title}
                      </h4>

                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {deal.highlightReason}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                      <span className="font-bold text-base text-primary">
                        {deal.priceFormatted}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-amber-500">
                        {deal.location}
                        <ExternalLink className="h-3 w-3 ml-0.5 opacity-70 group-hover:opacity-100" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Filtre: iPhone 16/17 · MacBook ≥ 20k Kč · Razer Blade
              </span>
              <span>
                Vygenerované o {new Date(digest.generatedAt).toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin text-amber-500" />
            Pripravujem tvoj ranný/večerný AI Espresso Digest…
          </div>
        )}
      </CardContent>
    </Card>
  );
}
