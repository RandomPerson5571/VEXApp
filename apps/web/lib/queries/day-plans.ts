import { createTeamDayPlansQueryOptions } from "@/lib/queries/shared/day-plans";
import { throwIfRateLimited } from "@/lib/queries/api-response";
import type { DayPlanType, TeamDayPlan } from "@/lib/types/team";

export async function fetchTeamDayPlansFromApi(): Promise<TeamDayPlan[]> {
  const response = await fetch("/api/day-plans");

  if (!response.ok) {
    throw new Error("Failed to fetch team day plans.");
  }

  return response.json() as Promise<TeamDayPlan[]>;
}

export async function setDayPlanFromApi(input: {
  date: string;
  type: DayPlanType;
}): Promise<TeamDayPlan> {
  const response = await fetch("/api/day-plans", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  throwIfRateLimited(response);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to set day plan.");
  }

  return response.json() as Promise<TeamDayPlan>;
}

export async function clearDayPlanFromApi(date: string): Promise<void> {
  const response = await fetch(`/api/day-plans?date=${encodeURIComponent(date)}`, {
    method: "DELETE",
  });

  throwIfRateLimited(response);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to clear day plan.");
  }
}

export function teamDayPlansQueryOptions(teamId: string) {
  return createTeamDayPlansQueryOptions(teamId, fetchTeamDayPlansFromApi);
}
