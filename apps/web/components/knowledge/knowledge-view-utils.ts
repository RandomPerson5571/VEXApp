import type { ContentType, TopicCategory } from "@stlvex/database/types";

import type { KnowledgeNodeRecord } from "@/lib/queries/knowledge";

export const TOPIC_OPTIONS: TopicCategory[] = [
  "PROGRAMMING",
  "CAD",
  "HARDWARE",
  "GENERAL",
];

export const CONTENT_OPTIONS: ContentType[] = ["MARKDOWN", "LINK", "SLIDESHOW"];

export { DEFAULT_EDGE_RELATIONSHIP } from "@/lib/knowledge/constants";

export const TOPIC_COLORS: Record<TopicCategory, string> = {
  PROGRAMMING: "#38bdf8",
  CAD: "#a78bfa",
  HARDWARE: "#fb923c",
  GENERAL: "#94a3b8",
};

export type GraphNode = {
  id: string;
  name: string;
  topicCategory: TopicCategory;
  contentType: ContentType;
};

export type GraphLink = {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
};

export type SidebarMode = "browse" | "create";

export function formatEnumLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function linkEndpointId(endpoint: unknown): string {
  if (typeof endpoint === "string") return endpoint;
  if (
    endpoint &&
    typeof endpoint === "object" &&
    "id" in endpoint &&
    typeof (endpoint as { id: unknown }).id === "string"
  ) {
    return (endpoint as { id: string }).id;
  }
  return String(endpoint);
}

export function neighborIdsFor(
  nodeId: string,
  edges: { sourceId: string; targetId: string }[],
): Set<string> {
  const ids = new Set<string>([nodeId]);
  for (const edge of edges) {
    if (edge.sourceId === nodeId) ids.add(edge.targetId);
    if (edge.targetId === nodeId) ids.add(edge.sourceId);
  }
  return ids;
}

export function nodeEdgesFor<
  T extends { id: string; sourceId: string; targetId: string },
>(nodeId: string, edges: T[]): T[] {
  return edges.filter(
    (edge) => edge.sourceId === nodeId || edge.targetId === nodeId,
  );
}

export function toGraphData(
  nodes: KnowledgeNodeRecord[],
  edges: { id: string; sourceId: string; targetId: string; relationshipType: string }[],
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodeIds = new Set(nodes.map((node) => node.id));
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      name: node.title,
      topicCategory: node.topicCategory,
      contentType: node.contentType,
    })),
    // Drop links whose endpoints are gone (e.g. node deleted before edges refetch)
    links: edges
      .filter(
        (edge) => nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId),
      )
      .map((edge) => ({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        relationshipType: edge.relationshipType,
      })),
  };
}

export const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-[#121212] dark:text-slate-100";

export const panelClassName =
  "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0a0a0a]";
