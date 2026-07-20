import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  deleteScoutNote,
  getScoutNoteById,
  updateScoutNote,
} from "@/lib/data/scout-notes";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type UpdateScoutNoteBody = {
  targetTeamNumber?: string;
  targetTeamName?: string | null;
  content?: string;
};

type RouteContext = {
  params: Promise<{ noteId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;
  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team." },
      { status: 400 },
    );
  }

  const { noteId } = await context.params;
  if (!noteId?.trim()) {
    return NextResponse.json({ error: "Note id is required." }, { status: 400 });
  }

  const note = await getScoutNoteById(noteId);
  if (!note || note.teamId !== teamId) {
    return NextResponse.json({ error: "Scout note not found." }, { status: 404 });
  }

  return NextResponse.json(note);
}

export async function PATCH(request: Request, context: RouteContext) {
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
      { error: "You must belong to a team to update scout notes." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  const { noteId } = await context.params;
  if (!noteId?.trim()) {
    return NextResponse.json({ error: "Note id is required." }, { status: 400 });
  }

  let body: UpdateScoutNoteBody;
  try {
    body = (await request.json()) as UpdateScoutNoteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const note = await updateScoutNote({
      noteId,
      teamId,
      targetTeamNumber: body.targetTeamNumber,
      targetTeamName: body.targetTeamName,
      content: body.content,
    });
    return NextResponse.json(note);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update scout note.";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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
      { error: "You must belong to a team to delete scout notes." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  const { noteId } = await context.params;
  if (!noteId?.trim()) {
    return NextResponse.json({ error: "Note id is required." }, { status: 400 });
  }

  try {
    await deleteScoutNote(noteId, teamId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete scout note.";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
