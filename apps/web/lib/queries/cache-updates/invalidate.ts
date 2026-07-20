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

export function invalidateKnowledgeGraph(
  queryClient: QueryClient,
  teamId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.knowledge.nodes(teamId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.knowledge.edges(teamId),
  });
}
