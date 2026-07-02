import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";

export function invalidateTaskDashboard(
  queryClient: QueryClient,
  teamId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.summary(teamId),
  });
  void queryClient.invalidateQueries({
    queryKey: ["dashboard", "tasks", teamId],
  });
}

export function invalidateDocsTree(
  queryClient: QueryClient,
  teamId: string,
  docId?: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.docs.tree(teamId),
  });

  if (docId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.docs.detail(docId),
    });
  }
}
