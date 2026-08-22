"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { flushOfflineQueue } from "@/lib/offline-queue";

export function OnlineSync() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOnline) return;

    void flushOfflineQueue().then((flushed) => {
      if (flushed > 0) {
        void queryClient.invalidateQueries({ queryKey: ["listings"] });
        void queryClient.invalidateQueries({ queryKey: ["stats"] });
      }
    });
  }, [isOnline, queryClient]);

  return null;
}
