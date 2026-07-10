import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import { DEFAULT_DOCUMENTATION_TEMPLATE } from "@/lib/data/documentation";
import { createTeamDocumentation } from "@/lib/queries/documentation.server";
import type { DocType } from "@stlvex/database/types";

const DOC_TYPES = new Set<DocType>(["PROGRAMMING", "CAD", "HARDWARE", "GENERAL"]);

type CreateDocumentRequestBody = {
  title?: string;
  type?: DocType;
  content?: string;
  folderId?: string;
};

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to create documents." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let body: CreateDocumentRequestBody;

  try {
    body = (await request.json()) as CreateDocumentRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = body.title?.trim();
  const folderId = body.folderId?.trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (!folderId) {
    return NextResponse.json({ error: "Folder id is required." }, { status: 400 });
  }

  if (!body.type || !DOC_TYPES.has(body.type)) {
    return NextResponse.json({ error: "Invalid document type." }, { status: 400 });
  }

  try {
    const doc = await createTeamDocumentation({
      title,
      type: body.type,
      content: body.content ?? DEFAULT_DOCUMENTATION_TEMPLATE,
      folderId,
      authorId: currentUser.profile.id,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create document.";

    const status = message === "Folder not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
