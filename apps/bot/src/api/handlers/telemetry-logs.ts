import { EmbedBuilder } from "discord.js";
import { prisma } from "@stlvex/database";

import type { TelemetryLogPayload } from "../types/webhook.js";

type LogChannelField =
  | "securityLogsChannelId"
  | "infoLogsChannelId"
  | "inventoryLogsChannelId";

async function teamNumberLabel(teamId: string | undefined): Promise<string | null> {
  if (!teamId) return null;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { number: true },
  });
  return team?.number ?? null;
}

function embedFooter(
  action: string | undefined,
  teamNumber: string | null,
): string | undefined {
  const parts = [action, teamNumber ? `Team ${teamNumber}` : undefined].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

async function broadcastTelemetryEmbed(
  client: import("discord.js").Client,
  channelField: LogChannelField,
  embed: EmbedBuilder,
): Promise<void> {
  const guildSettings = await prisma.discordGuildSettings.findMany({
    where: { [channelField]: { not: null } },
    select: {
      guildId: true,
      securityLogsChannelId: true,
      infoLogsChannelId: true,
      inventoryLogsChannelId: true,
    },
  });

  const targets = guildSettings
    .map((row) => ({
      guildId: row.guildId,
      channelId: row[channelField],
    }))
    .filter((row) => row.channelId != null);

  if (targets.length === 0) {
    console.warn(`[telemetry] no guilds with ${channelField}; skip send`);
    return;
  }

  for (const { guildId, channelId } of targets) {
    try {
      const channel = await client.channels.fetch(channelId!);
      if (!channel?.isSendable()) {
        console.warn(
          `[telemetry] guild ${guildId} channel ${channelId} not sendable`,
        );
        continue;
      }
      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.warn(
        `[telemetry] guild ${guildId} channel ${channelId} failed:`,
        error,
      );
    }
  }
}

export async function dispatchSecurityTelemetry(
  client: import("discord.js").Client,
  payload: TelemetryLogPayload,
): Promise<void> {
  const teamNumber = await teamNumberLabel(payload.teamId);
  const embed = new EmbedBuilder()
    .setTitle(payload.level === "warning" ? "Warning" : "Security")
    .setDescription(payload.message)
    .setColor(payload.level === "warning" ? 0xf59e0b : 0xdc2626)
    .setTimestamp(new Date());

  const footer = embedFooter(payload.action, teamNumber);
  if (footer) embed.setFooter({ text: footer });

  await broadcastTelemetryEmbed(
    client,
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
    const teamNumber = await teamNumberLabel(payload.teamId);
    const embed = new EmbedBuilder()
      .setTitle("Info")
      .setDescription(payload.message)
      .setColor(0x3b82f6)
      .setTimestamp(new Date());

    const footer = embedFooter(payload.action, teamNumber);
    if (footer) embed.setFooter({ text: footer });

    await broadcastTelemetryEmbed(
      context.client,
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
    const teamNumber = await teamNumberLabel(payload.teamId);
    const embed = new EmbedBuilder()
      .setTitle("Inventory")
      .setDescription(payload.message)
      .setColor(0xf59e0b)
      .setTimestamp(new Date());

    const footer = embedFooter(payload.action, teamNumber);
    if (footer) embed.setFooter({ text: footer });

    await broadcastTelemetryEmbed(
      context.client,
      "inventoryLogsChannelId",
      embed,
    );
  } catch (error) {
    console.warn("[telemetry.inventory] failed:", error);
  }
}
