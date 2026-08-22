"use client";

import { Button } from "@/components/ui/button";

interface QueryErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export function QueryErrorBanner({
  message = "Nepodarilo sa načítať dáta. Skontroluj databázu (npm run db:up) alebo pripojenie.",
  onRetry,
}: QueryErrorBannerProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p>{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0">
          Skúsiť znova
        </Button>
      ) : null}
    </div>
  );
}
