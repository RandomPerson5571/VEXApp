import type { WebhookContext } from "../context.js";
import type { FusionWebhookPayload } from "../types/fusion.js";

export async function handleFusionEvent(
  _context: WebhookContext,
  payload: FusionWebhookPayload,
): Promise<void> {
  const event = payload.hook?.event ?? "unknown";
  const urn = payload.hook?.urn ?? payload.hook?.scope?.folder ?? "unknown";

  console.log(`[fusion:${event}] urn=${urn}`);
}
