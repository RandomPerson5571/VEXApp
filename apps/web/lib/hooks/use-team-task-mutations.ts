"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import {
  applyTeamTaskPatch,
  optimisticallyPatchTeamTask,
  prependTeamTask,
} from "@/lib/queries/cache-updates/tasks";
import { invalidateTaskDashboard } from "@/lib/queries/cache-updates/invalidate";
import {
  createTeamTaskFromApi,
  updateTeamTaskFromApi,
} from "@/lib/queries/tasks";
import type { TaskListTask } from "@stlvex/database/types";

type UseTeamTaskMutationsOptions = {
  teamId: string | undefined;
  onCreateSuccess?: () => void;
};

export function useTeamTaskMutations({
  teamId,
  onCreateSuccess,
}: UseTeamTaskMutationsOptions) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTeamTaskFromApi,
    onSuccess: (newTask) => {
      if (teamId) {
        prependTeamTask(queryClient, teamId, newTask);
      }
      onCreateSuccess?.();
    },
    onSettled: () => {
      if (teamId) {
        invalidateTaskDashboard(queryClient, teamId);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTeamTaskFromApi,
    onMutate: async (variables) => {
      if (!teamId) return {};

      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks.forTeam(teamId),
      });

      const previous = queryClient.getQueryData<TaskListTask[]>(
        queryKeys.tasks.forTeam(teamId),
      );

      const patch: Parameters<typeof optimisticallyPatchTeamTask>[3] = {};
      if (variables.title !== undefined) patch.title = variables.title;
      if (variables.description !== undefined) {
        patch.description = variables.description;
      }
      if (variables.status !== undefined) patch.status = variables.status;

      optimisticallyPatchTeamTask(
        queryClient,
        teamId,
        variables.taskId,
        patch,
      );

      return { previous };
    },
    onSuccess: (updatedTask) => {
      if (teamId) {
        applyTeamTaskPatch(queryClient, teamId, updatedTask);
      }
    },
    onError: (_error, _variables, context) => {
      if (teamId && context?.previous) {
        queryClient.setQueryData(
          queryKeys.tasks.forTeam(teamId),
          context.previous,
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      if (teamId && variables.status !== undefined) {
        invalidateTaskDashboard(queryClient, teamId);
      }
    },
  });

  return { createMutation, updateMutation };
}
