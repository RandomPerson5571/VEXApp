import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { getCurrentUser } from "@/lib/auth/current-user";
import { mockMatches } from "@/lib/mock/dashboard";
import { prefetchDashboard } from "@/lib/queries/prefetch-dashboard";
import { createQueryClient } from "@/lib/query-client";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  const queryClient = createQueryClient();
  const teamId = currentUser?.profile.teamId;

  if (teamId) {
    await prefetchDashboard(queryClient, teamId);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView matches={mockMatches} />
    </HydrationBoundary>
  );
}
