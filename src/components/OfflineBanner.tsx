"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-600 px-4 py-2.5 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4 shrink-0" />
      Offline režim — zobrazujem uložené dáta
    </div>
  );
}
