import { NextResponse } from "next/server";

import { canDelegateTeamLeaders } from "@/lib/auth/auth-guards";
import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  deleteTeamFolder,
  updateTeamFolder,
} from "@/lib/queries/folders.server";

type UpdateFolderRequestBody = {
  name?: string;
};

type RouteContext = {
  params: Promise<{ folderId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to update folders." },
      { status: 400 },
    );
  }

  const permissions = await verifyCurrentUserPermissions(teamId);

  if (!canDelegateTeamLeaders(permissions)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { folderId } = await context.params;

  if (!folderId?.trim()) {
    return NextResponse.json({ error: "Folder id is required." }, { status: 400 });
  }

  let body: UpdateFolderRequestBody;

  try {
    body = (await request.json()) as UpdateFolderRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
  }

  try {
    const folder = await updateTeamFolder({ folderId, name });
    return NextResponse.json(folder);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update folder.";

    const status = message === "Folder not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to delete folders." },
      { status: 400 },
    );
  }

  const permissions = await verifyCurrentUserPermissions(teamId);

  if (!canDelegateTeamLeaders(permissions)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { folderId } = await context.params;

  if (!folderId?.trim()) {
    return NextResponse.json({ error: "Folder id is required." }, { status: 400 });
  }

  try {
    await deleteTeamFolder(folderId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete folder.";

    const status = message === "Folder not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
