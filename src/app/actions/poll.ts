"use server";

import { pollAllWatches } from "@/lib/poll-service";

export async function runManualPoll() {
  return pollAllWatches();
}
