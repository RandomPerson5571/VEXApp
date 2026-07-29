import type { ModerationAction, User } from "../generated/prisma/index.js";
import { prisma } from "./prisma";
import {
  canModerateTarget,
  normalizeModerationReason,
  type ModerationOp,
} from "./moderation-policy";

export type ModerationAuditPayload = {
  targetUserId: string;
  actorId: string;
  action: ModerationAction;
  reason: string;
  until?: Date | null;
  targetFirstName: string;
  targetLastName: string;
  teamId: string | null;
};

export type ModerationSideEffects = {
  onAudited?: (event: ModerationAuditPayload) => void;
};

type ActorIds = {
  actorId: string;
  targetUserId: string;
  reason?: string | null;
};

function policyOpFromAction(action: ModerationAction): ModerationOp {
  switch (action) {
    case "SUPPRESS":
      return "suppress";
    case "UNSUPPRESS":
      return "unsuppress";
    case "KICK":
      return "kick";
    case "BAN":
      return "ban";
    case "UNBAN":
      return "unban";
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

async function loadActorAndTarget(actorId: string, targetUserId: string) {
  const [actor, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: actorId } }),
    prisma.user.findUnique({ where: { id: targetUserId } }),
  ]);

  if (!actor) {
    throw new Error("Actor not found.");
  }
  if (!target) {
    throw new Error("User not found.");
  }

  return { actor, target };
}

function assertCanModerate(
  actor: User,
  target: User,
  action: ModerationAction,
): void {
  const allowed = canModerateTarget(
    {
      id: actor.id,
      isAdmin: actor.isAdmin,
      role: actor.role,
      teamId: actor.teamId,
    },
    {
      id: target.id,
      isAdmin: target.isAdmin,
      role: target.role,
      teamId: target.teamId,
    },
    policyOpFromAction(action),
  );

  if (!allowed) {
    throw new Error("Forbidden.");
  }
}

async function appendModerationEvent(input: {
  targetUserId: string;
  actorId: string;
  action: ModerationAction;
  reason: string;
  until?: Date | null;
}): Promise<void> {
  await prisma.moderationEvent.create({
    data: {
      targetUserId: input.targetUserId,
      actorId: input.actorId,
      action: input.action,
      reason: input.reason,
      until: input.until ?? null,
    },
  });
}

export async function suppressUser(
  input: ActorIds & { until: Date },
  sideEffects?: ModerationSideEffects,
): Promise<User> {
  const reason = normalizeModerationReason(input.reason);
  if (input.until.getTime() <= Date.now()) {
    throw new Error("suppressedUntil must be in the future.");
  }

  const { actor, target } = await loadActorAndTarget(
    input.actorId,
    input.targetUserId,
  );
  assertCanModerate(actor, target, "SUPPRESS");

  const updated = await prisma.user.update({
    where: { id: input.targetUserId },
    data: { suppressedUntil: input.until },
  });

  await appendModerationEvent({
    targetUserId: input.targetUserId,
    actorId: input.actorId,
    action: "SUPPRESS",
    reason,
    until: input.until,
  });

  sideEffects?.onAudited?.({
    targetUserId: target.id,
    actorId: actor.id,
    action: "SUPPRESS",
    reason,
    until: input.until,
    targetFirstName: target.firstName,
    targetLastName: target.lastName,
    teamId: target.teamId ?? actor.teamId,
  });

  return updated;
}

export async function unsuppressUser(
  input: ActorIds,
  sideEffects?: ModerationSideEffects,
): Promise<User> {
  const reason = normalizeModerationReason(input.reason ?? "Unsuppressed");

  const { actor, target } = await loadActorAndTarget(
    input.actorId,
    input.targetUserId,
  );
  assertCanModerate(actor, target, "UNSUPPRESS");

  const updated = await prisma.user.update({
    where: { id: input.targetUserId },
    data: { suppressedUntil: null },
  });

  await appendModerationEvent({
    targetUserId: input.targetUserId,
    actorId: input.actorId,
    action: "UNSUPPRESS",
    reason,
  });

  sideEffects?.onAudited?.({
    targetUserId: target.id,
    actorId: actor.id,
    action: "UNSUPPRESS",
    reason,
    targetFirstName: target.firstName,
    targetLastName: target.lastName,
    teamId: target.teamId ?? actor.teamId,
  });

  return updated;
}

export async function kickUser(
  input: ActorIds,
  sideEffects?: ModerationSideEffects,
): Promise<User> {
  const reason = normalizeModerationReason(input.reason);

  const { actor, target } = await loadActorAndTarget(
    input.actorId,
    input.targetUserId,
  );
  assertCanModerate(actor, target, "KICK");

  if (!target.teamId) {
    throw new Error("User is not on a team.");
  }

  const teamId = target.teamId;

  const updated = await prisma.user.update({
    where: { id: input.targetUserId },
    data: { teamId: null },
  });

  await appendModerationEvent({
    targetUserId: input.targetUserId,
    actorId: input.actorId,
    action: "KICK",
    reason,
  });

  sideEffects?.onAudited?.({
    targetUserId: target.id,
    actorId: actor.id,
    action: "KICK",
    reason,
    targetFirstName: target.firstName,
    targetLastName: target.lastName,
    teamId,
  });

  return updated;
}

export async function banUser(
  input: ActorIds,
  sideEffects?: ModerationSideEffects,
): Promise<User> {
  const reason = normalizeModerationReason(input.reason);

  const { actor, target } = await loadActorAndTarget(
    input.actorId,
    input.targetUserId,
  );
  assertCanModerate(actor, target, "BAN");

  const bannedAt = new Date();

  const updated = await prisma.user.update({
    where: { id: input.targetUserId },
    data: {
      bannedAt,
      // Clear team membership on platform ban
      teamId: null,
      suppressedUntil: null,
    },
  });

  await appendModerationEvent({
    targetUserId: input.targetUserId,
    actorId: input.actorId,
    action: "BAN",
    reason,
  });

  sideEffects?.onAudited?.({
    targetUserId: target.id,
    actorId: actor.id,
    action: "BAN",
    reason,
    targetFirstName: target.firstName,
    targetLastName: target.lastName,
    teamId: target.teamId ?? actor.teamId,
  });

  return updated;
}

export async function unbanUser(
  input: ActorIds,
  sideEffects?: ModerationSideEffects,
): Promise<User> {
  const reason = normalizeModerationReason(input.reason ?? "Unbanned");

  const { actor, target } = await loadActorAndTarget(
    input.actorId,
    input.targetUserId,
  );
  assertCanModerate(actor, target, "UNBAN");

  if (!target.bannedAt) {
    throw new Error("User is not banned.");
  }

  const updated = await prisma.user.update({
    where: { id: input.targetUserId },
    data: { bannedAt: null },
  });

  await appendModerationEvent({
    targetUserId: input.targetUserId,
    actorId: input.actorId,
    action: "UNBAN",
    reason,
  });

  sideEffects?.onAudited?.({
    targetUserId: target.id,
    actorId: actor.id,
    action: "UNBAN",
    reason,
    targetFirstName: target.firstName,
    targetLastName: target.lastName,
    teamId: target.teamId ?? actor.teamId,
  });

  return updated;
}

export async function getLatestModerationEvent(targetUserId: string) {
  return prisma.moderationEvent.findFirst({
    where: { targetUserId },
    orderBy: { createdAt: "desc" },
  });
}
