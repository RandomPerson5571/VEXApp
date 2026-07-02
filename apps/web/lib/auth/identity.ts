import { Prisma, prisma } from "@stlvex/database";
import type { SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type IdentityVerificationResult =
  | { ok: true }
  | { ok: false; error: string };

export type DiscordSyncResult =
  | { ok: true; discordId: string }
  | {
      ok: false;
      error: string;
      code: "not_linked" | "no_profile" | "mismatch" | "conflict";
    };

/**
 * Ensures linked OAuth providers are present on the user object. The JWT-backed
 * `getUser()` payload can omit `identities` after `linkIdentity`, while the
 * session returned from `exchangeCodeForSession` usually includes them.
 */
export async function resolveAuthUserWithIdentities(
  supabase: SupabaseClient,
  user: SupabaseUser,
): Promise<SupabaseUser> {
  const sessionIdentities = user.identities ?? [];

  const { data: identityData } = await supabase.auth.getUserIdentities();
  const fetchedIdentities = identityData?.identities ?? [];

  const identities =
    fetchedIdentities.length > sessionIdentities.length
      ? fetchedIdentities
      : sessionIdentities.length > 0
        ? sessionIdentities
        : fetchedIdentities;

  if (identities.length === 0) {
    return user;
  }

  return { ...user, identities };
}

export function isDiscordAuthUser(user: SupabaseUser): boolean {
  return (
    user.app_metadata?.provider === "discord" ||
    user.identities?.some((identity) => identity.provider === "discord") ===
      true
  );
}

function readDiscordIdFromMetadata(user: SupabaseUser): string | null {
  const providerId = user.user_metadata?.provider_id;
  if (
    typeof providerId === "string" &&
    providerId.length > 0 &&
    providerId !== user.id
  ) {
    return providerId;
  }

  const sub = user.user_metadata?.sub;
  if (typeof sub === "string" && sub.length > 0 && sub !== user.id) {
    return sub;
  }

  return null;
}

export function getDiscordIdFromAuthUser(user: SupabaseUser): string | null {
  const discordIdentity = user.identities?.find(
    (identity) => identity.provider === "discord",
  );

  if (discordIdentity) {
    const identitySub = discordIdentity.identity_data?.sub;
    if (typeof identitySub === "string" && identitySub.length > 0) {
      return identitySub;
    }

    if (discordIdentity.id && discordIdentity.id !== user.id) {
      return discordIdentity.id;
    }
  }

  // Email/password accounts also carry `user_metadata.sub` (the Supabase UUID).
  // Only read provider metadata for Discord-primary sign-in sessions.
  if (isDiscordAuthUser(user)) {
    return readDiscordIdFromMetadata(user);
  }

  return null;
}

export function getDiscordUsernameFromAuthUser(
  user: SupabaseUser,
): string | null {
  const discordIdentity = user.identities?.find(
    (identity) => identity.provider === "discord",
  );
  const identityData = discordIdentity?.identity_data;

  if (typeof identityData?.full_name === "string" && identityData.full_name) {
    return identityData.full_name;
  }

  if (typeof identityData?.username === "string" && identityData.username) {
    return identityData.username;
  }

  if (
    typeof user.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name
  ) {
    return user.user_metadata.full_name;
  }

  if (typeof user.user_metadata?.name === "string" && user.user_metadata.name) {
    return user.user_metadata.name;
  }

  return null;
}

export function getDiscordAvatarUrlFromAuthUser(
  user: SupabaseUser,
): string | null {
  const discordIdentity = user.identities?.find(
    (identity) => identity.provider === "discord",
  );
  const identityData = discordIdentity?.identity_data;

  const candidates = [
    identityData?.avatar_url,
    identityData?.picture,
    user.user_metadata?.avatar_url,
    user.user_metadata?.picture,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("http")) {
      return candidate;
    }
  }

  return null;
}

type DiscordLinkWrite = {
  userId: string;
  discordId: string;
  discordUsername?: string | null;
};

async function writeDiscordLink(
  tx: Prisma.TransactionClient,
  { userId, discordId, discordUsername = null }: DiscordLinkWrite,
): Promise<void> {
  await tx.user.update({
    where: { id: userId },
    data: { discordId },
  });

  await tx.discordAccount.upsert({
    where: { userId },
    create: { userId, discordId, discordUsername },
    update: { discordId, discordUsername },
  });
}

/**
 * Persists the Discord ID from a verified Supabase OAuth identity onto the
 * user's profile. Never accepts a caller-supplied ID — only provider metadata.
 */
