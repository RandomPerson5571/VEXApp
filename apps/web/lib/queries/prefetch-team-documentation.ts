import type { QueryClient } from "@tanstack/react-query";

import { teamDocumentationTreeQueryOptions } from "@/lib/queries/folders.server";

export async function prefetchTeamDocumentation(
  queryClient: QueryClient,
  teamId: string,
) {
  await queryClient.prefetchQuery(teamDocumentationTreeQueryOptions(teamId));
}
