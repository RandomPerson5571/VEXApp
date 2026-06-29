import "server-only";

import {
  createFolder,
  deleteFolder,
  listFoldersWithDocs,
  updateFolder,
  type CreateFolderInput,
  type UpdateFolderInput,
} from "@/lib/data/folders";
import { queryKeys } from "@/lib/query-client";
import type { FolderWithDocs } from "@stlvex/database/types";

export async function getTeamDocumentationTree(
  teamId: string,
): Promise<FolderWithDocs[]> {
  return listFoldersWithDocs(teamId);
}

export async function createTeamFolder(
  input: CreateFolderInput,
): Promise<FolderWithDocs> {
  return createFolder(input);
}

export async function updateTeamFolder(
  input: UpdateFolderInput,
): Promise<FolderWithDocs> {
  return updateFolder(input);
}

export async function deleteTeamFolder(folderId: string): Promise<void> {
  return deleteFolder(folderId);
}

export function teamDocumentationTreeQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.docs.tree(teamId),
    queryFn: () => getTeamDocumentationTree(teamId),
  };
}
