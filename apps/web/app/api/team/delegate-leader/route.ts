import { prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import { canDelegateTeamLeaders } from "@/lib/auth/auth-guards";
import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";

type DelegateLeaderPayload = {
  teamId?: string;
  userId?: string;
};

export async function POST(request: Request) {
  let body: DelegateLeaderPayload;

  try {
    body = (await request.json()) as DelegateLeaderPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const teamId = body.teamId?.trim();
  const userId = body.userId?.trim();

  if (!teamId || !userId) {
    return NextResponse.json(
      { error: "teamId and userId are required." },
      { status: 400 },
    );
  }

  const permissions = await verifyCurrentUserPermissions(teamId);

  if (!canDelegateTeamLeaders(permissions)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const targetMember = await prisma.user.findFirst({
    where: { id: userId, teamId },
    select: { id: true, role: true },
  });

  if (!targetMember) {
    return NextResponse.json(
      { error: "Team member not found on this team." },
      { status: 404 },
    );
  }

  if (targetMember.role !== "TEAM_MEMBER") {
    return NextResponse.json(
      { error: "Only standard members can be promoted to team leader." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "TEAM_LEADER" },
  });

  return NextResponse.json({ userId, teamId, role: "TEAM_LEADER" });
}
