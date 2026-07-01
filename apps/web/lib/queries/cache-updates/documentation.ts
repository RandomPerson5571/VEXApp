import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import type { DocumentationDetail, FolderWithDocs } from "@stlvex/database/types";

/** Replace detail cache with authoritative PATCH response. */
export function applyDocumentationDetailPatch(
  queryClient: QueryClient,
  docId: string,
  doc: DocumentationDetail,
): void {
  queryClient.setQueryData(queryKeys.docs.detail(docId), doc);
}

/** Merge title/type summary fields into the matching doc in the folder tree. */
export function applyDocumentationTreeDocPatch(
  queryClient: QueryClient,
  teamId: string,
  doc: Pick<DocumentationDetail, "id" | "title" | "type" | "folderId">,
): void {
  queryClient.setQueryData<FolderWithDocs[]>(
    queryKeys.docs.tree(teamId),
    (old) => {
      if (!old) return old;

      return old.map((folder) => {
        if (folder.id !== doc.folderId) return folder;

        return {
          ...folder,
          docs: folder.docs.map((summary) =>
            summary.id === doc.id
              ? {
                  ...summary,
                  title: doc.title,
                  type: doc.type,
                }
              : summary,
          ),
        };
      });
    },
  );
}
