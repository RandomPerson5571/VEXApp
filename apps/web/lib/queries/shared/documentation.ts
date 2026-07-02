import { queryOptions } from "@tanstack/react-query";
import type { DocumentationDetail } from "@stlvex/database/types";

import { queryKeys } from "@/lib/query-client";

export function createDocumentationDetailQueryOptions(
  docId: string,
  queryFn: () => Promise<DocumentationDetail>,
) {
  return queryOptions({
    queryKey: queryKeys.docs.detail(docId),
    queryFn,
  });
}
