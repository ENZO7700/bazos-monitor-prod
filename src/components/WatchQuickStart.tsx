"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  Gamepad2,
  Home,
  Laptop,
  Search,
  Settings,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { runManualPoll } from "@/app/actions/poll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createWatch } from "@/lib/api";
import {
  buildWatchPrefillUrl,
  formatWatchIntentSummary,
  parseWatchIntent,
  type ParsedWatchIntent,
} from "@/lib/parse-watch-intent";
import { WATCH_TEMPLATES, type WatchTemplateInput } from "@/lib/watch-templates";
import { cn } from "@/lib/utils";

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  car: Car,
  home: Home,
  gamepad: Gamepad2,
  laptop: Laptop,
  settings: Settings,
};

export function WatchQuickStart() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [targetCountry, setTargetCountry] = useState<"ALL" | "CZ" | "SK">("ALL");
  const [preview, setPreview] = useState<ParsedWatchIntent | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createWatch,
    onSuccess: async (watch) => {
      setSuccessMessage(`Sledovanie „${watch.name}" je aktívne.`);
      setPreview(null);
      setQuery("");
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ["watches"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      try {
        await runManualPoll();
        queryClient.invalidateQueries({ queryKey: ["listings"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      } catch {
        // poll is best-effort after quick start
      }
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  const createFromInput = (data: WatchTemplateInput) => {
    createMutation.mutate({
      name: data.name,
      category: data.category,
      keywords: data.keywords,
      minPrice: data.minPrice ?? null,
      maxPrice: data.maxPrice ?? null,
      countries: data.countries ?? ["SK", "CZ"],
    });
  };

  const handleParse = () => {
    const intent = parseWatchIntent(query);
    if (!query.trim()) return;

    if (intent.confidence === "low") {
      router.push(buildWatchPrefillUrl(intent));
      return;
    }

    setPreview(intent);
    setErrorMessage(null);
  };

  const handleConfirmPreview = () => {
    if (!preview) return;
    createFromInput({
      name: preview.name,
      category: preview.category,
      keywords: preview.keywords,
      minPrice: preview.minPrice,
      maxPrice: preview.maxPrice,
      countries: preview.countries,
    });
  };

  const statusMessage = successMessage ?? errorMessage;
  const statusTone = successMessage
    ? "border-primary/30 bg-primary/10 text-primary"
    : "border-destructive/30 bg-destructive/10 text-destructive";

  return (
    <section className="rounded-xl border border-primary/20 bg-linear-to-b from-primary/10 to-transparent p-5 sm:p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-semibold sm:text-2xl">Čo hľadáš?</h2>
        <p className="text-sm text-muted-foreground">
          Napíš alebo vyber šablónu — sledovanie spustíme za teba.
        </p>
      </div>

      <div className="space-y-4">
        {/* SK / CZ / ALL Switcher */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 p-1 w-fit">
          <button
            type="button"
            onClick={() => setTargetCountry("ALL")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              targetCountry === "ALL"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🌍 Všetko
          </button>
          <button
            type="button"
            onClick={() => setTargetCountry("CZ")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              targetCountry === "CZ"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🇨🇿 Česko (Bazoš.cz)
          </button>
          <button
            type="button"
            onClick={() => setTargetCountry("SK")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              targetCountry === "SK"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🇸🇰 Slovensko (Bazoš.sk)
          </button>
        </div>

        <form
          toolname="quick_start_watch"
          tooldescription="Vytvorí sledovanie z prirodzeného textu (napr. iPhone 15 pod 400€). Pri nejasnom vstupe presmeruje na formulár."
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            handleParse();
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="query"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (preview) setPreview(null);
              }}
              placeholder={
                targetCountry === "CZ"
                  ? "napr. iPhone 16 v Prahe do 20000 Kč"
                  : targetCountry === "SK"
                    ? "napr. iPhone 15 do 400 € v BA"
                    : "napr. iPhone 16 / MacBook / Octavia"
              }
              className="pl-9"
              aria-label="Čo hľadáš"
              toolparamdescription="Čo používateľ hľadá, napr. iPhone 14 pod 350€"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={!query.trim() || createMutation.isPending}
            className="shrink-0"
          >
            Začať sledovať
          </Button>
        </form>
      </div>

      <div className="mt-3 min-h-[5.5rem]" aria-live="polite">
        {preview ? (
          <Card className="border-primary/30">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Budem sledovať</p>
                <p className="text-sm text-muted-foreground">
                  {formatWatchIntentSummary(preview)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
                  Zrušiť
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmPreview}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Vytváram…" : "Potvrdiť"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : statusMessage ? (
          <p className={cn("rounded-md border px-3 py-2 text-sm", statusTone)}>
            {statusMessage}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-4 gap-3",
          "flex overflow-x-auto pb-1 [-ms-overflow-style:none] scrollbar-none sm:grid sm:overflow-visible sm:pb-0 sm:grid-cols-2 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
        )}
      >
        {WATCH_TEMPLATES.filter((template) => {
          if (targetCountry === "ALL") return true;
          if (!template.watch) return true;
          const countries = template.watch.countries || ["SK", "CZ"];
          return countries.includes(targetCountry);
        }).map((template) => {
          const Icon = TEMPLATE_ICONS[template.icon] ?? Settings;

          if (template.href) {
            return (
              <Link
                key={template.id}
                href={template.href}
                className="group min-w-42 shrink-0 rounded-lg border border-border bg-card/80 p-4 transition-colors hover:border-primary/40 hover:bg-card sm:min-w-0"
              >
                <TemplateCardContent
                  Icon={Icon}
                  title={template.title}
                  description={template.description}
                />
              </Link>
            );
          }

          return (
            <button
              key={template.id}
              type="button"
              disabled={createMutation.isPending}
              onClick={() => template.watch && createFromInput(template.watch)}
              className="group min-w-42 shrink-0 rounded-lg border border-border bg-card/80 p-4 text-left transition-colors hover:border-primary/40 hover:bg-card disabled:opacity-60 sm:min-w-0"
            >
              <TemplateCardContent
                Icon={Icon}
                title={template.title}
                description={template.description}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TemplateCardContent({
  Icon,
  title,
  description,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <>
      <Icon className="mb-2 h-5 w-5 text-primary" aria-hidden />
      <p className="font-medium leading-tight">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </>
  );
}
