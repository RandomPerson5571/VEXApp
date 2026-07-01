"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskListTask } from "@stlvex/database/types";

import { queryKeys } from "@/lib/query-client";
import {
  applyOptimisticTeamTaskUpdate,
  applyTeamTaskPatch,
  prependTeamTask,
} from "@/lib/queries/cache-updates/tasks";
import { invalidateTaskDashboard } from "@/lib/queries/cache-updates/invalidate";
import {
  createTeamTaskFromApi,
  updateTeamTaskFromApi,
} from "@/lib/queries/tasks";

type UseTeamTaskMutationsOptions = {
  onCreateSuccess?: () => void;
};

export function useTeamTaskMutations(
  teamId: string | undefined,
  options?: UseTeamTaskMutationsOptions,
) {
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: createTeamTaskFromApi,
    onSuccess: (task) => {
      if (!teamId) {
        return;
      }

      prependTeamTask(queryClient, teamId, task);
      options?.onCreateSuccess?.();
    },
    onSettled: () => {
      if (teamId) {
        invalidateTaskDashboard(queryClient, teamId);
      }
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: updateTeamTaskFromApi,
    onMutate: async (variables) => {
      if (!teamId) {
        return;
      }

      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks.forTeam(teamId),
      });

      const previous = queryClient.getQueryData<TaskListTask[]>(
        queryKeys.tasks.forTeam(teamId),
      );

      const patch: Partial<Pick<TaskListTask, "title" | "description" | "status">> =
        {};

      if (variables.title !== undefined) {
        patch.title = variables.title;
      }
      if (variables.description !== undefined) {
        patch.description = variables.description;
      }
      if (variables.status !== undefined) {
        patch.status = variables.status;
      }

      applyOptimisticTeamTaskUpdate(
        queryClient,
        teamId,
        variables.taskId,
        patch,
      );

      return { previous };
    },
    onSuccess: (updated) => {
      if (!teamId) {
        return;
      }

      applyTeamTaskPatch(queryClient, teamId, updated);
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

  return { createTaskMutation, updateTaskMutation };
}
