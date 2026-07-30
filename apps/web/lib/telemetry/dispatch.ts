import "server-only";

import type {
  EndpointFailureInput,
  LogTelemetryInput,
  TaskAssignedInput,
} from "@/lib/telemetry/types";

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

function webhookTypeForCategory(
  category: LogTelemetryInput["category"],
): string {
  switch (category) {
    case "security":
      return "telemetry.security";
    case "info":
      return "telemetry.info";
    case "inventory":
      return "telemetry.inventory";
  }
}

export async function logTelemetryAsync(input: LogTelemetryInput): Promise<void> {
  await postBotWebhook(webhookTypeForCategory(input.category), {
    teamId: input.teamId,
    message: input.message,
    action: input.action,
    level: input.level,
  });
}

export function logTelemetry(input: LogTelemetryInput): void {
  void logTelemetryAsync(input).catch((error) => {
    console.warn("[telemetry] dispatch failed:", error);
  });
}

export async function notifyTaskAssignedAsync(
  input: TaskAssignedInput,
): Promise<void> {
  if (input.assigneeUserIds.length === 0) return;

  await postBotWebhook("task.assigned", {
    teamId: input.teamId,
    taskId: input.taskId,
    title: input.title,
    assigneeUserIds: input.assigneeUserIds,
    actorId: input.actorId,
  });
}

export function notifyTaskAssigned(input: TaskAssignedInput): void {
  void notifyTaskAssignedAsync(input).catch((error) => {
    console.warn("[telemetry] task assignment notify failed:", error);
  });
}

export async function logEndpointFailureAsync(
  input: EndpointFailureInput,
): Promise<void> {
  const message = [
    `API ${input.status} on ${input.route}`,
    input.error instanceof Error ? input.error.message : undefined,
  ]
    .filter(Boolean)
    .join(" — ");

  await logTelemetryAsync({
    category: "security",
    teamId: input.teamId,
    message,
    action: "endpoint.failure",
    level: "error",
  });
}

export function logEndpointFailure(input: EndpointFailureInput): void {
  void logEndpointFailureAsync(input).catch((error) => {
    console.error("[telemetry] failed to dispatch endpoint failure:", error);
  });
}

export async function logWarningAsync(input: {
  teamId?: string;
  route: string;
  message: string;
}): Promise<void> {
  await logTelemetryAsync({
    category: "security",
    teamId: input.teamId,
    message: `${input.route}: ${input.message}`,
    action: "warning",
    level: "warning",
  });
}

export function logWarning(input: {
  teamId?: string;
  route: string;
  message: string;
}): void {
  void logWarningAsync(input).catch((error) => {
    console.error("[telemetry] failed to dispatch warning:", error);
  });
}
