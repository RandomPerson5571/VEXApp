import "server-only";

import { prisma } from "@stlvex/database";
import type { ContentType, TopicCategory } from "@stlvex/database/types";

import { createEmbedding, toVectorLiteral } from "@/lib/knowledge/embeddings";

export type KnowledgeSearchHit = {
  id: string;
  title: string;
  topicCategory: TopicCategory;
  contentType: ContentType;
  similarity: number;
};

export async function searchKnowledgeNodes(
  teamId: string,
  query: string,
  limit = 10,
): Promise<KnowledgeSearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Search query is required.");
  }

  const matchCount = Math.min(Math.max(limit, 1), 50);
  const embedding = await createEmbedding(trimmed);
  const vector = toVectorLiteral(embedding);

  // ponytail: raw cast — Prisma can't bind Unsupported vector columns
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      title: string;
      topicCategory: TopicCategory;
      contentType: ContentType;
      similarity: number;
    }>
  >(
    `
    SELECT
      id,
      title,
      "topicCategory",
      "contentType",
      (1 - (embedding <=> $1::vector))::float8 AS similarity
    FROM "KnowledgeNode"
    WHERE "teamId" = $2
      AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $3
    `,
    vector,
    teamId,
    matchCount,
  );

  return rows.map((row) => ({
    ...row,
    similarity: Number(row.similarity),
  }));
}
