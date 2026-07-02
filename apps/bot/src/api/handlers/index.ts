import type { WebhookContext } from "../context.js";
import type { WebhookEvent } from "../types/webhook.js";
import { handleNotificationSend } from "./notification-send.js";
import { handleTaskCompleted } from "./task-completed.js";
import { handleTaskCreated } from "./task-created.js";

export async function dispatchWebhookEvent(
  context: WebhookContext,
  event: WebhookEvent,
): Promise<void> {
  switch (event.type) {
    case "notification.send":
      await handleNotificationSend(context, event.payload as WebhookEvent<"notification.send">["payload"]);
      return;
    case "task.created":
      await handleTaskCreated(context, event.payload as WebhookEvent<"task.created">["payload"]);
      return;
    case "task.completed":
      await handleTaskCompleted(context, event.payload as WebhookEvent<"task.completed">["payload"]);
      return;
  }
}
