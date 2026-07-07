import { EmbedBuilder } from "discord.js";

import type { FusionWebhookPayload } from "../api/types/fusion.js";

const FUSION_COLOR = 0x0696d7;

export function extractFusionProjectUrn(
  payload: FusionWebhookPayload,
): string | undefined {
  const folder = payload.hook?.scope?.folder?.trim();
  if (folder) {
    return folder;
  }

  const urn = payload.hook?.urn?.trim();
  return urn || undefined;
}

export function formatFusionNotificationEmbed(
  payload: FusionWebhookPayload,
  projectUrn: string,
): EmbedBuilder | null {
  const event = payload.hook?.event?.trim() || "fusion.event";
  const eventPayload = payload.payload;

  const title =
    event === "dm.version.added"
      ? "Fusion design version added"
      : `Fusion ${event}`;

  const descriptionParts: string[] = [`Project: \`${projectUrn}\``];

  if (eventPayload && typeof eventPayload === "object") {
    const name = readString(eventPayload as Record<string, unknown>, "name");
    const versionNumber = readNumber(
      eventPayload as Record<string, unknown>,
      "versionNumber",
    );

    if (name) {
      descriptionParts.push(`Item: **${name}**`);
    }

    if (versionNumber !== undefined) {
      descriptionParts.push(`Version: **v${versionNumber}**`);
    }
  }

  return new EmbedBuilder()
    .setColor(FUSION_COLOR)
    .setTitle(title)
    .setDescription(descriptionParts.join("\n"))
    .setTimestamp(new Date());
}

function readString(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(data: Record<string, unknown>, key: string): number | undefined {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
