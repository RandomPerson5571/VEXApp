import { prisma } from "@stlvex/database";
import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";

type TogglePermissionsPayload = {
  userId?: string;
  isAdmin?: boolean;
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

  let body: TogglePermissionsPayload;

  try {
    body = (await request.json()) as TogglePermissionsPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userId = body.userId?.trim();
  const isAdmin = body.isAdmin;

  if (!userId || typeof isAdmin !== "boolean") {
    return NextResponse.json(
      { error: "userId and isAdmin are required." },
      { status: 400 },
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isAdmin: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (targetUser.isAdmin === isAdmin) {
    return NextResponse.json({ userId, isAdmin });
  }

  if (!isAdmin && userId === currentUser.profile.id) {
    return NextResponse.json(
      { error: "You cannot revoke your own platform administrator access." },
      { status: 400 },
    );
  }

  if (!isAdmin && targetUser.isAdmin) {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });

    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last platform administrator." },
        { status: 400 },
      );
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isAdmin },
  });

  return NextResponse.json({ userId, isAdmin });
}
