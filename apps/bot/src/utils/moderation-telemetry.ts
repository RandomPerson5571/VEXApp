import type { ModerationAuditPayload, ModerationSideEffects } from "@stlvex/database";
import type { Client } from "discord.js";

import { dispatchSecurityTelemetry } from "../api/handlers/telemetry.js";

function telemetryForAudit(
  event: ModerationAuditPayload,
): { event: string; message: string } | null {
  const name = `**${event.targetFirstName} ${event.targetLastName}**`;
  switch (event.action) {
    case "SUPPRESS":
      return {
        event: "userSuppressed",
        message: `User ${name} suppressed until ${event.until?.toISOString() ?? "?"} — ${event.reason}`,
      };
    case "KICK":
      return {
        event: "userKicked",
        message: `User ${name} kicked from team — ${event.reason}`,
      };
    case "BAN":
      return {
        event: "userBanned",
        message: `User ${name} banned — ${event.reason}`,
      };
    case "UNBAN":
      return {
        event: "userUnbanned",
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
      void dispatchSecurityTelemetry(client, {
        teamId: event.teamId,
        guildId,
        event: mapped.event,
        message: mapped.message,
      }).catch((error) => {
        console.warn("[moderation] security telemetry failed:", error);
      });
    },
  };
}
