import type { UserRole } from "../generated/prisma/index.js";

export type ModerationOp =
  | "suppress"
  | "unsuppress"
  | "kick"
  | "ban"
  | "unban";

export type ModerationActor = {
  id: string;
  isAdmin: boolean;
  role: UserRole;
  teamId: string | null;
};

export type ModerationTarget = {
  id: string;
  isAdmin: boolean;
  role: UserRole;
  teamId: string | null;
};

function isTeamLeaderRole(role: UserRole): boolean {
  return role === "TEAM_LEADER" || role === "ADMIN";
}

/**
 * Pure peer-protection policy for moderation actions.
 * Admins cannot act on other admins; leaders only act on same-team TEAM_MEMBER.
 */
export function canModerateTarget(
  actor: ModerationActor,
  target: ModerationTarget,
  op: ModerationOp,
): boolean {
  if (actor.id === target.id) {
    return false;
  }

  if (actor.isAdmin) {
    if (target.isAdmin) {
      return false;
    }
    return true;
  }

  if (!isTeamLeaderRole(actor.role)) {
    return false;
  }

  if (op === "ban" || op === "unban") {
    return false;
  }

  if (target.isAdmin || isTeamLeaderRole(target.role)) {
    return false;
  }

  if (target.role !== "TEAM_MEMBER") {
    return false;
  }

  if (!actor.teamId || actor.teamId !== target.teamId) {
    return false;
  }

  return true;
}

export function normalizeModerationReason(
  reason: string | null | undefined,
): string {
  const trimmed = reason?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "No reason provided";
}
