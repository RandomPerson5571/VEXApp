import "server-only";

import {
  deleteDayPlan,
  listDayPlansForTeam,
  upsertDayPlan,
} from "@/lib/data/day-plans";
import { toPrismaDayPlanType, toTeamDayPlan, toTeamDayPlans } from "@/lib/mappers/day-plans";
import { createTeamDayPlansQueryOptions } from "@/lib/queries/shared/day-plans";
import type { DayPlanType, TeamDayPlan } from "@/lib/types/team";

export async function getTeamDayPlans(teamId: string): Promise<TeamDayPlan[]> {
  const plans = await listDayPlansForTeam(teamId);
  return toTeamDayPlans(plans);
}

export async function setTeamDayPlan(input: {
  teamId: string;
  date: string;
  type: DayPlanType;
  createdBy: string;
}): Promise<TeamDayPlan> {
  const plan = await upsertDayPlan({
    teamId: input.teamId,
    date: input.date,
    type: toPrismaDayPlanType(input.type),
    createdBy: input.createdBy,
  });

  return toTeamDayPlan(plan);
}

export async function clearTeamDayPlan(teamId: string, date: string): Promise<void> {
  await deleteDayPlan(teamId, date);
}

export function teamDayPlansQueryOptions(teamId: string) {
  return createTeamDayPlansQueryOptions(teamId, () => getTeamDayPlans(teamId));
}
