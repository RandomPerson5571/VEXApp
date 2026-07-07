import {
  findFusionNotificationRecipients,
  findTeamFusionIntegrationByProjectUrn,
} from "@stlvex/database";

import {
  extractFusionProjectUrn,
  formatFusionNotificationEmbed,
} from "../../services/fusion-notifications.js";
import { sendDiscordDmBatch } from "../../services/discord-dm.js";
import type { WebhookContext } from "../context.js";
import type { FusionWebhookPayload } from "../types/fusion.js";

function resolveDiscordId(user: {
  discordId: string | null;
  discordAccount: { discordId: string } | null;
}): string | null {
  return user.discordId ?? user.discordAccount?.discordId ?? null;
}

export async function handleFusionEvent(
  context: WebhookContext,
  payload: FusionWebhookPayload,
): Promise<void> {
  const event = payload.hook?.event ?? "unknown";
  const projectUrn = extractFusionProjectUrn(payload);

  if (!projectUrn) {
    console.log(`[fusion:${event}] missing project URN, skipping`);
    return;
  }

  const integration = await findTeamFusionIntegrationByProjectUrn(projectUrn);
  if (!integration || !integration.isActive) {
    console.log(
      `[fusion:${event}] no active integration for ${projectUrn}, skipping`,
    );
    return;
  }

  const recipients = await findFusionNotificationRecipients(integration.teamId);
  if (recipients.length === 0) {
    console.log(
      `[fusion:${event}] no recipients for team ${integration.teamId}, skipping`,
    );
    return;
  }

  const embed = formatFusionNotificationEmbed(payload, projectUrn);
  if (!embed) {
    console.log(`[fusion:${event}] could not format notification, skipping`);
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
      `[fusion:${event}] recipients lack linked Discord accounts for team ${integration.teamId}, skipping`,
    );
    return;
  }

  console.log(
    `[fusion:${event}] notifying ${discordIds.length} recipient(s) for ${projectUrn}`,
  );

  await sendDiscordDmBatch(context.client, discordIds, embed);
}
