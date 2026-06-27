import { prisma, type Prisma } from "@stlvex/database";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const INVITE_COOKIE = "stlvex_invite_code";

export const INVITE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type InviteJoinFailureReason =
  | "not_found"
  | "expired"
  | "exhausted"
  | "reserved";

export const INVITE_REQUIRED_MESSAGE =
  "Sign up is invite-only. Use a team invite link to create an account.";

export const DISCORD_LOGIN_REQUIRES_ACCOUNT_MESSAGE =
  "Discord sign-in is only available for existing linked accounts. Use a team invite link to sign up.";

export const RESERVATION_TTL_MS = 48 * 60 * 60 * 1000;

/** Invite.id is the opaque code embedded in /join/[code] URLs. */
export type ValidInvite = {
  id: string;
  teamId: string;
  maxUses: number;
  usesCount: number;
  expiresAt: Date;
  reservedByUserId: string | null;
  reservedAt: Date | null;
};

const inviteSelect = {
  id: true,
  teamId: true,
  maxUses: true,
  usesCount: true,
  expiresAt: true,
  reservedByUserId: true,
  reservedAt: true,
} as const;

export class InviteNotFoundError extends Error {
  constructor() {
    super(
      "This invite link is invalid. Double-check the URL or ask your team lead for a new one.",
    );
    this.name = "InviteNotFoundError";
  }
}

export class InviteExhaustedError extends Error {
  constructor() {
    super(
      "This invite has already been used the maximum number of times. Request a new invite from your team.",
    );
    this.name = "InviteExhaustedError";
  }
}

export class InviteExpiredError extends Error {
  constructor() {
    super(
      "This invite link has expired. Ask your team lead to send a fresh invite.",
    );
    this.name = "InviteExpiredError";
  }
}

export class InviteReservedError extends Error {
  constructor() {
    super(
      "Someone else is currently completing signup with this invite. Try again later or ask for a new link.",
    );
    this.name = "InviteReservedError";
  }
}

export function isReservationActive(
  invite: Pick<ValidInvite, "reservedByUserId" | "reservedAt">,
): boolean {
  if (!invite.reservedByUserId || !invite.reservedAt) {
    return false;
  }

  return invite.reservedAt.getTime() + RESERVATION_TTL_MS > Date.now();
}

function withExpiredReservationCleared<T extends Pick<ValidInvite, "reservedByUserId" | "reservedAt">>(
  invite: T,
): T {
  if (!isReservationActive(invite)) {
    return { ...invite, reservedByUserId: null, reservedAt: null };
  }

  return invite;
}

const inviteFailureSelect = {
  expiresAt: true,
  usesCount: true,
  maxUses: true,
  reservedByUserId: true,
  reservedAt: true,
} as const;

export function getInviteJoinFailureReason(
  invite: Pick<
    ValidInvite,
    "expiresAt" | "usesCount" | "maxUses" | "reservedByUserId" | "reservedAt"
  > | null | undefined,
): InviteJoinFailureReason | null {
  if (!invite) {
    return "not_found";
  }

  const normalized = withExpiredReservationCleared(invite);

  if (normalized.usesCount >= normalized.maxUses) {
    return "exhausted";
  }

  if (normalized.expiresAt.getTime() < Date.now()) {
    return "expired";
  }

  if (isReservationActive(normalized)) {
    return "reserved";
  }

  return null;
}

/** Looks up an invite code and returns why it cannot be used, if at all. */
export async function getInviteFailureReason(
  code: string,
): Promise<InviteJoinFailureReason> {
  const invite = await prisma.invite.findUnique({
    where: { id: code.trim() },
    select: inviteFailureSelect,
  });

  return getInviteJoinFailureReason(invite) ?? "not_found";
}

/** Resolves why an authenticated user's invite (metadata or cookie) is invalid. */
export async function getInviteInvalidReasonForAuthUser(user: {
  id: string;
  user_metadata?: Record<string, unknown>;
}): Promise<InviteJoinFailureReason> {
  const metadataCode = getInviteCodeFromUserMetadata(user);
  const cookieCode = await getInviteCodeFromCookies();
  const code = metadataCode ?? cookieCode;

  if (!code) {
    return "not_found";
  }

  return getInviteFailureReason(code);
}

export function getInviteCookieMaxAgeSeconds(expiresAt: Date): number {
  const secondsUntilExpiry = Math.floor(
    (expiresAt.getTime() - Date.now()) / 1000,
  );

  return Math.max(
    0,
    Math.min(INVITE_COOKIE_MAX_AGE_SECONDS, secondsUntilExpiry),
  );
}

export function isInviteUsable(
  invite: Pick<
    ValidInvite,
    "expiresAt" | "usesCount" | "maxUses" | "reservedByUserId" | "reservedAt"
  >,
  forAuthUserId?: string,
): boolean {
  const normalized = withExpiredReservationCleared(invite);

  if (
    isReservationActive(normalized) &&
    normalized.reservedByUserId !== forAuthUserId
  ) {
    return false;
  }

  return (
    normalized.expiresAt.getTime() >= Date.now() &&
    normalized.usesCount < normalized.maxUses
  );
}

