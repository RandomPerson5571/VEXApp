import type { WebhookContext } from "../context.js";
import type { NotificationSendPayload } from "../types/webhook.js";

export async function handleNotificationSend(
  context: WebhookContext,
  payload: NotificationSendPayload,
): Promise<void> {
  const channel = await context.client.channels.fetch(payload.channelId);

  if (!channel?.isSendable()) {
    throw new Error(`Channel ${payload.channelId} cannot receive messages.`);
  }

  await channel.send(payload.content);
}
