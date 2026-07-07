import { prisma } from "@stlvex/database";

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export async function consumeRateLimit(
  bucket: string,
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const windowIndex = Math.floor(Date.now() / config.windowMs);
  const key = `${bucket}:${identifier}:${windowIndex}`;
  const expiresAt = new Date((windowIndex + 1) * config.windowMs);

  const count = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`DELETE FROM "AuthRateLimit" WHERE "expiresAt" < NOW()`;

    const rows = await tx.$queryRaw<{ count: number }[]>`
      INSERT INTO "AuthRateLimit" (key, count, "expiresAt")
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT (key) DO UPDATE
      SET count = "AuthRateLimit".count + 1
      RETURNING count
    `;

    return rows[0]?.count ?? 1;
  });

  if (count > config.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
      ),
    };
  }

  return { allowed: true };
}

export const AUTH_RATE_LIMITS = {
  loginIp: { limit: 20, windowMs: 15 * 60 * 1000 },
  loginEmail: { limit: 10, windowMs: 15 * 60 * 1000 },
  signupIp: { limit: 10, windowMs: 60 * 60 * 1000 },
  signupEmail: { limit: 5, windowMs: 60 * 60 * 1000 },
  resetIp: { limit: 10, windowMs: 60 * 60 * 1000 },
  resetEmail: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const;

export type AuthRateLimitBucket = "login" | "signup" | "reset";

export function authRateLimitErrorMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export async function enforceAuthRateLimit(
  bucket: AuthRateLimitBucket,
  { ip, email }: { ip: string; email?: string },
): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const ipConfig = AUTH_RATE_LIMITS[`${bucket}Ip`];
  const ipResult = await consumeRateLimit(`auth-${bucket}:ip`, ip, ipConfig);

  if (!ipResult.allowed) {
    return { ok: false, retryAfterSeconds: ipResult.retryAfterSeconds };
  }

  if (email) {
    const emailConfig = AUTH_RATE_LIMITS[`${bucket}Email`];
    const normalizedEmail = email.trim().toLowerCase();
    const emailResult = await consumeRateLimit(
      `auth-${bucket}:email`,
      normalizedEmail,
      emailConfig,
    );

    if (!emailResult.allowed) {
      return { ok: false, retryAfterSeconds: emailResult.retryAfterSeconds };
    }
  }

  return { ok: true };
}

export const JOIN_INVITE_RATE_LIMITS = {
  ip: { limit: 60, windowMs: 15 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;

export const PROFILE_UPDATE_RATE_LIMITS = {
  user: { limit: 10, windowMs: 60 * 60 * 1000 },
  ip: { limit: 30, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;

export const ACCOUNT_DELETE_RATE_LIMITS = {
  user: { limit: 3, windowMs: 60 * 60 * 1000 },
  ip: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;
