import type { WebhookContext } from "../context.js";
import type { WebhookEvent } from "../types/webhook.js";
import { handleInventoryLowStock } from "./inventory-low-stock.js";
import { handleNotificationSend } from "./notification-send.js";
import { handleTaskCompleted } from "./task-completed.js";
import { handleTaskCreated } from "./task-created.js";
import {
  handleTelemetryActionable,
  handleTelemetrySecurity,
} from "./telemetry.js";

export async function dispatchWebhookEvent(
  context: WebhookContext,
  event: WebhookEvent,
): Promise<void> {
  switch (event.type) {
    case "notification.send":
      await handleNotificationSend(
        context,
        event.payload as WebhookEvent<"notification.send">["payload"],
      );
      return;
    case "task.created":
      await handleTaskCreated(
        context,
        event.payload as WebhookEvent<"task.created">["payload"],
      );
      return;
    case "task.completed":
      await handleTaskCompleted(
        context,
        event.payload as WebhookEvent<"task.completed">["payload"],
      );
      return;
    case "telemetry.actionable":
      await handleTelemetryActionable(
        context,
        event.payload as WebhookEvent<"telemetry.actionable">["payload"],
      );
      return;
    case "telemetry.security":
      await handleTelemetrySecurity(
        context,
        event.payload as WebhookEvent<"telemetry.security">["payload"],
      );
      return;
    case "inventory.low_stock":
      await handleInventoryLowStock(
        context,
        event.payload as WebhookEvent<"inventory.low_stock">["payload"],
      );
      return;
  }
}
