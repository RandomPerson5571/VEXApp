import { Router } from "express";

import type { WebhookContext } from "../context.js";
import { dispatchWebhookEvent } from "../handlers/index.js";
import { verifyWebhookSecret } from "../middleware/verify-webhook.js";
import { isWebhookEvent } from "../types/webhook.js";

export function createWebhookRouter(context: WebhookContext): Router {
  const router = Router();

  router.post("/", verifyWebhookSecret, async (request, response, next) => {
    try {
      if (!isWebhookEvent(request.body)) {
        response.status(400).json({
          error: "Invalid webhook payload. Expected { type, payload }.",
        });
        return;
      }

      await dispatchWebhookEvent(context, request.body);
      response.status(202).json({ accepted: true, type: request.body.type });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
