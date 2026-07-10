import type { FolderWithDocs } from "@stlvex/database/types";

import { createTeamDocumentationTreeQueryOptions } from "@/lib/queries/shared/folders";
import { throwIfRateLimited } from "@/lib/queries/api-response";

export type CreateFolderPayload = {
  name: string;
};

export type UpdateFolderPayload = {
  folderId: string;
  name: string;
};

export async function fetchDocumentationTreeFromApi(): Promise<FolderWithDocs[]> {
  const response = await fetch("/api/folders");

  if (!response.ok) {
    throw new Error("Failed to fetch documentation tree.");
  }

  return response.json() as Promise<FolderWithDocs[]>;
}

export async function createFolderFromApi(
  payload: CreateFolderPayload,
): Promise<FolderWithDocs> {
  const response = await fetch("/api/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  throwIfRateLimited(response);

  const body = (await response.json()) as FolderWithDocs | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in body && body.error ? body.error : "Failed to create folder.",
    );
  }

  return body as FolderWithDocs;
}

export async function updateFolderFromApi(
  payload: UpdateFolderPayload,
): Promise<FolderWithDocs> {
  const { folderId, name } = payload;
  const response = await fetch(`/api/folders/${folderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  throwIfRateLimited(response);

  const body = (await response.json()) as FolderWithDocs | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in body && body.error ? body.error : "Failed to update folder.",
    );
  }

  return body as FolderWithDocs;
}

export async function deleteFolderFromApi(folderId: string): Promise<void> {
  const response = await fetch(`/api/folders/${folderId}`, {
    method: "DELETE",
  });

  throwIfRateLimited(response);

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? "Failed to delete folder.");
  }
}

export function teamDocumentationTreeQueryOptions(teamId: string) {
  return createTeamDocumentationTreeQueryOptions(
    teamId,
    fetchDocumentationTreeFromApi,
  );
}
