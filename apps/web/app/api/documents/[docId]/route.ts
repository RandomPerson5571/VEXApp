import { NextResponse } from "next/server";

import { canDelegateTeamLeaders } from "@/lib/auth/auth-guards";
import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  deleteTeamDocumentation,
  getDocumentationDetail,
  updateTeamDocumentation,
} from "@/lib/queries/documentation.server";
import type { DocType } from "@stlvex/database/types";

const DOC_TYPES = new Set<DocType>(["PROGRAMMING", "CAD", "HARDWARE", "GENERAL"]);

type UpdateDocumentRequestBody = {
  title?: string;
  type?: DocType;
  content?: string;
};

type RouteContext = {
  params: Promise<{ docId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { docId } = await context.params;

  if (!docId?.trim()) {
    return NextResponse.json({ error: "Document id is required." }, { status: 400 });
  }

  const doc = await getDocumentationDetail(docId);

  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json(doc);
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to update documents." },
      { status: 400 },
    );
  }

  const { docId } = await context.params;

  if (!docId?.trim()) {
    return NextResponse.json({ error: "Document id is required." }, { status: 400 });
  }

  let body: UpdateDocumentRequestBody;

  try {
    body = (await request.json()) as UpdateDocumentRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const hasTitle = body.title !== undefined;
  const hasType = body.type !== undefined;
  const hasContent = body.content !== undefined;

  if (!hasTitle && !hasType && !hasContent) {
    return NextResponse.json(
      { error: "At least one field to update is required." },
      { status: 400 },
    );
  }

  if (hasType && (!body.type || !DOC_TYPES.has(body.type))) {
    return NextResponse.json({ error: "Invalid document type." }, { status: 400 });
  }

  const permissions = await verifyCurrentUserPermissions(teamId);
  const isLeader = canDelegateTeamLeaders(permissions);

  try {
    const doc = await updateTeamDocumentation({
      docId,
      title: hasTitle ? body.title : undefined,
      type: hasType ? body.type : undefined,
      content: hasContent ? body.content : undefined,
      userId: currentUser.profile.id,
      isLeader,
    });

    return NextResponse.json(doc);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update document.";

    if (message === "Document not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message === "You do not have permission to edit this document.") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
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
      { error: "You must belong to a team to delete documents." },
      { status: 400 },
    );
  }

  const permissions = await verifyCurrentUserPermissions(teamId);

  if (!canDelegateTeamLeaders(permissions)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { docId } = await context.params;

  if (!docId?.trim()) {
    return NextResponse.json({ error: "Document id is required." }, { status: 400 });
  }

  try {
    await deleteTeamDocumentation(docId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete document.";

    const status = message === "Document not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
