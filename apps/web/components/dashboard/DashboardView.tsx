import type {
  Activity,
  BuildStatusComponent,
  CalendarEvent,
  DashboardSummaryStats,
  MatchRecord,
  UpcomingMatch,
} from "@/lib/types/team";
import { BuildStatusCard } from "./BuildStatusWidget";
import { DashboardHeader } from "./Header";
import { MatchPerformanceChart } from "./PerformanceWidget";
import { RecentActivityFeed } from "./RecentActivityWidget";
import { SummaryStatsGrid } from "./SummaryWidget";
import { TeamCalendarWidget } from "./CalendarWidget";
import { UpcomingMatchesList } from "./MatchesWidget";

export interface DashboardViewProps {
  stats: DashboardSummaryStats;
  buildComponents: BuildStatusComponent[];
  activities: Activity[];
  matches: MatchRecord[];
  events: CalendarEvent[];
  upcomingMatches: UpcomingMatch[];
  robotLabel: string;
}

export function DashboardView({
  stats,
  buildComponents,
  activities,
  matches,
  events,
  upcomingMatches,
  robotLabel,
}: DashboardViewProps) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50 dark:bg-[#03070e] font-sans dashboard-scroll">
      <DashboardHeader />
      <SummaryStatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-7">
        <BuildStatusCard components={buildComponents} robotLabel={robotLabel} />
        <RecentActivityFeed activities={activities} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <MatchPerformanceChart matches={matches} />
        <div className="lg:col-span-4 space-y-6">
          <TeamCalendarWidget events={events} />
          <UpcomingMatchesList matches={upcomingMatches} />
        </div>
      </div>
    </div>
  );
}
