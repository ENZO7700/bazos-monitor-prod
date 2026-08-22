"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/lib/api";

export function useUnreadBadge() {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;

    const unread = stats?.unread ?? 0;
    if (unread > 0) {
      void navigator.setAppBadge(unread);
    } else {
      void navigator.clearAppBadge();
    }
  }, [stats?.unread]);
}
