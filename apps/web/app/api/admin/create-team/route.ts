import { Prisma, prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type CreateTeamPayload = {
  name?: string;
  number?: string;
  discordServerId?: string | null;
  discordRoleId?: string | null;
};

const teamSelect = {
  id: true,
  name: true,
  number: true,
  discordServerId: true,
  discordRoleId: true,
} as const;

function normalizeOptionalId(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function formatUniqueConstraintError(
  error: Prisma.PrismaClientKnownRequestError,
): string {
  const target = error.meta?.target;

  if (Array.isArray(target)) {
    if (target.includes("number")) {
      return "A team with this number already exists.";
    }

    if (target.includes("discordServerId")) {
      return "This Discord server ID is already linked to another team.";
    }

    if (target.includes("discordRoleId")) {
      return "This Discord role ID is already linked to another team.";
    }
  }

  return "A team with these details already exists.";
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

  let body: CreateTeamPayload;

  try {
    body = (await request.json()) as CreateTeamPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const number = body.number?.trim().toUpperCase();

  if (!name) {
    return NextResponse.json({ error: "Team name is required." }, { status: 400 });
  }

  if (!number) {
    return NextResponse.json({ error: "Team number is required." }, { status: 400 });
  }

  const discordServerId = normalizeOptionalId(body.discordServerId);
  const discordRoleId = normalizeOptionalId(body.discordRoleId);

  try {
    const team = await prisma.team.create({
      data: {
        name,
        number,
        ...(discordServerId !== undefined && { discordServerId }),
        ...(discordRoleId !== undefined && { discordRoleId }),
      },
      select: teamSelect,
    });

    return NextResponse.json(team);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: formatUniqueConstraintError(error) },
        { status: 409 },
      );
    }

    throw error;
  }
}
