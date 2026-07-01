import { queryOptions } from "@tanstack/react-query";
import type { FolderWithDocs } from "@stlvex/database/types";

import { queryKeys } from "@/lib/query-client";

export function createTeamDocumentationTreeQueryOptions(
  teamId: string,
  queryFn: () => Promise<FolderWithDocs[]>,
) {
  return queryOptions({
    queryKey: queryKeys.docs.tree(teamId),
    queryFn,
  });
}