export async function syncDiscordIdToProfile(
  authUser: SupabaseUser,
): Promise<DiscordSyncResult> {
  const discordId = getDiscordIdFromAuthUser(authUser);

  if (!discordId || discordId === authUser.id) {
    return {
      ok: false,
      error: "No Discord identity is linked to this session.",
      code: "not_linked",
    };
  }

  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, discordId: true },
  });

  if (!profile) {
    return {
      ok: false,
      error: "No profile exists for this account yet.",
      code: "no_profile",
    };
  }

  if (profile.discordId === discordId) {
    try {
      await prisma.$transaction(async (tx) => {
        await writeDiscordLink(tx, {
          userId: authUser.id,
          discordId,
          discordUsername: getDiscordUsernameFromAuthUser(authUser),
        });
      });
      // Try to copy the Discord avatar into the Supabase auth user metadata
      try {
        const avatarUrl = getDiscordAvatarUrlFromAuthUser(authUser);
        if (avatarUrl) {
          const supabase = await createClient();
          await supabase.auth.updateUser({ data: { user_metadata: { avatar_url: avatarUrl, picture: avatarUrl } } });
        }
      } catch {
        // Non-fatal: ignore failures to update auth metadata
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          ok: false,
          error:
            "That Discord account is already linked to another user. Sign in with the account that owns it, or ask a team lead for help.",
          code: "conflict",
        };
      }

      throw error;
    }

    return { ok: true, discordId };
  }

  if (profile.discordId && profile.discordId !== discordId) {
    return {
      ok: false,
      error:
        "This account is already linked to a different Discord profile. Contact a team lead for help.",
      code: "mismatch",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await writeDiscordLink(tx, {
        userId: authUser.id,
        discordId,
        discordUsername: getDiscordUsernameFromAuthUser(authUser),
      });
    });
    // Try to copy the Discord avatar into the Supabase auth user metadata
    try {
      const avatarUrl = getDiscordAvatarUrlFromAuthUser(authUser);
      if (avatarUrl) {
        const supabase = await createClient();
        await supabase.auth.updateUser({ data: { user_metadata: { avatar_url: avatarUrl, picture: avatarUrl } } });
      }
    } catch {
      // Non-fatal: ignore failures to update auth metadata
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error:
          "That Discord account is already linked to another user. Sign in with the account that owns it, or ask a team lead for help.",
        code: "conflict",
      };
    }

    throw error;
  }

  return { ok: true, discordId };
}

/**
 * Discord OAuth logins are authorized by matching the provider identity to
 * `User.discordId` in the database, bypassing password checks entirely.
 */
export async function verifyDiscordAuthIdentity(
  authUser: SupabaseUser,
): Promise<IdentityVerificationResult> {
  const discordId = getDiscordIdFromAuthUser(authUser);

  if (!discordId) {
    return {
      ok: false,
      error: "Discord sign-in did not return a linked Discord account.",
    };
  }

  const profile = await prisma.user.findUnique({
    where: { discordId },
    select: {
      id: true,
      discordId: true,
    },
  });

  if (!profile) {
    return {
      ok: false,
      error:
        "No account is linked to this Discord profile. Sign up or connect Discord in settings first.",
    };
  }

  if (profile.id !== authUser.id) {
    return {
      ok: false,
      error:
        "This Discord account is registered to a different login. Sign in with email instead.",
    };
  }

  if (profile.discordId !== discordId) {
    return {
      ok: false,
      error: "Discord identity could not be verified against your profile.",
    };
  }

  return { ok: true };
}

const SESSION_PROFILE_SELECT = {
  id: true,
  isVerified: true,
  verificationMethod: true,
  discordId: true,
} as const;

type SessionProfile = {
  id: string;
  isVerified: boolean;
  verificationMethod: "EMAIL" | "DISCORD" | "UNVERIFIED";
  discordId: string | null;
};

const SESSION_VERIFICATION_TTL_MS = 30_000;
/** Verified sessions change rarely — longer TTL avoids repeat Prisma work across navigations. */
const VERIFIED_SESSION_VERIFICATION_TTL_MS = 5 * 60_000;
const sessionVerificationCache = new Map<
  string,
  { result: IdentityVerificationResult; expiresAt: number }
>();

function getSessionVerificationCacheKey(authUser: SupabaseUser): string {
  return [
    authUser.id,
    authUser.updated_at ?? "",
    authUser.email_confirmed_at ?? "",
    isDiscordAuthUser(authUser)
      ? (getDiscordIdFromAuthUser(authUser) ?? "")
      : "",
  ].join(":");
}

function emailProfileVerificationError(): IdentityVerificationResult {
  return {
    ok: false,
    error:
      "Your email address has not been verified yet. Check your inbox or continue with Discord.",
  };
}

function discordOnlyAccountError(): IdentityVerificationResult {
  return {
    ok: false,
    error: "This account uses Discord sign-in. Continue with Discord instead.",
  };
}

