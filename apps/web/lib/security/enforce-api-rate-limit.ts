import { NextResponse } from "next/server";

import { getRequestClientIp } from "@/lib/security/client-ip";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";

export const API_MUTATION_RATE_LIMITS = {
  team: {
    user: { limit: 60, windowMs: 60_000 },
    ip: { limit: 120, windowMs: 60_000 },
  },
  admin: {
    user: { limit: 30, windowMs: 60_000 },
    ip: { limit: 60, windowMs: 60_000 },
  },
  integrations: {
    user: { limit: 20, windowMs: 60_000 },
    ip: { limit: 40, windowMs: 60_000 },
  },
  notifications: {
    user: { limit: 10, windowMs: 60_000 },
    ip: { limit: 30, windowMs: 60_000 },
  },
  invite: {
    user: { limit: 10, windowMs: 60_000 },
    ip: { limit: 20, windowMs: 60_000 },
  },
} as const;

export type ApiMutationRateLimitBucket = keyof typeof API_MUTATION_RATE_LIMITS;

export async function enforceApiRateLimit(
  request: Request,
  userId: string,
  bucket: ApiMutationRateLimitBucket,
): Promise<NextResponse | null> {
  const config = API_MUTATION_RATE_LIMITS[bucket];

  const userResult = await consumeRateLimit(
    `api-${bucket}:user`,
    userId,
    config.user,
  );

  if (!userResult.allowed) {
    return rateLimitExceededResponse(userResult);
  }

  const clientIp = getRequestClientIp(request);
  const ipResult = await consumeRateLimit(
    `api-${bucket}:ip`,
    clientIp,
    config.ip,
  );

  if (!ipResult.allowed) {
    return rateLimitExceededResponse(ipResult);
  }

  return null;
}
