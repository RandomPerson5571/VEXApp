import type { WebhookContext } from "../context.js";
import type { TaskWebhookPayload } from "../types/webhook.js";

export async function handleTaskCreated(
  _context: WebhookContext,
  payload: TaskWebhookPayload,
): Promise<void> {
  // Extend with channel lookups, embeds, or DM notifications as needed.
  console.log(
    `[webhook:task.created] team=${payload.teamId} task=${payload.taskId} title="${payload.title}"`,
  );
}
