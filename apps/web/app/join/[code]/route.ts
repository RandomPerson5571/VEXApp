import { prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import {
  clearInviteCookieFromResponse,
  getInviteCookieMaxAgeSeconds,
  getInviteJoinFailureReason,
  INVITE_COOKIE,
} from "@/lib/auth/invite";
import { getRequestClientIp } from "@/lib/security/client-ip";
import {
  consumeRateLimit,
  JOIN_INVITE_RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const clientIp = getRequestClientIp(request);
  const ipLimit = await consumeRateLimit(
    "join-invite:ip",
    clientIp,
    JOIN_INVITE_RATE_LIMITS.ip,
  );

  if (!ipLimit.allowed) {
    return rateLimitExceededResponse(ipLimit);
  }

  const { code } = await params;
  const requestUrl = new URL(request.url);
  const secure = requestUrl.protocol === "https:";
  const invite = await prisma.invite.findUnique({
    where: { id: code },
    select: {
      id: true,
      expiresAt: true,
      usesCount: true,
      maxUses: true,
      reservedByUserId: true,
      reservedAt: true,
    },
  });

  const failureReason = getInviteJoinFailureReason(invite);

  if (failureReason) {
    const invalidUrl = new URL("/invite-invalid", requestUrl.origin);
    invalidUrl.searchParams.set("reason", failureReason);

    return clearInviteCookieFromResponse(
      NextResponse.redirect(invalidUrl),
      secure,
    );
  }

  const onboardingUrl = new URL("/onboarding", requestUrl.origin);
  const response = NextResponse.redirect(onboardingUrl);

  response.cookies.set({
    name: INVITE_COOKIE,
    value: invite!.id,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: getInviteCookieMaxAgeSeconds(invite!.expiresAt),
  });

  return response;
}
