import "server-only";

import {
  createDocumentation,
  deleteDocumentation,
  getDocumentationById,
  updateDocumentation,
  type CreateDocumentationInput,
  type UpdateDocumentationInput,
} from "@/lib/data/documentation";
import { createDocumentationDetailQueryOptions } from "@/lib/queries/shared/documentation";
import type { DocumentationDetail } from "@stlvex/database/types";

export async function getDocumentationDetail(
  docId: string,
): Promise<DocumentationDetail | null> {
  return getDocumentationById(docId);
}

export async function createTeamDocumentation(
  input: CreateDocumentationInput,
): Promise<DocumentationDetail> {
  return createDocumentation(input);
}

export async function updateTeamDocumentation(
  input: UpdateDocumentationInput,
): Promise<DocumentationDetail> {
  return updateDocumentation(input);
}

export async function deleteTeamDocumentation(docId: string): Promise<void> {
  return deleteDocumentation(docId);
}

export function documentationDetailQueryOptions(docId: string) {
  return createDocumentationDetailQueryOptions(docId, async () => {
    const detail = await getDocumentationDetail(docId);

    if (!detail) {
      throw new Error("Document not found.");
    }

    return detail;
  });
}
