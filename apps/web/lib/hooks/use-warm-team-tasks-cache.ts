"use client";

import { useTeamTasks } from "@/lib/hooks/use-team-tasks";

/** Subscribe to full team tasks so /task-list can paint from cache after a dashboard visit. */
export function useWarmTeamTasksCache() {
  useTeamTasks();
}
