import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createScoutNote, listScoutNotes } from "@/lib/data/scout-notes";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type CreateScoutNoteBody = {
  targetTeamNumber?: string;
  targetTeamName?: string | null;
  content?: string;
};

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;
  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to view scout notes." },
      { status: 400 },
    );
  }

  const notes = await listScoutNotes(teamId);
  return NextResponse.json(notes);
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

  const teamId = currentUser.profile.teamId;
  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to create scout notes." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let body: CreateScoutNoteBody;
  try {
    body = (await request.json()) as CreateScoutNoteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const targetTeamNumber = body.targetTeamNumber?.trim();
  if (!targetTeamNumber) {
    return NextResponse.json(
      { error: "Team number is required." },
      { status: 400 },
    );
  }

  try {
    const note = await createScoutNote({
      teamId,
      targetTeamNumber,
      targetTeamName: body.targetTeamName,
      content: body.content,
      createdById: currentUser.profile.id,
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create scout note.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
