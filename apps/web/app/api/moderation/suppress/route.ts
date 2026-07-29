import { NextResponse } from "next/server";

import { rejectIfBannedOrSuppressed } from "@/lib/auth/reject-if-suppressed";
import { suppressUser } from "@/lib/data/moderation";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type Body = {
  userId?: string;
  until?: string;
  reason?: string;
  /** Hours from now; used when until is omitted. Default 24. */
  hours?: number;
};

export async function POST(request: Request) {
  const gated = await rejectIfBannedOrSuppressed();
  if (!gated.ok) return gated.response;

  const currentUser = gated.user;
  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const until = body.until
    ? new Date(body.until)
    : new Date(
        Date.now() +
          (body.hours && body.hours > 0 ? body.hours : 24) * 3_600_000,
      );

  if (Number.isNaN(until.getTime())) {
    return NextResponse.json({ error: "Invalid until date." }, { status: 400 });
  }

  try {
    const user = await suppressUser({
      targetUserId: userId,
      actorId: currentUser.profile.id,
      reason: body.reason,
      until,
    });
    return NextResponse.json({
      userId: user.id,
      suppressedUntil: user.suppressedUntil,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to suppress user.";
    const status = message === "Forbidden." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
