import { prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type DeleteTeamPayload = {
  teamIds?: string[];
};

async function deleteTeams(teamIds: string[]): Promise<void> {
  await prisma.$transaction([
    prisma.invite.deleteMany({ where: { teamId: { in: teamIds } } }),
    prisma.notebookLog.deleteMany({ where: { teamId: { in: teamIds } } }),
    prisma.inventoryItemSignOut.deleteMany({ where: { teamId: { in: teamIds } } }),
    prisma.user.updateMany({
      where: { teamId: { in: teamIds } },
      data: { teamId: null },
    }),
    prisma.team.deleteMany({ where: { id: { in: teamIds } } }),
  ]);
}

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

  let body: DeleteTeamPayload;

  try {
    body = (await request.json()) as DeleteTeamPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const teamIds = [...new Set((body.teamIds ?? []).map((id) => id.trim()).filter(Boolean))];

  if (teamIds.length === 0) {
    return NextResponse.json({ error: "At least one teamId is required." }, { status: 400 });
  }

  const existingTeams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: { id: true },
  });

  const existingIds = new Set(existingTeams.map((team) => team.id));
  const missingIds = teamIds.filter((id) => !existingIds.has(id));

  if (missingIds.length > 0) {
    return NextResponse.json(
      { error: `Team not found: ${missingIds.join(", ")}.` },
      { status: 404 },
    );
  }

  await deleteTeams(teamIds);

  return NextResponse.json({ deletedTeamIds: teamIds });
}
