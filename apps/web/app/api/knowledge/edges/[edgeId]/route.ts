import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { deleteKnowledgeEdge } from "@/lib/data/knowledge-edges";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type RouteContext = {
  params: Promise<{ edgeId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;
  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to delete edges." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  const { edgeId } = await context.params;
  if (!edgeId?.trim()) {
    return NextResponse.json({ error: "Edge id is required." }, { status: 400 });
  }

  try {
    await deleteKnowledgeEdge(edgeId, teamId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete edge.";
    const status = message === "Edge not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
