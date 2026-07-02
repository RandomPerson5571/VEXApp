import { Router } from "express";

import type { WebhookContext } from "./context.js";
import { createFusionRouter } from "./routes/fusion.js";
import { createGitHubRouter } from "./routes/github.js";
import { createWebhookRouter } from "./routes/webhooks.js";

export function createApiRouter(context: WebhookContext): Router {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({
      ok: true,
      discordReady: context.client.isReady(),
    });
  });

  router.use("/webhooks", createWebhookRouter(context));
  router.use("/github", createGitHubRouter(context));
  router.use("/fusion", createFusionRouter(context));

  return router;
}
