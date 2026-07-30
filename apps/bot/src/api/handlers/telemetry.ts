import { EmbedBuilder } from "discord.js";
import { prisma } from "@stlvex/database";

import type { WebhookContext } from "../context.js";
import type { TelemetryChannelPayload } from "../types/webhook.js";

async function sendToTeamAnnouncementsChannel(
  context: WebhookContext,
  teamId: string,
  content: string,
  embed: EmbedBuilder,
): Promise<void> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      annoucementsChannelId: true,
      number: true,
    },
  });

  if (!team) {
    console.warn(`[telemetry] team ${teamId} not found`);
    return;
  }

  const channelId = team.annoucementsChannelId;
  if (!channelId) {
    console.warn(
      `[telemetry] team ${team.number} has no annoucementsChannelId; skip send`,
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

async function sendToGuildAdminLogsChannel(
  context: WebhookContext,
  teamId: string,
  embed: EmbedBuilder,
): Promise<void> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      discordServerId: true,
      discordRoleId: true,
      number: true,
    },
  });

  if (!team) {
    console.warn(`[telemetry] team ${teamId} not found`);
    return;
  }

  if (!team.discordServerId) {
    console.warn(
      `[telemetry] team ${team.number} has no discordServerId; skip admin logs`,
    );
    return;
  }

  const guildSettings = await prisma.discordGuildSettings.findUnique({
    where: { guildId: team.discordServerId },
    select: { adminLogsChannelId: true },
  });

  const channelId = guildSettings?.adminLogsChannelId;
  if (!channelId) {
    console.warn(
      `[telemetry] guild ${team.discordServerId} has no adminLogsChannelId; skip send`,
    );
    return;
  }

  const channel = await context.client.channels.fetch(channelId);
  if (!channel?.isSendable()) {
    console.warn(`[telemetry] channel ${channelId} not sendable`);
    return;
  }

  const mention = team.discordRoleId ? `<@&${team.discordRoleId}>` : "";
  await channel.send({ content: mention, embeds: [embed] });
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

    await sendToTeamAnnouncementsChannel(
      context,
      payload.teamId,
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
    const embed = new EmbedBuilder()
      .setTitle("Security")
      .setDescription(payload.message)
      .setColor(0xdc2626)
      .setTimestamp(new Date())
      .setFooter({ text: payload.event });

    await sendToGuildAdminLogsChannel(context, payload.teamId, embed);
  } catch (error) {
    console.warn("[telemetry.security] failed:", error);
  }
}
