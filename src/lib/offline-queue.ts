import { markListingRead } from "@/lib/api";

const QUEUE_KEY = "bazos:offline-read-queue";

function readQueue(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ids));
}

export function queueMarkRead(listingId: string): void {
  const queue = readQueue();
  if (!queue.includes(listingId)) {
    writeQueue([...queue, listingId]);
  }
}

export function getQueuedReadIds(): string[] {
  return readQueue();
}

export async function flushOfflineQueue(): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;

  const failed: string[] = [];
  let flushed = 0;

  for (const id of queue) {
    try {
      await markListingRead(id);
      flushed++;
    } catch {
      failed.push(id);
    }
  }

  writeQueue(failed);
  return flushed;
}
