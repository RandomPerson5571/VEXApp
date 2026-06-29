import { NextResponse } from "next/server";

import { canDelegateTeamLeaders } from "@/lib/auth/auth-guards";
import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createTeamFolder,
  getTeamDocumentationTree,
} from "@/lib/queries/folders.server";

type CreateFolderRequestBody = {
  name?: string;
};

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!currentUser.profile.teamId) {
    return NextResponse.json([]);
  }

  const tree = await getTeamDocumentationTree(currentUser.profile.teamId);
  return NextResponse.json(tree);
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to create folders." },
      { status: 400 },
    );
  }

  const permissions = await verifyCurrentUserPermissions(teamId);

  if (!canDelegateTeamLeaders(permissions)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: CreateFolderRequestBody;

  try {
    body = (await request.json()) as CreateFolderRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
  }

  try {
    const folder = await createTeamFolder({ name });
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create folder.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
