import { queryKeys } from "@/lib/query-client";
import type { DocType, DocumentationDetail } from "@stlvex/database/types";

export const DEFAULT_DOCUMENTATION_TEMPLATE = `## Introduction

## Design Constraints
-

## Concept Sketches

## Prototypes

## Testing Results

## Conclusion

## Next Steps
`;

export type CreateDocumentationPayload = {
  title: string;
  type: DocType;
  content: string;
  folderId: string;
};

export type UpdateDocumentationPayload = {
  docId: string;
  title?: string;
  type?: DocType;
  content?: string;
};

export async function fetchDocumentationDetailFromApi(
  docId: string,
): Promise<DocumentationDetail> {
  const response = await fetch(`/api/documents/${docId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch document.");
  }

  return response.json() as Promise<DocumentationDetail>;
}

export async function createDocumentationFromApi(
  payload: CreateDocumentationPayload,
): Promise<DocumentationDetail> {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as DocumentationDetail | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in body && body.error ? body.error : "Failed to create document.",
    );
  }

  return body as DocumentationDetail;
}

export async function updateDocumentationFromApi(
  payload: UpdateDocumentationPayload,
): Promise<DocumentationDetail> {
  const { docId, ...body } = payload;
  const response = await fetch(`/api/documents/${docId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const responseBody = (await response.json()) as
    | DocumentationDetail
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in responseBody && responseBody.error
        ? responseBody.error
        : "Failed to update document.",
    );
  }

  return responseBody as DocumentationDetail;
}

export async function deleteDocumentationFromApi(docId: string): Promise<void> {
  const response = await fetch(`/api/documents/${docId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? "Failed to delete document.");
  }
}

export function documentationDetailQueryOptions(docId: string) {
  return {
    queryKey: queryKeys.docs.detail(docId),
    queryFn: () => fetchDocumentationDetailFromApi(docId),
  };
}
