import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getTeamInventory } from "@/lib/queries/inventory.server";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!currentUser.profile.teamId) {
    return NextResponse.json([]);
  }

  const inventory = await getTeamInventory(currentUser.profile.teamId);
  return NextResponse.json(inventory);
}
