import "server-only";

import {
  banUser as banUserDb,
  kickUser as kickUserDb,
  suppressUser as suppressUserDb,
  unbanUser as unbanUserDb,
  unsuppressUser as unsuppressUserDb,
  type ModerationAuditPayload,
} from "@stlvex/database";
import type { User } from "@stlvex/database/types";

import { createAdminClient } from "@/lib/supabase/admin";
import { logTelemetry } from "@/lib/telemetry/dispatch";

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

function sideEffects() {
  return {
    onAudited: (event: ModerationAuditPayload) => {
      const mapped = telemetryForAudit(event);
      if (!mapped) return;
      logTelemetry({
        category: "security",
        teamId: event.teamId ?? undefined,
        message: mapped.message,
        action: mapped.action,
      });
    },
  };
}

/** ponytail: service-role revoke stays in web — packages/database must stay Next-free. */
async function revokeSupabaseSessions(userId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.auth.admin.signOut(userId, "global");
  } catch (error) {
    console.error("Failed to revoke Supabase sessions after ban:", error);
  }
}

export async function suppressUser(input: {
  targetUserId: string;
  actorId: string;
  reason?: string | null;
  until: Date;
}): Promise<User> {
  return suppressUserDb(input, sideEffects());
}

export async function unsuppressUser(input: {
  targetUserId: string;
  actorId: string;
  reason?: string | null;
}): Promise<User> {
  return unsuppressUserDb(input, sideEffects());
}

export async function kickUser(input: {
  targetUserId: string;
  actorId: string;
  reason?: string | null;
}): Promise<User> {
  return kickUserDb(input, sideEffects());
}

export async function banUser(input: {
  targetUserId: string;
  actorId: string;
  reason?: string | null;
}): Promise<User> {
  const updated = await banUserDb(input, sideEffects());
  await revokeSupabaseSessions(input.targetUserId);
  return updated;
}

export async function unbanUser(input: {
  targetUserId: string;
  actorId: string;
  reason?: string | null;
}): Promise<User> {
  return unbanUserDb(input, sideEffects());
}
