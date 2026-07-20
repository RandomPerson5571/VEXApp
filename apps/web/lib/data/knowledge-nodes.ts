import "server-only";

import { Prisma, prisma } from "@stlvex/database";
import {
  knowledgeNodeInclude,
  type ContentType,
  type KnowledgeNodeDetail,
  type TopicCategory,
} from "@stlvex/database/types";

import {
  buildEmbeddingInput,
  createEmbedding,
  toVectorLiteral,
} from "@/lib/knowledge/embeddings";

export type CreateKnowledgeNodeInput = {
  teamId: string;
  title: string;
  topicCategory: TopicCategory;
  contentType: ContentType;
  contentUrl?: string | null;
  content?: string | null;
  createdById: string;
};

export type UpdateKnowledgeNodeInput = {
  nodeId: string;
  teamId: string;
  title?: string;
  topicCategory?: TopicCategory;
  contentType?: ContentType;
  contentUrl?: string | null;
  content?: string | null;
  userId: string;
  isLeader: boolean;
};

/** Omit Unsupported embedding from Prisma selects. */
const nodeSelectWithoutEmbedding = {
  id: true,
  teamId: true,
  title: true,
  topicCategory: true,
  contentType: true,
  contentUrl: true,
  content: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: knowledgeNodeInclude.createdBy,
} satisfies Prisma.KnowledgeNodeSelect;

export type KnowledgeNodeRecord = Prisma.KnowledgeNodeGetPayload<{
  select: typeof nodeSelectWithoutEmbedding;
}>;

async function setNodeEmbedding(
  nodeId: string,
  embedding: number[],
): Promise<void> {
  const vector = toVectorLiteral(embedding);
  // ponytail: raw cast — Prisma can't bind Unsupported vector columns
  await prisma.$executeRawUnsafe(
    `UPDATE "KnowledgeNode" SET embedding = $1::vector WHERE id = $2`,
    vector,
    nodeId,
  );
}

async function embedAndStore(node: {
  id: string;
  title: string;
  contentType: ContentType;
  content?: string | null;
  contentUrl?: string | null;
}): Promise<void> {
  const text = buildEmbeddingInput(node);
  const embedding = await createEmbedding(text);
  await setNodeEmbedding(node.id, embedding);
}

export async function listKnowledgeNodes(
  teamId: string,
): Promise<KnowledgeNodeRecord[]> {
  return prisma.knowledgeNode.findMany({
    where: { teamId },
    select: nodeSelectWithoutEmbedding,
    orderBy: { createdAt: "asc" },
  });
}

export async function getKnowledgeNodeById(
  nodeId: string,
): Promise<KnowledgeNodeRecord | null> {
  return prisma.knowledgeNode.findUnique({
    where: { id: nodeId },
    select: nodeSelectWithoutEmbedding,
  });
}

export async function createKnowledgeNode(
  input: CreateKnowledgeNodeInput,
): Promise<KnowledgeNodeRecord> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Title is required.");
  }

  const contentUrl = input.contentUrl?.trim() || null;
  const content = input.content?.trim() || null;

  if (
    (input.contentType === "LINK" || input.contentType === "SLIDESHOW") &&
    !contentUrl
  ) {
    throw new Error("Content URL is required for link and slideshow nodes.");
  }

  const node = await prisma.knowledgeNode.create({
    data: {
      teamId: input.teamId,
      title,
      topicCategory: input.topicCategory,
      contentType: input.contentType,
      contentUrl,
      content,
      createdById: input.createdById,
    },
    select: nodeSelectWithoutEmbedding,
  });

  try {
    await embedAndStore(node);
  } catch (error) {
    // Node is usable without embedding; search will skip until re-embed.
    console.error("Failed to embed knowledge node:", error);
  }

  return node;
}

export async function updateKnowledgeNode(
  input: UpdateKnowledgeNodeInput,
): Promise<KnowledgeNodeRecord> {
  const existing = await prisma.knowledgeNode.findUnique({
    where: { id: input.nodeId },
    select: {
      id: true,
      teamId: true,
      title: true,
      topicCategory: true,
      contentType: true,
      contentUrl: true,
      content: true,
      createdById: true,
    },
  });

  if (!existing || existing.teamId !== input.teamId) {
    throw new Error("Node not found.");
  }

  if (existing.createdById !== input.userId && !input.isLeader) {
    throw new Error("You do not have permission to edit this node.");
  }

  const title =
    input.title !== undefined ? input.title.trim() : existing.title;
  if (!title) {
    throw new Error("Title is required.");
  }

  const topicCategory = input.topicCategory ?? existing.topicCategory;
  const contentType = input.contentType ?? existing.contentType;
  const contentUrl =
    input.contentUrl !== undefined
      ? input.contentUrl?.trim() || null
      : existing.contentUrl;
  const content =
    input.content !== undefined
      ? input.content?.trim() || null
      : existing.content;

  if (
    (contentType === "LINK" || contentType === "SLIDESHOW") &&
    !contentUrl
  ) {
    throw new Error("Content URL is required for link and slideshow nodes.");
  }

  const node = await prisma.knowledgeNode.update({
    where: { id: input.nodeId },
    data: {
      title,
      topicCategory,
      contentType,
      contentUrl,
      content,
    },
    select: nodeSelectWithoutEmbedding,
  });

  const textChanged =
    title !== existing.title ||
    contentType !== existing.contentType ||
    contentUrl !== existing.contentUrl ||
    content !== existing.content;

  if (textChanged) {
    try {
      await embedAndStore(node);
    } catch (error) {
      console.error("Failed to re-embed knowledge node:", error);
    }
  }

  return node;
}

export async function deleteKnowledgeNode(
  nodeId: string,
  teamId: string,
  userId: string,
  isLeader: boolean,
): Promise<void> {
  const existing = await prisma.knowledgeNode.findUnique({
    where: { id: nodeId },
    select: { id: true, teamId: true, createdById: true },
  });

  if (!existing || existing.teamId !== teamId) {
    throw new Error("Node not found.");
  }

  if (existing.createdById !== userId && !isLeader) {
    throw new Error("You do not have permission to delete this node.");
  }

  await prisma.knowledgeNode.delete({ where: { id: nodeId } });
}

// Keep type alias available for callers expecting Detail shape
export type { KnowledgeNodeDetail };
