import "server-only";

import {
  createDocumentation,
  deleteDocumentation,
  getDocumentationById,
  updateDocumentation,
  type CreateDocumentationInput,
  type UpdateDocumentationInput,
} from "@/lib/data/documentation";
import { queryKeys } from "@/lib/query-client";
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
  return {
    queryKey: queryKeys.docs.detail(docId),
    queryFn: () => getDocumentationDetail(docId),
  };
}
