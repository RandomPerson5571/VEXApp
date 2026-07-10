import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import type { DayPlanType, TeamDayPlan } from "@/lib/types/team";

/** Pure merge: replace or append a plan keyed by date. */
export function mergeDayPlanInList(
  plans: TeamDayPlan[],
  plan: TeamDayPlan,
): TeamDayPlan[] {
  const index = plans.findIndex((item) => item.date === plan.date);

  if (index === -1) {
    return [...plans, plan];
  }

  return plans.map((item) => (item.date === plan.date ? plan : item));
}

/** Pure merge: remove a plan for the given date. */
export function removeDayPlanFromList(
  plans: TeamDayPlan[],
  date: string,
): TeamDayPlan[] {
  return plans.filter((plan) => plan.date !== date);
}

export function upsertDayPlanInList(
  queryClient: QueryClient,
  teamId: string,
  plan: TeamDayPlan,
): void {
  queryClient.setQueryData<TeamDayPlan[]>(
    queryKeys.dayPlans.forTeam(teamId),
    (old) => (old ? mergeDayPlanInList(old, plan) : [plan]),
  );
}

export function removeDayPlanFromListCache(
  queryClient: QueryClient,
  teamId: string,
  date: string,
): void {
  queryClient.setQueryData<TeamDayPlan[]>(
    queryKeys.dayPlans.forTeam(teamId),
    (old) => (old ? removeDayPlanFromList(old, date) : old),
  );
}

export function optimisticallySetDayPlan(
  queryClient: QueryClient,
  teamId: string,
  date: string,
  type: DayPlanType,
): TeamDayPlan[] | undefined {
  const queryKey = queryKeys.dayPlans.forTeam(teamId);
  const previous = queryClient.getQueryData<TeamDayPlan[]>(queryKey);
  const optimistic: TeamDayPlan = {
    id: `optimistic-${date}`,
    date,
    type,
  };

  queryClient.setQueryData<TeamDayPlan[]>(queryKey, (old) =>
    old ? mergeDayPlanInList(old, optimistic) : [optimistic],
  );

  return previous;
}

export function optimisticallyClearDayPlan(
  queryClient: QueryClient,
  teamId: string,
  date: string,
): TeamDayPlan[] | undefined {
  const queryKey = queryKeys.dayPlans.forTeam(teamId);
  const previous = queryClient.getQueryData<TeamDayPlan[]>(queryKey);

  queryClient.setQueryData<TeamDayPlan[]>(queryKey, (old) =>
    old ? removeDayPlanFromList(old, date) : old,
  );

  return previous;
}
