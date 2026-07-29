import { NextResponse } from "next/server";

import { rejectIfBannedOrSuppressed } from "@/lib/auth/reject-if-suppressed";
import { unbanUser } from "@/lib/data/moderation";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type Body = {
  userId?: string;
  reason?: string;
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

  try {
    const user = await unbanUser({
      targetUserId: userId,
      actorId: currentUser.profile.id,
      reason: body.reason,
    });
    return NextResponse.json({
      userId: user.id,
      bannedAt: user.bannedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to unban user.";
    const status = message === "Forbidden." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
