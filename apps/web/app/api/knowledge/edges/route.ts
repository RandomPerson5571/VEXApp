import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DEFAULT_EDGE_RELATIONSHIP } from "@/lib/knowledge/constants";
import {
  createKnowledgeEdge,
  listKnowledgeEdges,
} from "@/lib/data/knowledge-edges";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type CreateEdgeBody = {
  sourceId?: string;
  targetId?: string;
  relationshipType?: string;
};

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;
  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to view knowledge edges." },
      { status: 400 },
    );
  }

  const edges = await listKnowledgeEdges(teamId);
  return NextResponse.json(edges);
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
      { error: "You must belong to a team to create knowledge edges." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let body: CreateEdgeBody;
  try {
    body = (await request.json()) as CreateEdgeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sourceId = body.sourceId?.trim();
  const targetId = body.targetId?.trim();
  const relationshipType =
    body.relationshipType?.trim() || DEFAULT_EDGE_RELATIONSHIP;

  if (!sourceId || !targetId) {
    return NextResponse.json(
      { error: "sourceId and targetId are required." },
      { status: 400 },
    );
  }

  try {
    const edge = await createKnowledgeEdge({
      teamId,
      sourceId,
      targetId,
      relationshipType,
    });
    return NextResponse.json(edge, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create edge.";
    const status =
      message === "Source node not found." || message === "Target node not found."
        ? 404
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
