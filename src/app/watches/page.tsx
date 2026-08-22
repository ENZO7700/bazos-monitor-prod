"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WatchCard } from "@/components/WatchCard";
import { QueryErrorBanner } from "@/components/QueryErrorBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getWatches } from "@/lib/api";

export default function WatchesPage() {
  const queryClient = useQueryClient();
  const { data: watches, isLoading, isError } = useQuery({
    queryKey: ["watches"],
    queryFn: getWatches,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sledovania"
        description="Spravuj svoje RSS sledovania"
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/watches/new">
              <Plus className="h-4 w-4" />
              Nové
            </Link>
          </Button>
        }
      />

      {isError && (
        <QueryErrorBanner
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ["watches"] });
          }}
        />
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : watches && watches.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {watches.map((watch) => (
            <WatchCard key={watch.id} watch={watch} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Nemáš žiadne sledovania.</p>
          <Button asChild className="mt-4">
            <Link href="/watches/new">Vytvoriť sledovanie</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
