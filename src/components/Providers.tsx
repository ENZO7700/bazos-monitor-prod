"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
import { useState } from "react";
import { OnlineSync } from "@/components/OnlineSync";
import { SwUpdateBanner } from "@/components/SwUpdateBanner";
import { WebMcpTools } from "@/components/WebMcpTools";
import { useUnreadBadge } from "@/hooks/useUnreadBadge";

const persister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => (await get(key)) ?? null,
    setItem: async (key, value) => {
      await set(key, value);
    },
    removeItem: async (key) => {
      await del(key);
    },
  },
});

function PwaEffects() {
  useUnreadBadge();
  return (
    <>
      <SwUpdateBanner />
      <OnlineSync />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            gcTime: 1000 * 60 * 60 * 24,
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: "rq-v2",
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const key = query.queryKey[0];
            if (key !== "watches" && key !== "listings" && key !== "stats") {
              return false;
            }
            return (
              query.state.status === "success" && query.state.fetchStatus === "idle"
            );
          },
        },
      }}
    >
      <PwaEffects />
      <WebMcpTools />
      {children}
    </PersistQueryClientProvider>
  );
}
