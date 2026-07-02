import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import type { FolderWithDocs } from "@stlvex/database/types";

/** Replace a folder entry in the documentation tree by id. */
export function applyFolderTreePatch(
  queryClient: QueryClient,
  teamId: string,
  folder: FolderWithDocs,
): void {
  queryClient.setQueryData<FolderWithDocs[]>(
    queryKeys.docs.tree(teamId),
    (old) => {
      if (!old) return old;

      const index = old.findIndex((entry) => entry.id === folder.id);
      if (index === -1) return old;

      const next = [...old];
      next[index] = folder;
      return next;
    },
  );
}
