import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getTeamMembers } from "@/lib/queries/team-members.server";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!currentUser.profile.teamId) {
    return NextResponse.json([]);
  }

  const members = await getTeamMembers(currentUser.profile.teamId);
  return NextResponse.json(members);
}
