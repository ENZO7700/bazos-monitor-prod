"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BAZOS_CATEGORIES } from "@/lib/categories";
import { buildRssUrl } from "@/lib/bazos-rss";
import { createWatch } from "@/lib/api";

export interface WatchFormDefaults {
  name?: string;
  category?: string;
  keywords?: string;
  minPrice?: string;
  maxPrice?: string;
  countries?: string[];
}

export function WatchForm({ defaultValues }: { defaultValues?: WatchFormDefaults }) {
  const router = useRouter();
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [category, setCategory] = useState(defaultValues?.category ?? "mo");
  const [keywordsInput, setKeywordsInput] = useState(defaultValues?.keywords ?? "");
  const [minPrice, setMinPrice] = useState(defaultValues?.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(defaultValues?.maxPrice ?? "");
  const [enableSk, setEnableSk] = useState(
    defaultValues?.countries ? defaultValues.countries.includes("SK") : true
  );
  const [enableCz, setEnableCz] = useState(
    defaultValues?.countries ? defaultValues.countries.includes("CZ") : true
  );
  const [countryError, setCountryError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createWatch,
    onSuccess: () => router.push("/watches"),
  });

  const keywords = keywordsInput
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const countries: string[] = [];
    if (enableSk) countries.push("SK");
    if (enableCz) countries.push("CZ");

    if (countries.length === 0) {
      setCountryError("Musíte vybrať aspoň jednu krajinu (Bazoš.sk alebo Bazoš.cz).");
      return;
    }
    setCountryError(null);

    mutation.mutate({
      name,
      category,
      keywords,
      minPrice: minPrice ? parseInt(minPrice, 10) : null,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : null,
      countries,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nové sledovanie</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          toolname="create_watch"
          tooldescription="Vytvorí nové RSS sledovanie inzerátov na Bazoši podľa kategórie a kľúčových slov"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Názov</Label>
            <Input
              id="name"
              name="name"
              placeholder="napr. iPhone 15"
              value={name}
              onChange={(e) => setName(e.target.value)}
              toolparamdescription="Názov sledovania, napr. iPhone 17"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategória</Label>
            <input type="hidden" name="category" value={category} />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BAZOS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.code} value={cat.code}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Zdroje vyhľadávania</Label>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition hover:border-primary">
                <input
                  type="checkbox"
                  checked={enableSk}
                  onChange={(e) => {
                    setEnableSk(e.target.checked);
                    if (e.target.checked || enableCz) setCountryError(null);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>🇸🇰 Bazoš.sk</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition hover:border-primary">
                <input
                  type="checkbox"
                  checked={enableCz}
                  onChange={(e) => {
                    setEnableCz(e.target.checked);
                    if (e.target.checked || enableSk) setCountryError(null);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>🇨🇿 Bazoš.cz</span>
              </label>
            </div>
            {countryError && (
              <p className="text-xs text-destructive">{countryError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Kľúčové slová (oddelené čiarkou)</Label>
            <Input
              id="keywords"
              name="keywords"
              placeholder="iphone, 128gb"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              toolparamdescription="Kľúčové slová oddelené čiarkou na filtrovanie inzerátov"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minPrice">Min. cena (€ / Kč)</Label>
              <Input
                id="minPrice"
                name="minPrice"
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                toolparamdescription="Minimálna cena (voliteľné)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPrice">Max. cena (€ / Kč)</Label>
              <Input
                id="maxPrice"
                name="maxPrice"
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                toolparamdescription="Maximálna cena (voliteľné)"
              />
            </div>
          </div>

          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
            {enableSk && (
              <p>
                🇸🇰 RSS: <code className="text-primary">{buildRssUrl(category, "SK")}</code>
              </p>
            )}
            {enableCz && (
              <p>
                🇨🇿 RSS: <code className="text-primary">{buildRssUrl(category, "CZ")}</code>
              </p>
            )}
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">
              {(mutation.error as Error).message}
            </p>
          )}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Ukladám..." : "Vytvoriť sledovanie"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
