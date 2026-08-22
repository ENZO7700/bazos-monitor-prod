"use client";

import { useEffect, useRef } from "react";
import { runManualPoll } from "@/app/actions/poll";
import {
  injectOriginTrialToken,
  isThirdPartyOriginTrialToken,
} from "@/lib/webmcp-token";
import type { WebMcpToolDefinition } from "@/types/webmcp";

function safeRegisterTool(
  modelContext: NonNullable<Document["modelContext"]>,
  tool: WebMcpToolDefinition
) {
  try {
    modelContext.registerTool(tool);
  } catch (error) {
    if (error instanceof DOMException && error.name === "InvalidStateError") {
      return;
    }
    throw error;
  }
}

export function WebMcpTools() {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (registeredRef.current) return;

    const token = process.env.NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN;
    if (token && isThirdPartyOriginTrialToken(token)) {
      injectOriginTrialToken(token);
    }

    const modelContext = document.modelContext;
    if (!modelContext?.registerTool) return;

    registeredRef.current = true;

    // quick_start_watch is registered declaratively on the homepage form
    // (WatchQuickStart.tsx) — do not register it here to avoid duplicates.

    safeRegisterTool(modelContext, {
      name: "poll_listings",
      description: "Manuálne spustí obnovenie RSS feedov a načítanie nových inzerátov",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        const result = await runManualPoll();
        return result;
      },
    });

    safeRegisterTool(modelContext, {
      name: "list_watches",
      description: "Vráti zoznam aktívnych sledovaní inzerátov",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        const response = await fetch("/api/watches");
        if (!response.ok) throw new Error("Nepodarilo sa načítať sledovania");
        return response.json();
      },
    });

    safeRegisterTool(modelContext, {
      name: "get_stats",
      description: "Vráti štatistiky: aktívne sledovania, nové dnes, neprečítané",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        const response = await fetch("/api/stats");
        if (!response.ok) throw new Error("Nepodarilo sa načítať štatistiky");
        return response.json();
      },
    });

    safeRegisterTool(modelContext, {
      name: "navigate_listings",
      description: "Presmeruje používateľa na stránku so zoznamom inzerátov",
      inputSchema: { type: "object", properties: {} },
      execute: () => {
        window.location.href = "/listings";
        return { navigated: "/listings" };
      },
    });
  }, []);

  return null;
}
