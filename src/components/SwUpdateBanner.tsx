"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function SwUpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const checkForUpdate = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
          }
        });
      });

      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting);
      }

      await reg.update();
    };

    void checkForUpdate();
    const interval = setInterval(() => void checkForUpdate(), 60_000);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      clearInterval(interval);
    };
  }, []);

  if (!waitingWorker) return null;

  const reload = () => {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <div className="fixed right-4 bottom-24 left-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg md:bottom-4 md:left-auto">
      <p className="text-sm">Nová verzia aplikácie je dostupná.</p>
      <Button size="sm" onClick={reload}>
        <RefreshCw className="mr-1 h-4 w-4" />
        Obnoviť
      </Button>
    </div>
  );
}
