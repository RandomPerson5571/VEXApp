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

export const REGISTER_INVITE_RATE_LIMITS = {
  ip: { limit: 10, windowMs: 15 * 60 * 1000 },
  inviteCode: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;

export const JOIN_INVITE_RATE_LIMITS = {
  ip: { limit: 60, windowMs: 15 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;
