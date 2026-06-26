import { prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import { INVITE_COOKIE, isInviteUsable } from "@/lib/auth/invite";
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
  const signupUrl = new URL("/signup", requestUrl.origin);
  const invite = await prisma.invite.findUnique({
    where: { id: code },
    select: { id: true, expiresAt: true, usesCount: true, maxUses: true },
  });

  if (!invite || !isInviteUsable(invite)) {
    signupUrl.searchParams.set("message", "Invite code is invalid or expired.");
    return NextResponse.redirect(signupUrl);
  }

  signupUrl.searchParams.set("redirectTo", "/onboarding");
  signupUrl.searchParams.set("message", "Invite saved. Finish your profile.");

  const response = NextResponse.redirect(signupUrl);
  response.cookies.set({
    name: INVITE_COOKIE,
    value: invite.id,
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