async function verifyDiscordAuthIdentityWithProfile(
  authUser: SupabaseUser,
  profile: Pick<SessionProfile, "id" | "discordId">,
): Promise<IdentityVerificationResult> {
  const discordId = getDiscordIdFromAuthUser(authUser);

  if (!discordId) {
    return {
      ok: false,
      error: "Discord sign-in did not return a linked Discord account.",
    };
  }

  if (profile.discordId) {
    if (profile.discordId !== discordId) {
      return {
        ok: false,
        error:
          "This account is already linked to a different Discord profile. Contact a team lead for help.",
      };
    }

    if (profile.id !== authUser.id) {
      return {
        ok: false,
        error:
          "This Discord account is registered to a different login. Sign in with email instead.",
      };
    }

    return { ok: true };
  }

  return await verifyDiscordAuthIdentity(authUser);
}

async function maybeConfirmProfileVerification(
  authUser: SupabaseUser,
  profile: SessionProfile,
): Promise<SessionProfile> {
  if (profile.isVerified) {
    return profile;
  }

  if (
    (profile.verificationMethod === "EMAIL" ||
      profile.verificationMethod === "UNVERIFIED") &&
    authUser.email_confirmed_at
  ) {
    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        isVerified: true,
        verificationMethod: "EMAIL",
      },
    });

    return {
      ...profile,
      isVerified: true,
      verificationMethod: "EMAIL",
    };
  }

  if (profile.verificationMethod === "DISCORD" && isDiscordAuthUser(authUser)) {
    const discordCheck = await verifyDiscordAuthIdentityWithProfile(
      authUser,
      profile,
    );

    if (discordCheck.ok) {
      await prisma.user.update({
        where: { id: authUser.id },
        data: { isVerified: true },
      });

      return { ...profile, isVerified: true };
    }
  }

  return profile;
}

/**
 * Skips Discord re-verification and profile confirmation writes when the stored
 * profile is already verified and matches the current session identity.
 */
function tryVerifiedProfileFastPath(
  authUser: SupabaseUser,
  profile: SessionProfile,
): IdentityVerificationResult | null {
  if (!profile.isVerified) {
    return null;
  }

  if (isDiscordAuthUser(authUser)) {
    const discordId = getDiscordIdFromAuthUser(authUser);

    if (
      discordId &&
      profile.discordId === discordId &&
      profile.id === authUser.id
    ) {
      return { ok: true };
    }

    return null;
  }

  if (profile.verificationMethod === "DISCORD") {
    return null;
  }

  return { ok: true };
}

async function resolveSessionIdentity(
  authUser: SupabaseUser,
): Promise<IdentityVerificationResult> {
  const existingProfile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: SESSION_PROFILE_SELECT,
  });

  if (!existingProfile) {
    return { ok: true };
  }

  const fastPath = tryVerifiedProfileFastPath(authUser, existingProfile);
  if (fastPath) {
    return fastPath;
  }

  const profile = await maybeConfirmProfileVerification(
    authUser,
    existingProfile,
  );

  if (isDiscordAuthUser(authUser)) {
    return await verifyDiscordAuthIdentityWithProfile(authUser, profile);
  }

  if (profile.verificationMethod === "DISCORD") {
    return discordOnlyAccountError();
  }

  if (!profile.isVerified) {
    return emailProfileVerificationError();
  }

  return { ok: true };
}

function getSessionVerificationCacheTtl(
  result: IdentityVerificationResult,
): number {
  return result.ok
    ? VERIFIED_SESSION_VERIFICATION_TTL_MS
    : SESSION_VERIFICATION_TTL_MS;
}

/**
 * Authorizes an existing Supabase session for app access. Used by the OAuth
 * callback and server-side user resolution — not the request proxy.
 *
 * Wrapped in React `cache()` so layout + page share one pass per request.
 */
export const verifySessionIdentity = cache(
  async (authUser: SupabaseUser): Promise<IdentityVerificationResult> => {
    const cacheKey = getSessionVerificationCacheKey(authUser);
    const cached = sessionVerificationCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    const result = await resolveSessionIdentity(authUser);

    sessionVerificationCache.set(cacheKey, {
      result,
      expiresAt: Date.now() + getSessionVerificationCacheTtl(result),
    });

    return result;
  },
);

/**
 * Marks invite/onboarding profiles verified once the user completes the
 * configured verification step (email confirmation or Discord identity).
 */
export async function confirmProfileVerification(
  authUser: SupabaseUser,
): Promise<void> {
  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: SESSION_PROFILE_SELECT,
  });

  if (!profile) {
    return;
  }

  await maybeConfirmProfileVerification(authUser, profile);
  sessionVerificationCache.delete(getSessionVerificationCacheKey(authUser));
}

/**
 * Email/password logins require a confirmed email address and an
 * email-verified profile when one already exists.
 */
export async function verifyEmailCredentialIdentity(
  authUser: SupabaseUser,
): Promise<IdentityVerificationResult> {
  if (!authUser.email_confirmed_at) {
    return {
      ok: false,
      error: "Confirm your email address before signing in with a password.",
    };
  }

  return verifySessionIdentity(authUser);
}
