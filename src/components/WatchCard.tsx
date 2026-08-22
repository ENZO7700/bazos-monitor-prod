"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getCategoryName } from "@/lib/categories";
import { formatRelativeTime } from "@/lib/utils";
import { deleteWatch, updateWatch } from "@/lib/api";

export interface WatchData {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  minPrice: number | null;
  maxPrice: number | null;
  countries?: string[];
  isActive: boolean;
  lastChecked: string | null;
  _count?: { listings: number };
}

interface WatchCardProps {
  watch: WatchData;
}

export function WatchCard({ watch }: WatchCardProps) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: () => updateWatch(watch.id, { isActive: !watch.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watches"] }),
  });

  const countries =
    watch.countries && watch.countries.length > 0 ? watch.countries : ["SK", "CZ"];
  const hasSk = countries.includes("SK");
  const hasCz = countries.includes("CZ");

  const toggleCountryMutation = useMutation({
    mutationFn: (countryToToggle: "SK" | "CZ") => {
      let nextCountries: string[];
      if (countries.includes(countryToToggle)) {
        nextCountries = countries.filter((c) => c !== countryToToggle);
      } else {
        nextCountries = [...countries, countryToToggle];
      }
      if (nextCountries.length === 0) return Promise.resolve(null);
      return updateWatch(watch.id, { countries: nextCountries });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watches"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWatch(watch.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watches"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>{watch.name}</CardTitle>
            <div className="flex gap-1">
              {hasSk && <Badge variant="secondary">🇸🇰 SK</Badge>}
              {hasCz && <Badge variant="secondary">🇨🇿 CZ</Badge>}
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {getCategoryName(watch.category)} · {watch._count?.listings ?? 0} inzerátov
          </p>
        </div>
        <Switch
          checked={watch.isActive}
          onCheckedChange={() => toggleMutation.mutate()}
          disabled={toggleMutation.isPending}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">Zdroje:</span>
          <button
            type="button"
            onClick={() => hasSk && !hasCz ? null : toggleCountryMutation.mutate("SK")}
            disabled={toggleCountryMutation.isPending || (hasSk && !hasCz)}
            className={`cursor-pointer rounded border px-2 py-0.5 transition ${
              hasSk
                ? "border-primary/50 bg-primary/10 text-primary font-medium"
                : "border-border text-muted-foreground opacity-60 hover:opacity-100"
            } ${hasSk && !hasCz ? "cursor-not-allowed" : ""}`}
            title={hasSk && !hasCz ? "Aspoň jedna krajina musí byť aktívna" : "Kliknutím zapnete/vypnete Bazoš.sk"}
          >
            🇸🇰 Bazoš.sk {hasSk ? "✓" : "✗"}
          </button>
          <button
            type="button"
            onClick={() => hasCz && !hasSk ? null : toggleCountryMutation.mutate("CZ")}
            disabled={toggleCountryMutation.isPending || (hasCz && !hasSk)}
            className={`cursor-pointer rounded border px-2 py-0.5 transition ${
              hasCz
                ? "border-primary/50 bg-primary/10 text-primary font-medium"
                : "border-border text-muted-foreground opacity-60 hover:opacity-100"
            } ${hasCz && !hasSk ? "cursor-not-allowed" : ""}`}
            title={hasCz && !hasSk ? "Aspoň jedna krajina musí byť aktívna" : "Kliknutím zapnete/vypnete Bazoš.cz"}
          >
            🇨🇿 Bazoš.cz {hasCz ? "✓" : "✗"}
          </button>
        </div>

        {watch.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {watch.keywords.map((kw) => (
              <Badge key={kw} variant="secondary">
                {kw}
              </Badge>
            ))}
          </div>
        )}
        {(watch.minPrice != null || watch.maxPrice != null) && (
          <p className="text-sm text-muted-foreground">
            Cena: {watch.minPrice ?? 0} – {watch.maxPrice ?? "∞"}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Posledná kontrola:{" "}
          {watch.lastChecked ? formatRelativeTime(watch.lastChecked) : "ešte nie"}
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
          Zmazať
        </Button>
      </CardContent>
    </Card>
  );
}
