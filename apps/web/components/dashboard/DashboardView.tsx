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
    <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#020617] text-slate-100 font-sans dashboard-scroll">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <DashboardHeader />
        <SummaryStatsGrid />

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr] mb-6">
          <TaskListWidget />
          <InventoryTrackerWidget />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.95fr_1fr]">
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
