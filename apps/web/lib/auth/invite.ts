import { prisma, type Prisma } from "@stlvex/database";
import { cookies } from "next/headers";

export const INVITE_COOKIE = "stlvex_invite_code";

export const INVITE_REQUIRED_MESSAGE =
  "Sign up is invite-only. Use a team invite link to create an account.";

/** Invite.id is the opaque code embedded in /join/[code] URLs. */
export type ValidInvite = {
  id: string;
  teamId: string;
  maxUses: number;
  usesCount: number;
  expiresAt: Date;
};

export class InviteNotFoundError extends Error {
  constructor() {
    super("The invite code is invalid or expired.");
    this.name = "InviteNotFoundError";
  }
}

export class InviteExhaustedError extends Error {
  constructor() {
    super("This invite has reached its maximum number of uses.");
    this.name = "InviteExhaustedError";
  }
}

export class InviteExpiredError extends Error {
  constructor() {
    super("The invite code is invalid or expired.");
    this.name = "InviteExpiredError";
  }
}

export function isInviteUsable(
  invite: Pick<ValidInvite, "expiresAt" | "usesCount" | "maxUses">,
): boolean {
  return (
    invite.expiresAt.getTime() >= Date.now() &&
    invite.usesCount < invite.maxUses
  );
}

export function assertInviteUsable(
  invite: ValidInvite | undefined,
): asserts invite is ValidInvite {
  if (!invite) {
    throw new InviteNotFoundError();
  }

  if (invite.usesCount >= invite.maxUses) {
    throw new InviteExhaustedError();
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    throw new InviteExpiredError();
  }
}

export async function lockInviteForUse(
  tx: Prisma.TransactionClient,
  inviteId: string,
): Promise<ValidInvite> {
  const lockedInvites = await tx.$queryRaw<ValidInvite[]>`
    SELECT
      id,
      "teamId",
      "maxUses",
      "usesCount",
      "expiresAt"
    FROM "Invite"
    WHERE id = ${inviteId}
    FOR UPDATE
  `;

  assertInviteUsable(lockedInvites[0]);
  return lockedInvites[0];
}

export async function incrementInviteUse(
  tx: Prisma.TransactionClient,
  inviteId: string,
): Promise<void> {
  await tx.invite.update({
    where: { id: inviteId },
    data: { usesCount: { increment: 1 } },
  });
}

export async function getInviteByCode(
  code: string,
): Promise<ValidInvite | null> {
  const invite = await prisma.invite.findUnique({
    where: { id: code },
    select: {
      id: true,
      teamId: true,
      maxUses: true,
      usesCount: true,
      expiresAt: true,
    },
  });

  if (!invite || !isInviteUsable(invite)) {
    return null;
  }

  return invite;
}

export async function getValidInviteFromCookies(): Promise<ValidInvite | null> {
  const cookieStore = await cookies();
  const code = cookieStore.get(INVITE_COOKIE)?.value?.trim();

  if (!code) {
    return null;
  }

  return getInviteByCode(code);
}

export async function clearInviteCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(INVITE_COOKIE);
}
