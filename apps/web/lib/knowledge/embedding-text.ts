import type { ContentType } from "@stlvex/database/types";

export function buildEmbeddingInput(input: {
  title: string;
  contentType: ContentType;
  content?: string | null;
  contentUrl?: string | null;
}): string {
  const parts = [`# ${input.title.trim()}`];

  if (input.contentType === "MARKDOWN" && input.content?.trim()) {
    parts.push(input.content.trim());
  } else if (input.contentUrl?.trim()) {
    parts.push(input.contentUrl.trim());
  } else if (input.content?.trim()) {
    parts.push(input.content.trim());
  }

  return parts.join("\n\n");
}

/** Format a JS number array as a pgvector literal. */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
