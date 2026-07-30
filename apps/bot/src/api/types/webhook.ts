/**
 * Discriminated webhook payloads posted to the bot API.
 * Add new event types here and register a handler in `handlers/index.ts`.
 */
export const WEBHOOK_EVENT_TYPES = [
  "notification.send",
  "telemetry.security",
  "telemetry.info",
  "telemetry.inventory",
  "task.assigned",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export type NotificationSendPayload = {
  channelId: string;
  content: string;
};

export type TelemetryDetailField = {
  name: string;
  value: string;
};

export type TelemetryLogPayload = {
  teamId?: string;
  message: string;
  action?: string;
  level?: "error" | "warning";
  entityType?: string;
  entityId?: string;
  actorId?: string;
  occurredAt?: string;
  fields?: TelemetryDetailField[];
};

export type TaskAssignedPayload = {
  teamId: string;
  taskId: string;
  title: string;
  assigneeUserIds: string[];
  actorId?: string;
};

export type WebhookPayloadByType = {
  "notification.send": NotificationSendPayload;
  "telemetry.security": TelemetryLogPayload;
  "telemetry.info": TelemetryLogPayload;
  "telemetry.inventory": TelemetryLogPayload;
  "task.assigned": TaskAssignedPayload;
};

export type WebhookEvent<T extends WebhookEventType = WebhookEventType> = {
  type: T;
  payload: WebhookPayloadByType[T];
};

export function isWebhookEvent(value: unknown): value is WebhookEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WebhookEvent>;
  return (
    typeof candidate.type === "string" &&
    WEBHOOK_EVENT_TYPES.includes(candidate.type as WebhookEventType) &&
    candidate.payload !== undefined &&
    typeof candidate.payload === "object"
  );
}
