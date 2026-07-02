import { Webhooks } from "@octokit/webhooks";

import { config } from "../../config.js";
import type { WebhookContext } from "../context.js";
import { handleGitHubEvent } from "../handlers/github-event.js";

let githubWebhooks: Webhooks | undefined;

export function getGitHubWebhooks(): Webhooks | undefined {
  if (!config.githubWebhookSecret) {
    return undefined;
  }

  if (!githubWebhooks) {
    githubWebhooks = new Webhooks({
      secret: config.githubWebhookSecret,
    });
  }

  return githubWebhooks;
}

export function registerGitHubWebhookHandlers(context: WebhookContext): Webhooks | undefined {
  const webhooks = getGitHubWebhooks();
  if (!webhooks) {
    return undefined;
  }

  webhooks.onAny(async ({ name, payload }) => {
    await handleGitHubEvent(context, name, payload);
  });

  webhooks.onError((error) => {
    console.error("[github] webhook handler failed:", error);
  });

  return webhooks;
}
