import type { WebhookContext } from "../context.js";
import type { TaskWebhookPayload } from "../types/webhook.js";

export async function handleTaskCompleted(
  _context: WebhookContext,
  payload: TaskWebhookPayload,
): Promise<void> {
  console.log(
    `[webhook:task.completed] team=${payload.teamId} task=${payload.taskId} title="${payload.title}"`,
  );
}
