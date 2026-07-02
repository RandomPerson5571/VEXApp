/**
 * Discriminated webhook payloads posted to the bot API.
 * Add new event types here and register a handler in `handlers/index.ts`.
 */
export const WEBHOOK_EVENT_TYPES = [
  "notification.send",
  "task.created",
  "task.completed",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export type NotificationSendPayload = {
  channelId: string;
  content: string;
};

export type TaskWebhookPayload = {
  taskId: string;
  teamId: string;
  title: string;
  assigneeDiscordId?: string | null;
};

export type WebhookPayloadByType = {
  "notification.send": NotificationSendPayload;
  "task.created": TaskWebhookPayload;
  "task.completed": TaskWebhookPayload;
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
