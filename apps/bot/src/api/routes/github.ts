import { Router } from "express";

import type { WebhookContext } from "../context.js";
import { registerGitHubWebhookHandlers } from "../github/webhooks.js";
import type { RequestWithRawBody } from "../types/request.js";

function isSignatureError(error: unknown): boolean {
  return error instanceof Error && /signature/i.test(error.message);
}

export function createGitHubRouter(context: WebhookContext): Router {
  const router = Router();
  const webhooks = registerGitHubWebhookHandlers(context);

  router.post("/", async (request, response, next) => {
    if (!webhooks) {
      response.status(503).json({ error: "GitHub webhooks are not configured." });
      return;
    }

    const rawBody = (request as RequestWithRawBody).rawBody;
    const signature = request.header("x-hub-signature-256");
    const name = request.header("x-github-event");
    const id = request.header("x-github-delivery");

    if (!rawBody) {
      response.status(400).json({ error: "Missing request body." });
      return;
    }

    if (!signature || !name) {
      response.status(401).json({ error: "Missing GitHub webhook headers." });
      return;
    }

    try {
      await webhooks.verifyAndReceive({
        id: id ?? "",
        name,
        payload: rawBody.toString(),
        signature,
      });

      response.status(202).json({ accepted: true, source: "github", event: name });
    } catch (error) {
      if (isSignatureError(error)) {
        response.status(401).json({ error: "Invalid GitHub signature." });
        return;
      }

      next(error);
    }
  });

  return router;
}
