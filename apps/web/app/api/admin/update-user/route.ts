import { prisma } from "@stlvex/database";
import type { UserRole } from "@stlvex/database/types";
import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";

const VALID_ROLES = new Set<UserRole>(["ADMIN", "TEAM_LEADER", "TEAM_MEMBER"]);

type UpdateUserPayload = {
  userId?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  teamId?: string | null;
};

export async function POST(request: Request) {
  const permissions = await verifyCurrentUserPermissions();

  if (!permissions.authorized || permissions.scope !== "GLOBAL") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: UpdateUserPayload;

  try {
    body = (await request.json()) as UpdateUserPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userId = body.userId?.trim();

  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const data: {
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    teamId?: string | null;
  } = {};

  if (body.firstName !== undefined) {
    const firstName = body.firstName.trim();

    if (!firstName) {
      return NextResponse.json(
        { error: "First name cannot be empty." },
        { status: 400 },
      );
    }

    data.firstName = firstName;
  }

  if (body.lastName !== undefined) {
    const lastName = body.lastName.trim();

    if (!lastName) {
      return NextResponse.json(
        { error: "Last name cannot be empty." },
        { status: 400 },
      );
    }

    data.lastName = lastName;
  }

  if (body.role !== undefined) {
    if (!VALID_ROLES.has(body.role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    data.role = body.role;
  }

  if (body.teamId !== undefined) {
    if (body.teamId === null || body.teamId === "") {
      data.teamId = null;
    } else {
      const teamId = body.teamId.trim();
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true },
      });

      if (!team) {
        return NextResponse.json({ error: "Team not found." }, { status: 404 });
      }

      data.teamId = teamId;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update." },
      { status: 400 },
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      teamId: true,
      team: { select: { id: true, name: true, number: true } },
    },
  });

  return NextResponse.json(updatedUser);
}
