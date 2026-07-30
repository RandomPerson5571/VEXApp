import { EmbedBuilder } from "discord.js";
import { prisma } from "@stlvex/database";

import type { TelemetryLogPayload } from "../types/webhook.js";

type LogChannelField =
  | "securityLogsChannelId"
  | "infoLogsChannelId"
  | "inventoryLogsChannelId";

export async function postTelemetryEmbed(
  client: import("discord.js").Client,
  guildId: string,
  channelField: LogChannelField,
  embed: EmbedBuilder,
): Promise<void> {
  const guildSettings = await prisma.discordGuildSettings.findUnique({
    where: { guildId },
    select: {
      securityLogsChannelId: true,
      infoLogsChannelId: true,
      inventoryLogsChannelId: true,
    },
  });

  const channelId = guildSettings?.[channelField];
  if (!channelId) {
    console.warn(
      `[telemetry] guild ${guildId} has no ${channelField}; skip send`,
    );
    return;
  }

  const channel = await client.channels.fetch(channelId);
  if (!channel?.isSendable()) {
    console.warn(`[telemetry] channel ${channelId} not sendable`);
    return;
  }

  await channel.send({ embeds: [embed] });
}

export async function dispatchSecurityTelemetry(
  client: import("discord.js").Client,
  payload: TelemetryLogPayload,
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle(payload.level === "warning" ? "Warning" : "Security")
    .setDescription(payload.message)
    .setColor(payload.level === "warning" ? 0xf59e0b : 0xdc2626)
    .setTimestamp(new Date());

  if (payload.action) {
    embed.setFooter({ text: payload.action });
  }

  await postTelemetryEmbed(
    client,
    payload.guildId,
    "securityLogsChannelId",
    embed,
  );
}

export async function handleTelemetrySecurity(
  context: { client: import("discord.js").Client },
  payload: TelemetryLogPayload,
): Promise<void> {
  try {
    await dispatchSecurityTelemetry(context.client, payload);
  } catch (error) {
    console.warn("[telemetry.security] failed:", error);
  }
}

export async function handleTelemetryInfo(
  context: { client: import("discord.js").Client },
  payload: TelemetryLogPayload,
): Promise<void> {
  try {
    const embed = new EmbedBuilder()
      .setTitle("Info")
      .setDescription(payload.message)
      .setColor(0x3b82f6)
      .setTimestamp(new Date());

    if (payload.action) {
      embed.setFooter({ text: payload.action });
    }

    await postTelemetryEmbed(
      context.client,
      payload.guildId,
      "infoLogsChannelId",
      embed,
    );
  } catch (error) {
    console.warn("[telemetry.info] failed:", error);
  }
}

export async function handleTelemetryInventory(
  context: { client: import("discord.js").Client },
  payload: TelemetryLogPayload,
): Promise<void> {
  try {
    const embed = new EmbedBuilder()
      .setTitle("Inventory")
      .setDescription(payload.message)
      .setColor(0xf59e0b)
      .setTimestamp(new Date());

    if (payload.action) {
      embed.setFooter({ text: payload.action });
    }

    await postTelemetryEmbed(
      context.client,
      payload.guildId,
      "inventoryLogsChannelId",
      embed,
    );
  } catch (error) {
    console.warn("[telemetry.inventory] failed:", error);
  }
}
