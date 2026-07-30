import { EmbedBuilder } from "discord.js";
import { prisma } from "@stlvex/database";

import type {
  TelemetryDetailField,
  TelemetryLogPayload,
} from "../types/webhook.js";

type LogChannelField =
  | "securityLogsChannelId"
  | "infoLogsChannelId"
  | "inventoryLogsChannelId";

const EMBED_FIELD_MAX = 25;
const EMBED_VALUE_MAX = 1024;

function clampEmbedValue(value: string, max = EMBED_VALUE_MAX): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function humanizeAction(action?: string): string {
  if (!action) return "Telemetry";
  return action
    .split(/[._]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFullDateTime(value: Date): string {
  const iso = value.toISOString();
  const local = value.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });
  return `${local} (${iso})`;
}

async function teamLabel(teamId: string | undefined): Promise<string | null> {
  if (!teamId) return null;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { number: true, name: true },
  });
  if (!team) return null;
  return team.name ? `${team.number} — ${team.name}` : team.number;
}

async function actorLabel(actorId: string | undefined): Promise<string | null> {
  if (!actorId) return null;
  const user = await prisma.user.findUnique({
    where: { id: actorId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      discordId: true,
    },
  });
  if (!user) return actorId;
  const name = `${user.firstName} ${user.lastName}`.trim();
  const parts = [name, user.email, user.discordId ? `Discord ${user.discordId}` : undefined]
    .filter(Boolean);
  return parts.join(" · ");
}

async function buildTelemetryEmbed(
  payload: TelemetryLogPayload,
  options: { defaultTitle: string; color: number },
): Promise<EmbedBuilder> {
  const occurredAt = payload.occurredAt
    ? new Date(payload.occurredAt)
    : new Date();
  const safeOccurredAt = Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt;

  const [team, actor] = await Promise.all([
    teamLabel(payload.teamId),
    actorLabel(payload.actorId),
  ]);

  const embed = new EmbedBuilder()
    .setTitle(humanizeAction(payload.action) || options.defaultTitle)
    .setDescription(clampEmbedValue(payload.message))
    .setColor(options.color)
    .setTimestamp(safeOccurredAt);

  const standardFields: TelemetryDetailField[] = [];

  if (payload.entityType) {
    standardFields.push({ name: "Entity type", value: payload.entityType });
  }
  if (payload.entityId) {
    standardFields.push({ name: "Entity ID", value: payload.entityId });
  }
  if (actor) {
    standardFields.push({ name: "Actor", value: actor });
  }
  if (payload.actorId) {
    standardFields.push({ name: "Actor ID", value: payload.actorId });
  }
  if (team) {
    standardFields.push({ name: "Team", value: team });
  }
  if (payload.teamId) {
    standardFields.push({ name: "Team ID", value: payload.teamId });
  }
  standardFields.push({
    name: "Date & time",
    value: formatFullDateTime(safeOccurredAt),
  });

  const allFields = [...standardFields, ...(payload.fields ?? [])].slice(
    0,
    EMBED_FIELD_MAX,
  );

  for (const field of allFields) {
    embed.addFields({
      name: field.name,
      value: clampEmbedValue(field.value),
    });
  }

  if (payload.action) {
    embed.setFooter({ text: payload.action });
  }

  return embed;
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
  const embed = await buildTelemetryEmbed(payload, {
    defaultTitle: payload.level === "warning" ? "Warning" : "Security",
    color: payload.level === "warning" ? 0xf59e0b : 0xdc2626,
  });

  await broadcastTelemetryEmbed(client, "securityLogsChannelId", embed);
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
    const embed = await buildTelemetryEmbed(payload, {
      defaultTitle: "Info",
      color: 0x3b82f6,
    });

    await broadcastTelemetryEmbed(context.client, "infoLogsChannelId", embed);
  } catch (error) {
    console.warn("[telemetry.info] failed:", error);
  }
}

export async function handleTelemetryInventory(
  context: { client: import("discord.js").Client },
  payload: TelemetryLogPayload,
): Promise<void> {
  try {
    const embed = await buildTelemetryEmbed(payload, {
      defaultTitle: "Inventory",
      color: 0xf59e0b,
    });

    await broadcastTelemetryEmbed(context.client, "inventoryLogsChannelId", embed);
  } catch (error) {
    console.warn("[telemetry.inventory] failed:", error);
  }
}
