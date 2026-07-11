import type { MatchRecord } from "@/lib/types/team";

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
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-6 py-6 font-sans text-slate-900 dashboard-scroll dark:bg-[#020617] dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <SummaryStatsGrid />

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <TaskListWidget />
          <InventoryTrackerWidget />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <MatchPerformanceChartDynamic matches={matches} />
          <div className="space-y-6">
            <TeamCalendarWidget />
            <UpcomingMatchesList />
          </div>
        </div>
      </div>
    </div>
  );
}
