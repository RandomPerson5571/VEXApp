import { Prisma, prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type UpdateTeamPayload = {
  teamId?: string;
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

  let body: UpdateTeamPayload;

  try {
    body = (await request.json()) as UpdateTeamPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const teamId = body.teamId?.trim();

  if (!teamId) {
    return NextResponse.json({ error: "teamId is required." }, { status: 400 });
  }

  const existingTeam = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });

  if (!existingTeam) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  const data: {
    name?: string;
    number?: string;
    discordServerId?: string | null;
    discordRoleId?: string | null;
  } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();

    if (!name) {
      return NextResponse.json({ error: "Team name cannot be empty." }, { status: 400 });
    }

    data.name = name;
  }

  if (body.number !== undefined) {
    const number = body.number.trim().toUpperCase();

    if (!number) {
      return NextResponse.json({ error: "Team number cannot be empty." }, { status: 400 });
    }

    data.number = number;
  }

  if (body.discordServerId !== undefined) {
    data.discordServerId = normalizeOptionalId(body.discordServerId) ?? null;
  }

  if (body.discordRoleId !== undefined) {
    data.discordRoleId = normalizeOptionalId(body.discordRoleId) ?? null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update." },
      { status: 400 },
    );
  }

  try {
    const team = await prisma.team.update({
      where: { id: teamId },
      data,
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
