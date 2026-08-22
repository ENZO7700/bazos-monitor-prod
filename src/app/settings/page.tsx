"use client";

import Link from "next/link";
import { Bell, Download, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useNotifications } from "@/hooks/useNotifications";

export default function SettingsPage() {
  const { permission, supported, subscribed, loading, subscribe, unsubscribe } =
    useNotifications();
  const { canInstall, isInstalled, install } = useInstallPrompt();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Nastavenia" description="Notifikácie a PWA" />

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
            Pre obnovovanie každých 10 minút nastav externý cron na{" "}
            <code className="text-primary">GET /api/cron/poll-rss</code> s headerom{" "}
            <code className="text-primary">Authorization: Bearer CRON_SECRET</code>.
          </p>
          <p>Manuálne obnovenie je vždy dostupné na Dashboarde.</p>
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
            Dáta pochádzajú z verejných Bazoš RSS feedov. Push subscription údaje sa
            ukladajú v databáze.
          </p>
          <Button variant="outline" asChild>
            <Link href="/about">Viac informácií</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