export function assertInviteUsable(
  invite: ValidInvite | undefined,
  forAuthUserId?: string,
): asserts invite is ValidInvite {
  if (!invite) {
    throw new InviteNotFoundError();
  }

  const normalized = withExpiredReservationCleared(invite);

  if (normalized.usesCount >= normalized.maxUses) {
    throw new InviteExhaustedError();
  }

  if (normalized.expiresAt.getTime() < Date.now()) {
    throw new InviteExpiredError();
  }

  if (
    isReservationActive(normalized) &&
    normalized.reservedByUserId !== forAuthUserId
  ) {
    throw new InviteReservedError();
  }
}

async function lockInviteRow(
  tx: Prisma.TransactionClient,
  inviteId: string,
): Promise<ValidInvite | undefined> {
  const lockedInvites = await tx.$queryRaw<ValidInvite[]>`
    SELECT
      id,
      "teamId",
      "maxUses",
      "usesCount",
      "expiresAt",
      "reservedByUserId",
      "reservedAt"
    FROM "Invite"
    WHERE id = ${inviteId}
    FOR UPDATE
  `;

  const invite = lockedInvites[0];
  return invite ? withExpiredReservationCleared(invite) : undefined;
}

export async function lockInviteForUse(
  tx: Prisma.TransactionClient,
  inviteId: string,
  forAuthUserId?: string,
): Promise<ValidInvite> {
  const invite = await lockInviteRow(tx, inviteId);
  assertInviteUsable(invite, forAuthUserId);
  return invite;
}

export async function reserveInviteForUser(
  tx: Prisma.TransactionClient,
  inviteId: string,
  authUserId: string,
): Promise<ValidInvite> {
  const invite = await lockInviteRow(tx, inviteId);
  assertInviteUsable(invite, authUserId);

  return tx.invite.update({
    where: { id: inviteId },
    data: {
      reservedByUserId: authUserId,
      reservedAt: new Date(),
    },
    select: inviteSelect,
  });
}

export async function releaseInviteReservation(
  tx: Prisma.TransactionClient,
  inviteId: string,
  authUserId: string,
): Promise<void> {
  const invite = await lockInviteRow(tx, inviteId);

  if (!invite) {
    throw new InviteNotFoundError();
  }

  if (invite.reservedByUserId === authUserId) {
    await tx.invite.update({
      where: { id: inviteId },
      data: {
        reservedByUserId: null,
        reservedAt: null,
      },
    });
  }
}

export async function consumeInvite(
  tx: Prisma.TransactionClient,
  inviteId: string,
  authUserId: string,
): Promise<ValidInvite> {
  const invite = await lockInviteRow(tx, inviteId);
  assertInviteUsable(invite, authUserId);

  return tx.invite.update({
    where: { id: inviteId },
    data: {
      usesCount: { increment: 1 },
      reservedByUserId: null,
      reservedAt: null,
    },
    select: inviteSelect,
  });
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
  forAuthUserId?: string,
): Promise<ValidInvite | null> {
  const invite = await prisma.invite.findUnique({
    where: { id: code },
    select: inviteSelect,
  });

  if (!invite || !isInviteUsable(invite, forAuthUserId)) {
    return null;
  }

  return withExpiredReservationCleared(invite);
}

export function getInviteCodeFromUserMetadata(user: {
  user_metadata?: Record<string, unknown>;
}): string | null {
  const code = user.user_metadata?.invite_code;
  return typeof code === "string" && code.trim() ? code.trim() : null;
}

export function getInviteFailureReasonFromError(
  error: unknown,
): InviteJoinFailureReason {
  if (error instanceof InviteReservedError) {
    return "reserved";
  }

  if (error instanceof InviteExpiredError) {
    return "expired";
  }

  if (error instanceof InviteExhaustedError) {
    return "exhausted";
  }

  return "not_found";
}

export function applyInviteCookieToResponse(
  response: NextResponse,
  invite: Pick<ValidInvite, "id" | "expiresAt">,
  secure: boolean,
): NextResponse {
  response.cookies.set({
    name: INVITE_COOKIE,
    value: invite.id,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: getInviteCookieMaxAgeSeconds(invite.expiresAt),
  });

  return response;
}

export function clearInviteCookieFromResponse(
  response: NextResponse,
  secure: boolean,
): NextResponse {
  response.cookies.set({
    name: INVITE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });

  return response;
}

export type ResolvedInvite = {
  invite: ValidInvite | null;
  refreshCookie: boolean;
};

export async function resolveInviteForAuthUser(user: {
  id: string;
  user_metadata?: Record<string, unknown>;
}): Promise<ResolvedInvite> {
  const metadataCode = getInviteCodeFromUserMetadata(user);
  const cookieStore = await cookies();
  const cookieCode = cookieStore.get(INVITE_COOKIE)?.value?.trim() ?? null;

  if (metadataCode) {
    const invite = await getInviteByCode(metadataCode, user.id);
    return {
      invite,
      refreshCookie: Boolean(invite && cookieCode !== invite.id),
    };
  }

  const invite = cookieCode
    ? await getInviteByCode(cookieCode, user.id)
    : null;

  return { invite, refreshCookie: false };
}

export async function getInviteCodeFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const code = cookieStore.get(INVITE_COOKIE)?.value?.trim();

  return code || null;
}

export async function getValidInviteFromCookies(
  forAuthUserId?: string,
): Promise<ValidInvite | null> {
  const code = await getInviteCodeFromCookies();

  if (!code) {
    return null;
  }

  return getInviteByCode(code, forAuthUserId);
}

export async function clearInviteCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(INVITE_COOKIE);
}
