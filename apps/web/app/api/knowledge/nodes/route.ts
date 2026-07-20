import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createKnowledgeNode,
  listKnowledgeNodes,
} from "@/lib/data/knowledge-nodes";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import type { ContentType, TopicCategory } from "@stlvex/database/types";

const TOPIC_CATEGORIES = new Set<TopicCategory>([
  "PROGRAMMING",
  "CAD",
  "HARDWARE",
  "GENERAL",
]);

const CONTENT_TYPES = new Set<ContentType>(["SLIDESHOW", "LINK", "MARKDOWN"]);

type CreateNodeBody = {
  title?: string;
  topicCategory?: TopicCategory;
  contentType?: ContentType;
  contentUrl?: string | null;
  content?: string | null;
};

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;
  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to view knowledge nodes." },
      { status: 400 },
    );
  }

  const nodes = await listKnowledgeNodes(teamId);
  return NextResponse.json(nodes);
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
      { error: "You must belong to a team to create knowledge nodes." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let body: CreateNodeBody;
  try {
    body = (await request.json()) as CreateNodeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (!body.topicCategory || !TOPIC_CATEGORIES.has(body.topicCategory)) {
    return NextResponse.json(
      { error: "Invalid topic category." },
      { status: 400 },
    );
  }

  if (!body.contentType || !CONTENT_TYPES.has(body.contentType)) {
    return NextResponse.json(
      { error: "Invalid content type." },
      { status: 400 },
    );
  }

  try {
    const node = await createKnowledgeNode({
      teamId,
      title,
      topicCategory: body.topicCategory,
      contentType: body.contentType,
      contentUrl: body.contentUrl,
      content: body.content,
      createdById: currentUser.profile.id,
    });
    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create node.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
