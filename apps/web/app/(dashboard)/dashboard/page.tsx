import { DashboardView } from "@/components/dashboard/DashboardView";
import {
  mockActivities,
  mockBuildComponents,
  mockEvents,
  mockMatches,
  mockRobotLabel,
  mockSummaryStats,
  mockUpcomingMatches,
} from "@/lib/mock/dashboard";

export default function DashboardPage() {
  return (
    <DashboardView
      stats={mockSummaryStats}
      buildComponents={mockBuildComponents}
      activities={mockActivities}
      matches={mockMatches}
      events={mockEvents}
      upcomingMatches={mockUpcomingMatches}
      robotLabel={mockRobotLabel}
    />
  );
}
