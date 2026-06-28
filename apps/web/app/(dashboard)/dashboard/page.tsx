import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  mockActivities,
  mockBuildComponents,
  mockMatches,
  mockRobotLabel,
  mockSummaryStats,
} from "@/lib/mock/dashboard";
import { prefetchTeamEvents } from "@/lib/queries/prefetch-team-events";
import { createQueryClient } from "@/lib/query-client";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  const queryClient = createQueryClient();
  const teamId = currentUser?.profile.teamId;

  if (teamId) {
    await prefetchTeamEvents(queryClient, teamId);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView
        stats={mockSummaryStats}
        buildComponents={mockBuildComponents}
        activities={mockActivities}
        matches={mockMatches}
        robotLabel={mockRobotLabel}
      />
    </HydrationBoundary>
  );
}
