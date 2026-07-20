import "server-only";

import { prisma } from "@stlvex/database";
import {
  knowledgeEdgeInclude,
  type KnowledgeEdgeDetail,
} from "@stlvex/database/types";

export type CreateKnowledgeEdgeInput = {
  teamId: string;
  sourceId: string;
  targetId: string;
  relationshipType: string;
};

export async function listKnowledgeEdges(
  teamId: string,
): Promise<KnowledgeEdgeDetail[]> {
  return prisma.knowledgeEdge.findMany({
    where: {
      source: { teamId },
      target: { teamId },
    },
    include: knowledgeEdgeInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function createKnowledgeEdge(
  input: CreateKnowledgeEdgeInput,
): Promise<KnowledgeEdgeDetail> {
  const relationshipType = input.relationshipType.trim();
  if (!relationshipType) {
    throw new Error("Relationship type is required.");
  }

  if (input.sourceId === input.targetId) {
    throw new Error("Source and target must be different nodes.");
  }

  const [source, target] = await Promise.all([
    prisma.knowledgeNode.findUnique({
      where: { id: input.sourceId },
      select: { id: true, teamId: true },
    }),
    prisma.knowledgeNode.findUnique({
      where: { id: input.targetId },
      select: { id: true, teamId: true },
    }),
  ]);

  if (!source || source.teamId !== input.teamId) {
    throw new Error("Source node not found.");
  }

  if (!target || target.teamId !== input.teamId) {
    throw new Error("Target node not found.");
  }

  try {
    return await prisma.knowledgeEdge.create({
      data: {
        sourceId: input.sourceId,
        targetId: input.targetId,
        relationshipType,
      },
      include: knowledgeEdgeInclude,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      throw new Error("This edge already exists.");
    }
    throw error;
  }
}

export async function deleteKnowledgeEdge(
  edgeId: string,
  teamId: string,
): Promise<void> {
  const existing = await prisma.knowledgeEdge.findUnique({
    where: { id: edgeId },
    include: {
      source: { select: { teamId: true } },
    },
  });

  if (!existing || existing.source.teamId !== teamId) {
    throw new Error("Edge not found.");
  }

  await prisma.knowledgeEdge.delete({ where: { id: edgeId } });
}
