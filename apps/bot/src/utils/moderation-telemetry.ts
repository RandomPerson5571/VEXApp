import type { ModerationAuditPayload, ModerationSideEffects } from "@stlvex/database";
import type { Client } from "discord.js";
import { prisma } from "@stlvex/database";

import { dispatchSecurityTelemetry } from "../api/handlers/telemetry-logs.js";

function telemetryForAudit(
  event: ModerationAuditPayload,
): { action: string; message: string } | null {
  const name = `**${event.targetFirstName} ${event.targetLastName}**`;
  switch (event.action) {
    case "SUPPRESS":
      return {
        action: "userSuppressed",
        message: `User ${name} suppressed until ${event.until?.toISOString() ?? "?"} — ${event.reason}`,
      };
    case "KICK":
      return {
        action: "userKicked",
        message: `User ${name} kicked from team — ${event.reason}`,
      };
    case "BAN":
      return {
        action: "userBanned",
        message: `User ${name} banned — ${event.reason}`,
      };
    case "UNBAN":
      return {
        action: "userUnbanned",
        message: `User ${name} unbanned — ${event.reason}`,
      };
    default:
      return null;
  }
}

export function moderationTelemetrySideEffects(
  client: Client,
  guildId: string | null,
): ModerationSideEffects {
  return {
    onAudited: (event) => {
      if (!event.teamId) return;
      const mapped = telemetryForAudit(event);
      if (!mapped) return;

      void (async () => {
        let resolvedGuildId = guildId;
        if (!resolvedGuildId) {
          const team = await prisma.team.findUnique({
            where: { id: event.teamId! },
            select: { discordServerId: true },
          });
          resolvedGuildId = team?.discordServerId ?? null;
        }
        if (!resolvedGuildId) {
          console.warn(
            `[moderation] no guild for team ${event.teamId}; skip security log`,
          );
          return;
        }

        await dispatchSecurityTelemetry(client, {
          guildId: resolvedGuildId,
          teamId: event.teamId ?? undefined,
          message: mapped.message,
          action: mapped.action,
        });
      })().catch((error) => {
        console.warn("[moderation] security telemetry failed:", error);
      });
    },
  };
}
