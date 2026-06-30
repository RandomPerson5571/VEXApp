import { prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";

export async function POST() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.team?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const invite = await prisma.invite.create({
    data: {
      id: crypto.randomUUID(),
      teamId: currentUser.team.id,
      maxUses: 1,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    select: { id: true },
  });

  return NextResponse.json({ inviteId: invite.id });
}
