"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Database, Download, Info, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useNotifications } from "@/hooks/useNotifications";
import { getLocalStorageStats, type StorageStats } from "@/lib/offline-storage";

export default function SettingsPage() {
  const { permission, supported, subscribed, loading, subscribe, unsubscribe } =
    useNotifications();
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  useEffect(() => {
    setStorageStats(getLocalStorageStats());
  }, []);

  const handleClearCache = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("bazos:cached-listings");
      setStorageStats(getLocalStorageStats());
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Nastavenia" description="Notifikácie, PWA a Lokálna pamäť" />

      {/* LocalStorage Databáza (5 MB) */}
      <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Lokálna pamäť (5 MB LocalStorage)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Využitie pamäte zariadenia:</span>
              <span className="font-semibold text-foreground">
                {storageStats ? `${formatBytes(storageStats.usedBytes)} / ${formatBytes(storageStats.maxBytes)}` : "—"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${storageStats ? Math.max(storageStats.percentUsed, 1) : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Aplikácia beží v 100% Client-first režime. Všetky sledovania a inzeráty sa ukladajú priamo vo vašom prehliadači s limitom 5 MB a ochranou proti pretečeniu.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Uvoľniť cache inzerátov
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Push notifikácie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!supported ? (
            <p className="text-sm text-muted-foreground">
              Tvoj prehliadač nepodporuje push notifikácie.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Stav:{" "}
                <span className="text-foreground">
                  {permission === "granted"
                    ? subscribed
                      ? "Aktívne"
                      : "Povolené, neprihlásené"
                    : permission === "denied"
                      ? "Zamietnuté"
                      : "Nepovolené"}
                </span>
              </p>
              {subscribed ? (
                <Button variant="outline" onClick={unsubscribe} disabled={loading}>
                  Vypnúť notifikácie
                </Button>
              ) : (
                <Button onClick={subscribe} disabled={loading || permission === "denied"}>
                  Povoliť notifikácie
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Automatické obnovovanie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            RSS feed sa kontroluje automaticky cez cron job (1× denne na Vercel Hobby).
          </p>
          <p>
            Pre ranný a večerný <strong>☕ AI Espresso Digest</strong> (08:00 a 20:00) sa spúšťa{" "}
            <code className="text-primary">POST /api/digest/cron</code>.
          </p>
          <p>Manuálne obnovenie sledovaní je vždy dostupné na Dashboarde.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Inštalácia PWA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {isInstalled ? (
            <p className="text-foreground">Aplikácia je nainštalovaná.</p>
          ) : canInstall ? (
            <Button onClick={() => void install()}>Nainštalovať aplikáciu</Button>
          ) : (
            <>
              <p className="mb-2">Na mobile: Otvor menu prehliadača a zvoľ „Pridať na plochu“.</p>
              <p>Na desktope: Klikni na ikonu inštalácie v adresnom riadku (Chrome/Edge).</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            O aplikácii a súkromí
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Dáta pochádzajú z verejných Bazoš RSS feedov (🇸🇰 Bazoš.sk & 🇨🇿 Bazoš.cz).
          </p>
          <Button variant="outline" asChild>
            <Link href="/about">Viac informácií</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
