import type { WebhookContext } from "../context.js";
import type { WebhookEvent } from "../types/webhook.js";
import { handleNotificationSend } from "./notification-send.js";
import { handleTaskAssigned } from "./task-assigned.js";
import {
  handleTelemetryInfo,
  handleTelemetryInventory,
  handleTelemetrySecurity,
} from "./telemetry-logs.js";

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
    case "telemetry.security":
      await handleTelemetrySecurity(
        context,
        event.payload as WebhookEvent<"telemetry.security">["payload"],
      );
      return;
    case "telemetry.info":
      await handleTelemetryInfo(
        context,
        event.payload as WebhookEvent<"telemetry.info">["payload"],
      );
      return;
    case "telemetry.inventory":
      await handleTelemetryInventory(
        context,
        event.payload as WebhookEvent<"telemetry.inventory">["payload"],
      );
      return;
    case "task.assigned":
      await handleTaskAssigned(
        context,
        event.payload as WebhookEvent<"task.assigned">["payload"],
      );
      return;
  }
}
