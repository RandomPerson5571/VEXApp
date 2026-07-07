import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import type { TeamDayPlan } from "@/lib/types/team";

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
