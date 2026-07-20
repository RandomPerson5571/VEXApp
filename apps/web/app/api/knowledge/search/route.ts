import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { searchKnowledgeNodes } from "@/lib/data/knowledge-search";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type SearchBody = {
  query?: string;
  limit?: number;
};

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;
  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to search knowledge." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let body: SearchBody;
  try {
    body = (await request.json()) as SearchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json(
      { error: "Search query is required." },
      { status: 400 },
    );
  }

  try {
    const hits = await searchKnowledgeNodes(teamId, query, body.limit);
    return NextResponse.json(hits);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search knowledge.";

    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
