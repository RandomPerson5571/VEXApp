import { NextResponse } from "next/server";

import { canDelegateTeamLeaders } from "@/lib/auth/auth-guards";
import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  deleteKnowledgeNode,
  getKnowledgeNodeById,
  updateKnowledgeNode,
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

type UpdateNodeBody = {
  title?: string;
  topicCategory?: TopicCategory;
  contentType?: ContentType;
  contentUrl?: string | null;
  content?: string | null;
};

type RouteContext = {
  params: Promise<{ nodeId: string }>;
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

  const { nodeId } = await context.params;
  if (!nodeId?.trim()) {
    return NextResponse.json({ error: "Node id is required." }, { status: 400 });
  }

  const node = await getKnowledgeNodeById(nodeId);
  if (!node || node.teamId !== teamId) {
    return NextResponse.json({ error: "Node not found." }, { status: 404 });
  }

  return NextResponse.json(node);
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;
  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to update nodes." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  const { nodeId } = await context.params;
  if (!nodeId?.trim()) {
    return NextResponse.json({ error: "Node id is required." }, { status: 400 });
  }

  let body: UpdateNodeBody;
  try {
    body = (await request.json()) as UpdateNodeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    body.title === undefined &&
    body.topicCategory === undefined &&
    body.contentType === undefined &&
    body.contentUrl === undefined &&
    body.content === undefined
  ) {
    return NextResponse.json(
      { error: "At least one field to update is required." },
      { status: 400 },
    );
  }

  if (
    body.topicCategory !== undefined &&
    !TOPIC_CATEGORIES.has(body.topicCategory)
  ) {
    return NextResponse.json(
      { error: "Invalid topic category." },
      { status: 400 },
    );
  }

  if (body.contentType !== undefined && !CONTENT_TYPES.has(body.contentType)) {
    return NextResponse.json(
      { error: "Invalid content type." },
      { status: 400 },
    );
  }

  const permissions = await verifyCurrentUserPermissions(teamId);
  const isLeader = canDelegateTeamLeaders(permissions);

  try {
    const node = await updateKnowledgeNode({
      nodeId,
      teamId,
      title: body.title,
      topicCategory: body.topicCategory,
      contentType: body.contentType,
      contentUrl: body.contentUrl,
      content: body.content,
      userId: currentUser.profile.id,
      isLeader,
    });
    return NextResponse.json(node);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update node.";

    if (message === "Node not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "You do not have permission to edit this node.") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;
  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to delete nodes." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  const { nodeId } = await context.params;
  if (!nodeId?.trim()) {
    return NextResponse.json({ error: "Node id is required." }, { status: 400 });
  }

  const permissions = await verifyCurrentUserPermissions(teamId);
  const isLeader = canDelegateTeamLeaders(permissions);

  try {
    await deleteKnowledgeNode(
      nodeId,
      teamId,
      currentUser.profile.id,
      isLeader,
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete node.";

    if (message === "Node not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "You do not have permission to delete this node.") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
