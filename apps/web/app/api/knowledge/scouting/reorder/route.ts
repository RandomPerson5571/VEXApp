import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { reorderScoutNotes } from "@/lib/data/scout-notes";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type ReorderBody = {
  orderedNoteIds?: unknown;
  dnpNoteIds?: unknown;
};

function asIdArray(value: unknown, label: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string")) {
    throw new Error(`${label} must be an array of strings.`);
  }
  return value;
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
      { error: "You must belong to a team to reorder the picklist." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let body: ReorderBody;
  try {
    body = (await request.json()) as ReorderBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const orderedNoteIds = asIdArray(body.orderedNoteIds, "orderedNoteIds");
    const dnpNoteIds = asIdArray(body.dnpNoteIds, "dnpNoteIds");
    const notes = await reorderScoutNotes({
      teamId,
      orderedNoteIds,
      dnpNoteIds,
    });
    return NextResponse.json(notes);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reorder picklist.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
