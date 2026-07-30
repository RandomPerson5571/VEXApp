import "server-only";

import { prisma, Prisma } from "@stlvex/database";

import {
  mergeDigestCounters,
  TELEMETRY_EVENTS,
  type DigestCounters,
  type TelemetryEventKey,
} from "@/lib/telemetry/events";

export type { DigestCounters, TelemetryEventKey } from "@/lib/telemetry/events";
export {
  formatDigestSummary,
  mergeDigestCounters,
  TELEMETRY_EVENTS,
} from "@/lib/telemetry/events";

function botWebhookConfig(): { url: string; secret: string } | null {
  const base = process.env.BOT_PUBLIC_URL?.trim().replace(/\/$/, "");
  const secret = process.env.WEBHOOK_SECRET?.trim();
  if (!base || !secret) return null;
  return { url: `${base}/api/webhooks`, secret };
}

async function postBotWebhook(
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const config = botWebhookConfig();
  if (!config) {
    console.warn("[telemetry] BOT_PUBLIC_URL or WEBHOOK_SECRET missing; skip webhook");
    return;
  }

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": config.secret,
      },
      body: JSON.stringify({ type, payload }),
    });
    if (!response.ok) {
      console.warn(`[telemetry] webhook ${type} failed: ${response.status}`);
    }
  } catch (error) {
    console.warn(`[telemetry] webhook ${type} error:`, error);
  }
}

async function bumpRoutineCounter(
  teamId: string,
  key: TelemetryEventKey,
  amount = 1,
): Promise<void> {
  const existing = await prisma.teamDigestBuffer.findUnique({
    where: { teamId },
    select: { counters: true },
  });

  const current =
    existing?.counters &&
    typeof existing.counters === "object" &&
    !Array.isArray(existing.counters)
      ? (existing.counters as DigestCounters)
      : {};

  const counters = mergeDigestCounters(current, { [key]: amount });

  await prisma.teamDigestBuffer.upsert({
    where: { teamId },
    create: { teamId, counters: counters as Prisma.InputJsonValue },
    update: { counters: counters as Prisma.InputJsonValue },
  });
}

export type DispatchTelemetryInput = {
  teamId: string;
  event: TelemetryEventKey;
  /** Human-readable line for actionable/security embeds */
  message?: string;
  /** Extra payload fields for specialized handlers */
  extra?: Record<string, unknown>;
  amount?: number;
};

/**
 * Fire-and-forget telemetry. Never throw to callers.
 * Routine → digest buffer; actionable/security → bot webhook.
 */
export function dispatchTelemetry(input: DispatchTelemetryInput): void {
  void dispatchTelemetryAsync(input).catch((error) => {
    console.warn("[telemetry] dispatch failed:", error);
  });
}

export async function dispatchTelemetryAsync(
  input: DispatchTelemetryInput,
): Promise<void> {
  const urgency = TELEMETRY_EVENTS[input.event];
  const amount = input.amount ?? 1;

  if (urgency === "routine") {
    await bumpRoutineCounter(input.teamId, input.event, amount);
    return;
  }

  const type = urgency === "security" ? "telemetry.security" : "telemetry.actionable";
  const payload: Record<string, unknown> = {
    teamId: input.teamId,
    event: input.event,
    message: input.message ?? input.event,
    ...input.extra,
  };

  if (urgency === "security") {
    const team = await prisma.team.findUnique({
      where: { id: input.teamId },
      select: { discordServerId: true },
    });
    if (team?.discordServerId) {
      payload.guildId = team.discordServerId;
    }
  }

  await postBotWebhook(type, payload);
}

export type LowStockAlertInput = {
  teamId: string;
  itemId: string;
  itemName: string;
  available: number;
  threshold: number;
};

/** Specialized actionable alert with Discord Order Placed button. */
export function dispatchLowStockAlert(input: LowStockAlertInput): void {
  void postBotWebhook("inventory.low_stock", {
    teamId: input.teamId,
    itemId: input.itemId,
    itemName: input.itemName,
    available: input.available,
    threshold: input.threshold,
  }).catch((error) => {
    console.warn("[telemetry] low-stock webhook failed:", error);
  });
}
