import "server-only";

import OpenAI from "openai";

export {
  buildEmbeddingInput,
  toVectorLiteral,
} from "@/lib/knowledge/embedding-text";

const EMBEDDING_MODEL = "text-embedding-3-small";

let client: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export async function createEmbedding(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Cannot embed empty text.");
  }

  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
  });

  const embedding = response.data[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new Error("Failed to generate embedding.");
  }

  return embedding;
}
