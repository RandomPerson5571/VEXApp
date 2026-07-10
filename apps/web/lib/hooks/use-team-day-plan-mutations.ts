"use client";

import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { TOGGLE_MUTATION_DELAY_MS } from "@/lib/constants/request-timing";
import { useDebouncedMutation } from "@/lib/hooks/use-debounced-mutation";
import { queryKeys } from "@/lib/query-client";
import {
  optimisticallyClearDayPlan,
  optimisticallySetDayPlan,
  removeDayPlanFromListCache,
  upsertDayPlanInList,
} from "@/lib/queries/cache-updates/day-plans";
import {
  clearDayPlanFromApi,
  setDayPlanFromApi,
} from "@/lib/queries/day-plans";
import type { DayPlanType, TeamDayPlan } from "@/lib/types/team";

type DayPlanMutationInput =
  | { action: "set"; date: string; type: DayPlanType }
  | { action: "clear"; date: string };

export function useTeamDayPlanMutations() {
  const team = useTeam();
  const teamId = team?.id;
  const queryClient = useQueryClient();
  const rollbackSnapshotRef = useRef<TeamDayPlan[] | undefined>(undefined);

  const captureRollbackSnapshot = useCallback(() => {
    if (!teamId || rollbackSnapshotRef.current !== undefined) {
      return;
    }

    rollbackSnapshotRef.current = queryClient.getQueryData<TeamDayPlan[]>(
      queryKeys.dayPlans.forTeam(teamId),
    );
  }, [queryClient, teamId]);

  const clearRollbackSnapshot = useCallback(() => {
    rollbackSnapshotRef.current = undefined;
  }, []);

  const applyOptimistic = useCallback(
    (input: DayPlanMutationInput) => {
      if (!teamId) {
        return;
      }

      captureRollbackSnapshot();

      if (input.action === "set") {
        optimisticallySetDayPlan(queryClient, teamId, input.date, input.type);
        return;
      }

      optimisticallyClearDayPlan(queryClient, teamId, input.date);
    },
    [captureRollbackSnapshot, queryClient, teamId],
  );

  const { mutate, isPending, flush, cancel } =
    useDebouncedMutation<DayPlanMutationInput>({
      delayMs: TOGGLE_MUTATION_DELAY_MS,
      applyOptimistic,
      mutateFn: async (input) => {
        if (input.action === "set") {
          const plan = await setDayPlanFromApi({
            date: input.date,
            type: input.type,
          });

          if (teamId) {
            upsertDayPlanInList(queryClient, teamId, plan);
          }
        } else {
          await clearDayPlanFromApi(input.date);

          if (teamId) {
            removeDayPlanFromListCache(queryClient, teamId, input.date);
          }
        }

        clearRollbackSnapshot();
      },
      onError: () => {
        if (!teamId || rollbackSnapshotRef.current === undefined) {
          return;
        }

        queryClient.setQueryData(
          queryKeys.dayPlans.forTeam(teamId),
          rollbackSnapshotRef.current,
        );
        clearRollbackSnapshot();
      },
    });

  const setDayPlan = useCallback(
    (date: string, type: DayPlanType) => {
      mutate({ action: "set", date, type });
    },
    [mutate],
  );

  const clearDayPlan = useCallback(
    (date: string) => {
      mutate({ action: "clear", date });
    },
    [mutate],
  );

  return {
    setDayPlan,
    clearDayPlan,
    isPending,
    flush,
    cancel,
  };
}
