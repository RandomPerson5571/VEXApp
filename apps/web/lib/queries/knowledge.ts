import type { ContentType, TopicCategory } from "@stlvex/database/types";

import { throwIfRateLimited } from "@/lib/queries/api-response";
import { queryKeys } from "@/lib/query-client";

export type KnowledgeNodeRecord = {
  id: string;
  teamId: string;
  title: string;
  topicCategory: TopicCategory;
  contentType: ContentType;
  contentUrl: string | null;
  content: string | null;
  createdById: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: { id: string; firstName: string; lastName: string };
};

export type KnowledgeEdgeRecord = {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: string;
  createdAt: string;
  source: { id: string; title: string; teamId: string };
  target: { id: string; title: string; teamId: string };
};

export type CreateNodePayload = {
  title: string;
  topicCategory: TopicCategory;
  contentType: ContentType;
  contentUrl?: string | null;
  content?: string | null;
};

export type CreateEdgePayload = {
  sourceId: string;
  targetId: string;
  relationshipType: string;
};

export type KnowledgeSearchHit = {
  id: string;
  title: string;
  topicCategory: TopicCategory;
  contentType: ContentType;
  similarity: number;
};

async function readError(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? fallback;
}

export async function fetchKnowledgeNodes(): Promise<KnowledgeNodeRecord[]> {
  const response = await fetch("/api/knowledge/nodes");
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to fetch knowledge nodes."));
  }
  return response.json() as Promise<KnowledgeNodeRecord[]>;
}

export async function fetchKnowledgeEdges(): Promise<KnowledgeEdgeRecord[]> {
  const response = await fetch("/api/knowledge/edges");
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to fetch knowledge edges."));
  }
  return response.json() as Promise<KnowledgeEdgeRecord[]>;
}

export async function createKnowledgeNodeFromApi(
  payload: CreateNodePayload,
): Promise<KnowledgeNodeRecord> {
  const response = await fetch("/api/knowledge/nodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  throwIfRateLimited(response);
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to create node."));
  }
  return response.json() as Promise<KnowledgeNodeRecord>;
}

export async function createKnowledgeEdgeFromApi(
  payload: CreateEdgePayload,
): Promise<KnowledgeEdgeRecord> {
  const response = await fetch("/api/knowledge/edges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  throwIfRateLimited(response);
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to create edge."));
  }
  return response.json() as Promise<KnowledgeEdgeRecord>;
}

export async function deleteKnowledgeNodeFromApi(nodeId: string): Promise<void> {
  const response = await fetch(`/api/knowledge/nodes/${nodeId}`, {
    method: "DELETE",
  });
  throwIfRateLimited(response);
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to delete node."));
  }
}

export async function deleteKnowledgeEdgeFromApi(edgeId: string): Promise<void> {
  const response = await fetch(`/api/knowledge/edges/${edgeId}`, {
    method: "DELETE",
  });
  throwIfRateLimited(response);
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to delete edge."));
  }
}

export async function searchKnowledgeFromApi(
  query: string,
  limit = 10,
): Promise<KnowledgeSearchHit[]> {
  const response = await fetch("/api/knowledge/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });
  throwIfRateLimited(response);
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to search knowledge."));
  }
  return response.json() as Promise<KnowledgeSearchHit[]>;
}

export function knowledgeNodesQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.knowledge.nodes(teamId),
    queryFn: fetchKnowledgeNodes,
    enabled: Boolean(teamId),
  };
}

export function knowledgeEdgesQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.knowledge.edges(teamId),
    queryFn: fetchKnowledgeEdges,
    enabled: Boolean(teamId),
  };
}
