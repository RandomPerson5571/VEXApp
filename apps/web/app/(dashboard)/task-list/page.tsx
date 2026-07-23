import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { TaskListView } from "@/components/tasks/TaskListView";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prefetchTeamMembers } from "@/lib/queries/prefetch-team-members";
import { prefetchTeamTasks } from "@/lib/queries/prefetch-team-tasks";
import { createQueryClient } from "@/lib/query-client";

export default async function TaskListPage() {
  const currentUser = await getCurrentUser();
  const teamId = currentUser?.profile.teamId;

  const queryClient = createQueryClient();

  if (teamId) {
    await Promise.all([
      prefetchTeamTasks(queryClient, teamId),
      prefetchTeamMembers(queryClient, teamId),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TaskListView />
    </HydrationBoundary>
  );
}
