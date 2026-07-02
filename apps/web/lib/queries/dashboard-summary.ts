import { createDashboardSummaryQueryOptions } from "@/lib/queries/shared/dashboard-summary";
import type { DashboardSummaryStats } from "@/lib/types/team";

export async function fetchDashboardSummaryFromApi(): Promise<DashboardSummaryStats> {
  const response = await fetch("/api/dashboard/summary");

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard summary.");
  }

  return response.json() as Promise<DashboardSummaryStats>;
}

export function dashboardSummaryQueryOptions(teamId: string) {
  return createDashboardSummaryQueryOptions(teamId, fetchDashboardSummaryFromApi);
}
