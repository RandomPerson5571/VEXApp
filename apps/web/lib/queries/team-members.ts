import { queryKeys } from "@/lib/query-client";
import type { TaskListAssignee } from "@stlvex/database/types";

export async function fetchTeamMembersFromApi(): Promise<TaskListAssignee[]> {
  const response = await fetch("/api/team-members");

  if (!response.ok) {
    throw new Error("Failed to fetch team members.");
  }

  return response.json() as Promise<TaskListAssignee[]>;
}

export function teamMembersQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.teams.members(teamId),
    queryFn: fetchTeamMembersFromApi,
  };
}
