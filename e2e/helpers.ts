import type { APIRequestContext } from "@playwright/test";

export const E2E_PREFIX = "E2E Test";

export function uniqueWatchName(suffix = ""): string {
  return `${E2E_PREFIX} ${suffix || Date.now()}`;
}

export async function createWatchViaApi(
  request: APIRequestContext,
  data: {
    name: string;
    category?: string;
    keywords?: string[];
    minPrice?: number | null;
    maxPrice?: number | null;
  }
) {
  const response = await request.post("/api/watches", {
    data: {
      name: data.name,
      category: data.category ?? "mo",
      keywords: data.keywords ?? ["e2e"],
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to create watch: ${response.status()} ${await response.text()}`);
  }
  return response.json() as Promise<{ id: string; name: string }>;
}

export async function deleteWatchViaApi(request: APIRequestContext, id: string) {
  await request.delete(`/api/watches/${id}`);
}

export async function cleanupE2EWatches(request: APIRequestContext) {
  const response = await request.get("/api/watches");
  if (!response.ok()) return;

  const watches = (await response.json()) as Array<{ id: string; name: string }>;
  await Promise.all(
    watches
      .filter((watch) => watch.name.startsWith(E2E_PREFIX))
      .map((watch) => deleteWatchViaApi(request, watch.id))
  );
}

export function cronAuthHeaders(): Record<string, string> {
  const secret = process.env.CRON_SECRET;
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}
