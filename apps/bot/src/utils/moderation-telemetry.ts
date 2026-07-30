import type { ModerationAuditPayload, ModerationSideEffects } from "@stlvex/database";
import type { Client } from "discord.js";

import { dispatchSecurityTelemetry } from "../api/handlers/telemetry-logs.js";

function telemetryForAudit(
  event: ModerationAuditPayload,
): { action: string; message: string; fields: Array<{ name: string; value: string }> } | null {
  const name = `**${event.targetFirstName} ${event.targetLastName}**`;
  switch (event.action) {
    case "SUPPRESS":
      return {
        action: "userSuppressed",
        message: `User ${name} suppressed`,
        fields: [
          { name: "Reason", value: event.reason },
          {
            name: "Until",
            value: event.until?.toISOString() ?? "Unknown",
          },
          { name: "Target user ID", value: event.targetUserId },
        ],
      };
    case "KICK":
      return {
        action: "userKicked",
        message: `User ${name} kicked from team`,
        fields: [
          { name: "Reason", value: event.reason },
          { name: "Target user ID", value: event.targetUserId },
        ],
      };
    case "BAN":
      return {
        action: "userBanned",
        message: `User ${name} banned`,
        fields: [
          { name: "Reason", value: event.reason },
          { name: "Target user ID", value: event.targetUserId },
        ],
      };
    case "UNBAN":
      return {
        action: "userUnbanned",
        message: `User ${name} unbanned`,
        fields: [
          { name: "Reason", value: event.reason },
          { name: "Target user ID", value: event.targetUserId },
        ],
      };
    default:
      return null;
  }
}

export function moderationTelemetrySideEffects(
  client: Client,
): ModerationSideEffects {
  return {
    onAudited: (event) => {
      const mapped = telemetryForAudit(event);
      if (!mapped) return;

      void dispatchSecurityTelemetry(client, {
        teamId: event.teamId ?? undefined,
        message: mapped.message,
        action: mapped.action,
        entityType: "user",
        entityId: event.targetUserId,
        actorId: event.actorId,
        occurredAt: new Date().toISOString(),
        fields: mapped.fields,
      }).catch((error) => {
        console.warn("[moderation] security telemetry failed:", error);
      });
    },
  };
}
