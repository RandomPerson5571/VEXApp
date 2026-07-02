import type { TaskListAssignee } from "@stlvex/database/types";

import { createTeamMembersQueryOptions } from "@/lib/queries/shared/team-members";

export async function fetchTeamMembersFromApi(): Promise<TaskListAssignee[]> {
  const response = await fetch("/api/team-members");

  if (!response.ok) {
    throw new Error("Failed to fetch team members.");
  }

  return response.json() as Promise<TaskListAssignee[]>;
}

export function teamMembersQueryOptions(teamId: string) {
  return createTeamMembersQueryOptions(teamId, fetchTeamMembersFromApi);
}
