"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const isDev = process.env.NODE_ENV === "development";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const userMessage = isDev
    ? error.message || "Nepodarilo sa načítať stránku. Skús obnoviť alebo skontroluj pripojenie."
    : "Nepodarilo sa načítať stránku. Skús obnoviť alebo skontroluj pripojenie.";

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Niečo sa pokazilo</h2>
      <p className="max-w-md text-sm text-muted-foreground">{userMessage}</p>
      <Button onClick={reset}>Skúsiť znova</Button>
    </div>
  );
}
