import type { MatchRecord } from "@/lib/types/team";

import { DashboardHeader } from "./Header";
import { MatchPerformanceChartDynamic } from "./MatchPerformanceChartDynamic";
import { SummaryStatsGrid } from "./SummaryWidget";
import { TeamCalendarWidget } from "./CalendarWidget";
import { UpcomingMatchesList } from "./MatchesWidget";
import { InventoryTrackerWidget } from "./InventoryTrackerWidget";
import { TaskListWidget } from "./TaskListWidget";

export interface DashboardViewProps {
  matches: MatchRecord[];
}

export function DashboardView({ matches }: DashboardViewProps) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50 dark:bg-[#03070e] font-sans dashboard-scroll">
      <DashboardHeader />
      <SummaryStatsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-7">
        <TaskListWidget />
        <InventoryTrackerWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <MatchPerformanceChartDynamic matches={matches} />
        <div className="lg:col-span-4 space-y-6">
          <TeamCalendarWidget />
          <UpcomingMatchesList />
        </div>
      </div>
    </div>
  );
}
