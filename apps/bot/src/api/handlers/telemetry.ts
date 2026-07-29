import { EmbedBuilder } from "discord.js";
import { prisma } from "@stlvex/database";

import type { WebhookContext } from "../context.js";
import type { TelemetryChannelPayload } from "../types/webhook.js";

async function sendToTeamChannel(
  context: WebhookContext,
  teamId: string,
  channelField: "annoucementsChannelId" | "adminLogsChannelId",
  content: string,
  embed: EmbedBuilder,
): Promise<void> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      annoucementsChannelId: true,
      adminLogsChannelId: true,
      number: true,
      name: true,
    },
  });

  if (!team) {
    console.warn(`[telemetry] team ${teamId} not found`);
    return;
  }

  const channelId = team[channelField];
  if (!channelId) {
    console.warn(
      `[telemetry] team ${team.number} has no ${channelField}; skip send`,
    );
    return;
  }

  const channel = await context.client.channels.fetch(channelId);
  if (!channel?.isSendable()) {
    console.warn(`[telemetry] channel ${channelId} not sendable`);
    return;
  }

  await channel.send({ content, embeds: [embed] });
}

export async function handleTelemetryActionable(
  context: WebhookContext,
  payload: TelemetryChannelPayload,
): Promise<void> {
  try {
    const embed = new EmbedBuilder()
      .setTitle("Team ops")
      .setDescription(payload.message)
      .setColor(0xea580c)
      .setTimestamp(new Date())
      .setFooter({ text: payload.event });

    await sendToTeamChannel(
      context,
      payload.teamId,
      "annoucementsChannelId",
      "",
      embed,
    );
  } catch (error) {
    console.warn("[telemetry.actionable] failed:", error);
  }
}

export async function handleTelemetrySecurity(
  context: WebhookContext,
  payload: TelemetryChannelPayload,
): Promise<void> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: payload.teamId },
      select: { purchasingManagerRoleId: true, discordRoleId: true },
    });

    const roleId = team?.purchasingManagerRoleId ?? team?.discordRoleId;
    const mention = roleId ? `<@&${roleId}>` : "";

    const embed = new EmbedBuilder()
      .setTitle("Security")
      .setDescription(payload.message)
      .setColor(0xdc2626)
      .setTimestamp(new Date())
      .setFooter({ text: payload.event });

    await sendToTeamChannel(
      context,
      payload.teamId,
      "adminLogsChannelId",
      mention,
      embed,
    );
  } catch (error) {
    console.warn("[telemetry.security] failed:", error);
  }
}
