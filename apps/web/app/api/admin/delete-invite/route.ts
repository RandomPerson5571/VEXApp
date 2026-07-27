import { prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type DeleteInvitePayload = {
  inviteIds?: string[];
};

export async function POST(request: Request) {
  const permissions = await verifyCurrentUserPermissions();

  if (!permissions.authorized || permissions.scope !== "GLOBAL") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "admin",
  );
  if (limited) return limited;

  let body: DeleteInvitePayload;

  try {
    body = (await request.json()) as DeleteInvitePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const inviteIds = [
    ...new Set((body.inviteIds ?? []).map((id) => id.trim()).filter(Boolean)),
  ];

  if (inviteIds.length === 0) {
    return NextResponse.json(
      { error: "At least one inviteId is required." },
      { status: 400 },
    );
  }

  const result = await prisma.invite.deleteMany({
    where: { id: { in: inviteIds } },
  });

  return NextResponse.json({
    deletedInviteIds: inviteIds,
    deletedCount: result.count,
  });
}
