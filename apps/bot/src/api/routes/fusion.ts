import { Router } from "express";

import type { WebhookContext } from "../context.js";
import { handleFusionEvent } from "../handlers/fusion-event.js";
import { verifyFusionSignature } from "../middleware/verify-fusion-signature.js";
import { isFusionWebhookPayload } from "../types/fusion.js";

export function createFusionRouter(context: WebhookContext): Router {
  const router = Router();

  router.post("/", verifyFusionSignature, async (request, response, next) => {
    try {
      if (!isFusionWebhookPayload(request.body)) {
        response.status(400).json({ error: "Invalid Fusion webhook payload." });
        return;
      }

      await handleFusionEvent(context, request.body);
      response.status(202).json({
        accepted: true,
        source: "fusion",
        event: request.body.hook?.event ?? "unknown",
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
