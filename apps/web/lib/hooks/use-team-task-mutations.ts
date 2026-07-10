"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TOGGLE_MUTATION_DELAY_MS } from "@/lib/constants/request-timing";
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
import type { TaskListTask, TaskStatus } from "@stlvex/database/types";
import { debounce } from "@/lib/utils/debounce";

type UseTeamTaskMutationsOptions = {
  teamId: string | undefined;
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
};

export function useTeamTaskMutations({
  teamId,
  onCreateSuccess,
  onUpdateSuccess,
}: UseTeamTaskMutationsOptions) {
  const queryClient = useQueryClient();
  const latestStatusByTaskRef = useRef(new Map<string, TaskStatus>());
  const statusRollbackRef = useRef<TaskListTask[] | undefined>(undefined);
  const [statusUpdatingTaskIds, setStatusUpdatingTaskIds] = useState(
    () => new Set<string>(),
  );

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
      if (variables.type !== undefined) patch.type = variables.type;
      if (variables.priority !== undefined) patch.priority = variables.priority;
      if (variables.dueDate !== undefined) {
        patch.dueDate = variables.dueDate
          ? new Date(`${variables.dueDate.trim()}T17:00:00.000Z`)
          : null;
      }

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
      onUpdateSuccess?.();
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

  const statusDebouncersRef = useRef(
    new Map<string, ReturnType<typeof debounce<() => Promise<void>>>>(),
  );

  useEffect(() => {
    const debouncers = statusDebouncersRef.current;
    return () => {
      for (const debounced of debouncers.values()) {
        debounced.cancel();
      }
      debouncers.clear();
    };
  }, []);

  const updateTaskStatus = useCallback(
    (taskId: string, status: TaskStatus) => {
      if (!teamId) {
        return;
      }

      if (statusRollbackRef.current === undefined) {
        statusRollbackRef.current = queryClient.getQueryData<TaskListTask[]>(
          queryKeys.tasks.forTeam(teamId),
        );
      }

      optimisticallyPatchTeamTask(queryClient, teamId, taskId, { status });
      latestStatusByTaskRef.current.set(taskId, status);

      let debounced = statusDebouncersRef.current.get(taskId);

      if (!debounced) {
        debounced = debounce(async () => {
          const latestStatus = latestStatusByTaskRef.current.get(taskId);
          if (!latestStatus) {
            return;
          }

          setStatusUpdatingTaskIds((current) => new Set(current).add(taskId));

          try {
            const updatedTask = await updateTeamTaskFromApi({
              taskId,
              status: latestStatus,
            });

            if (teamId) {
              applyTeamTaskPatch(queryClient, teamId, updatedTask);
              invalidateTaskDashboard(queryClient, teamId);
            }

            statusRollbackRef.current = undefined;
            onUpdateSuccess?.();
          } catch {
            if (teamId && statusRollbackRef.current) {
              queryClient.setQueryData(
                queryKeys.tasks.forTeam(teamId),
                statusRollbackRef.current,
              );
              statusRollbackRef.current = undefined;
            }
          } finally {
            setStatusUpdatingTaskIds((current) => {
              const next = new Set(current);
              next.delete(taskId);
              return next;
            });
          }
        }, TOGGLE_MUTATION_DELAY_MS);

        statusDebouncersRef.current.set(taskId, debounced);
      }

      debounced();
    },
    [onUpdateSuccess, queryClient, teamId],
  );

  const isStatusUpdating = useCallback(
    (taskId: string) => statusUpdatingTaskIds.has(taskId),
    [statusUpdatingTaskIds],
  );

  return {
    createMutation,
    updateMutation,
    updateTaskStatus,
    isStatusUpdating,
  };
}
