import { prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import { canCreateInvites } from "@/lib/auth/auth-guards";
import { getCurrentUser } from "@/lib/auth/current-user";
import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { teamId, maxUses, expiresAt } = body as {
    teamId?: string;
    maxUses?: number;
    expiresAt?: string;
  };

  if (!teamId || typeof teamId !== "string" || !teamId.trim()) {
    return NextResponse.json({ error: "Select a team before creating a link." }, { status: 400 });
  }

  const trimmedTeamId = teamId.trim();

  const parsedMaxUses = Number(maxUses);

  if (!Number.isInteger(parsedMaxUses) || parsedMaxUses < 1) {
    return NextResponse.json({ error: "Max uses must be at least 1." }, { status: 400 });
  }

  const parsedExpiry = new Date(String(expiresAt));

  if (Number.isNaN(parsedExpiry.getTime())) {
    return NextResponse.json({ error: "Enter a valid expiry date and time." }, { status: 400 });
  }

  if (parsedExpiry <= new Date()) {
    return NextResponse.json({ error: "Expiry date must be in the future." }, { status: 400 });
  }

  const permissions = await verifyCurrentUserPermissions(trimmedTeamId);

  if (!canCreateInvites(permissions)) {
    return NextResponse.json({ error: "You do not have permission to create invites for this team." }, { status: 403 });
  }

  const team = await prisma.team.findUnique({
    where: { id: trimmedTeamId },
    select: { id: true },
  });

  if (!team) {
    return NextResponse.json({ error: "That team could not be found." }, { status: 404 });
  }

  const invite = await prisma.invite.create({
    data: {
      id: crypto.randomUUID(),
      teamId: team.id,
      maxUses: parsedMaxUses,
      expiresAt: parsedExpiry,
    },
    select: { id: true },
  });

  const origin = req.headers.get("origin") || `${req.url?.startsWith("https://") ? "https" : "http"}://${req.headers.get("host")}`;
  const link = `${origin?.replace(/\/$/, "")}/join/${invite.id}`;

  return NextResponse.json({ inviteId: invite.id, link });
}
