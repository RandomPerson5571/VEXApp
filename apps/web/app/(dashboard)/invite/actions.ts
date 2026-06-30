"use server";

import { randomUUID } from "node:crypto";

import { prisma } from "@stlvex/database";

import { getSiteUrl } from "@/app/(auth)/lib/site-url";
import { canCreateInvites } from "@/lib/auth/auth-guards";
import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";

export type CreateInviteInput = {
  teamId: string;
  maxUses: number;
  expiresAt: string;
};

export type CreateInviteResult =
  | { ok: true; link: string; inviteId: string }
  | { ok: false; error: string };

export async function createInviteLink({
  teamId,
  maxUses,
  expiresAt,
}: CreateInviteInput): Promise<CreateInviteResult> {
  const trimmedTeamId = teamId.trim();

  if (!trimmedTeamId) {
    return { ok: false, error: "Select a team before creating a link." };
  }

  const permissions = await verifyCurrentUserPermissions(trimmedTeamId);

  if (!canCreateInvites(permissions)) {
    return {
      ok: false,
      error: "You do not have permission to create invites for this team.",
    };
  }

  if (!Number.isInteger(maxUses) || maxUses < 1) {
    return { ok: false, error: "Max uses must be at least 1." };
  }

  const parsedExpiry = new Date(expiresAt);

  if (Number.isNaN(parsedExpiry.getTime())) {
    return {
      ok: false,
      error: "Enter a valid expiry date and time.",
    };
  }

  if (parsedExpiry <= new Date()) {
    return { ok: false, error: "Expiry date must be in the future." };
  }

  const team = await prisma.team.findUnique({
    where: { id: trimmedTeamId },
    select: { id: true },
  });

  if (!team) {
    return { ok: false, error: "That team could not be found." };
  }

  const invite = await prisma.invite.create({
    data: {
      id: randomUUID(),
      teamId: team.id,
      maxUses,
      expiresAt: parsedExpiry,
    },
    select: { id: true },
  });

  const siteUrl = await getSiteUrl();

  return {
    ok: true,
    inviteId: invite.id,
    link: `${siteUrl}/join/${invite.id}`,
  };
}
