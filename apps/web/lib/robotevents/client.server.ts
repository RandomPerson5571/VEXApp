import "server-only";

import { Client, type VexEventsClient } from "events.vex";

let client: VexEventsClient | undefined;

/** Returns null when VEX_API_TOKEN is unset (dashboard shows empty RE list). */
export function getVexClient(): VexEventsClient | null {
  const token = process.env.VEX_API_TOKEN?.trim();
  if (!token) {
    return null;
  }

  if (!client) {
    client = Client({
      authorization: { token },
      request: {
        headers: { "User-Agent": "stlvex-web/1.0" },
      },
    });
  }

  return client;
}
