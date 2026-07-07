"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { queryKeys } from "@/lib/query-client";
import {
  mergeDayPlanInList,
  removeDayPlanFromList,
  removeDayPlanFromListCache,
  upsertDayPlanInList,
} from "@/lib/queries/cache-updates/day-plans";
import {
  clearDayPlanFromApi,
  setDayPlanFromApi,
} from "@/lib/queries/day-plans";
import type { DayPlanType, TeamDayPlan } from "@/lib/types/team";

export function useTeamDayPlanMutations() {
  const team = useTeam();
  const teamId = team?.id;
  const queryClient = useQueryClient();

  const setMutation = useMutation({
    mutationFn: setDayPlanFromApi,
    onMutate: async (variables) => {
      if (!teamId) return {};

      const queryKey = queryKeys.dayPlans.forTeam(teamId);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TeamDayPlan[]>(queryKey);
      const optimistic: TeamDayPlan = {
        id: `optimistic-${variables.date}`,
        date: variables.date,
        type: variables.type,
      };

      queryClient.setQueryData<TeamDayPlan[]>(queryKey, (old) =>
        old ? mergeDayPlanInList(old, optimistic) : [optimistic],
      );

      return { previous, queryKey };
    },
    onSuccess: (plan) => {
      if (teamId) {
        upsertDayPlanInList(queryClient, teamId, plan);
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearDayPlanFromApi,
    onMutate: async (date) => {
      if (!teamId) return {};

      const queryKey = queryKeys.dayPlans.forTeam(teamId);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TeamDayPlan[]>(queryKey);

      queryClient.setQueryData<TeamDayPlan[]>(queryKey, (old) =>
        old ? removeDayPlanFromList(old, date) : old,
      );

      return { previous, queryKey };
    },
    onSuccess: (_data, date) => {
      if (teamId) {
        removeDayPlanFromListCache(queryClient, teamId, date);
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
  });

  return {
    setDayPlan: (date: string, type: DayPlanType) => {
      setMutation.mutate({ date, type });
    },
    clearDayPlan: (date: string) => {
      clearMutation.mutate(date);
    },
    isPending: setMutation.isPending || clearMutation.isPending,
  };
}
