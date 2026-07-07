import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CalendarView } from "@/components/calendar/CalendarView";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prefetchTeamDayPlans } from "@/lib/queries/prefetch-team-day-plans";
import { prefetchTeamEvents } from "@/lib/queries/prefetch-team-events";
import { createQueryClient } from "@/lib/query-client";
import { getTodayDateStr } from "@/lib/utils/calendar";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const queryClient = createQueryClient();
  const currentUser = await getCurrentUser();

  if (currentUser?.profile.teamId) {
    const teamId = currentUser.profile.teamId;
    await Promise.all([
      prefetchTeamEvents(queryClient, teamId),
      prefetchTeamDayPlans(queryClient, teamId),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarView initialSelectedDate={date ?? getTodayDateStr()} />
    </HydrationBoundary>
  );
}
