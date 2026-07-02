import {
  findGitHubNotificationRecipients,
  findTeamGitHubIntegrationByRepo,
} from "@stlvex/database";

import {
  extractRepositoryFullName,
  formatGitHubNotificationEmbed,
  mapGitHubEventToPreferenceId,
} from "../../services/github-notifications.js";
import { sendDiscordDmBatch } from "../../services/discord-dm.js";
import type { WebhookContext } from "../context.js";

function resolveDiscordId(user: {
  discordId: string | null;
  discordAccount: { discordId: string } | null;
}): string | null {
  return user.discordId ?? user.discordAccount?.discordId ?? null;
}

export async function handleGitHubEvent(
  context: WebhookContext,
  event: string,
  payload: unknown,
): Promise<void> {
  if (event === "ping") {
    console.log("[github:ping] webhook endpoint verified");
    return;
  }

  const repositoryFullName = extractRepositoryFullName(payload);
  if (!repositoryFullName) {
    console.log(`[github:${event}] missing repository.full_name, skipping`);
    return;
  }

  const eventType = mapGitHubEventToPreferenceId(event);
  if (!eventType) {
    console.log(`[github:${event}] unmapped event for ${repositoryFullName}, skipping`);
    return;
  }

  const integration = await findTeamGitHubIntegrationByRepo(repositoryFullName);
  if (!integration || !integration.isActive) {
    console.log(
      `[github:${event}] no active integration for ${repositoryFullName}, skipping`,
    );
    return;
  }

  const recipients = await findGitHubNotificationRecipients(
    integration.teamId,
    eventType,
  );
  if (recipients.length === 0) {
    console.log(
      `[github:${event}] no recipients for team ${integration.teamId}, skipping`,
    );
    return;
  }

  const embed = formatGitHubNotificationEmbed(
    event,
    eventType,
    payload,
    repositoryFullName,
  );
  if (!embed) {
    console.log(`[github:${event}] could not format notification, skipping`);
    return;
  }

  const discordIds = [
    ...new Set(
      recipients
        .map(resolveDiscordId)
        .filter((discordId): discordId is string => discordId !== null),
    ),
  ];

  if (discordIds.length === 0) {
    console.log(
      `[github:${event}] recipients lack linked Discord accounts for team ${integration.teamId}, skipping`,
    );
    return;
  }

  console.log(
    `[github:${event}] notifying ${discordIds.length} recipient(s) for ${repositoryFullName}`,
  );

  await sendDiscordDmBatch(context.client, discordIds, embed);
}
