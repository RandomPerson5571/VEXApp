"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  flushScoutingOutbox,
  requestScoutingSync,
  SCOUTING_OUTBOX_CHANNEL,
  type ScoutingOutboxFlushedMessage,
} from "@/lib/offline/scouting-outbox";
import { remapScoutNoteTempId } from "@/lib/queries/cache-updates/scouting";
import type { ScoutNoteRecord } from "@/lib/queries/scouting";

function isFlushedMessage(
  data: unknown,
): data is ScoutingOutboxFlushedMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as ScoutingOutboxFlushedMessage).type ===
      "scouting-outbox-flushed" &&
    typeof (data as ScoutingOutboxFlushedMessage).tempNoteId === "string"
  );
}

/** Flushes scouting IndexedDB outbox on reconnect; remaps offline create ids. */
export function ScoutingOutboxSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const flush = () => {
      void flushScoutingOutbox().then(() => {
        void requestScoutingSync();
      });
    };

    flush();
    window.addEventListener("online", flush);

    const onMessage = (event: MessageEvent) => {
      if (!isFlushedMessage(event.data)) return;
      const serverNote = event.data.serverNote as ScoutNoteRecord | null;
      if (!serverNote?.id) return;
      remapScoutNoteTempId(
        queryClient,
        event.data.tempNoteId,
        serverNote,
      );
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(SCOUTING_OUTBOX_CHANNEL);
      channel.addEventListener("message", onMessage);
    } catch {
      // BroadcastChannel unavailable.
    }

    const onSwMessage = (event: MessageEvent) => {
      onMessage(event);
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onSwMessage);
    }

    return () => {
      window.removeEventListener("online", flush);
      channel?.removeEventListener("message", onMessage);
      channel?.close();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onSwMessage);
      }
    };
  }, [queryClient]);

  return null;
}
