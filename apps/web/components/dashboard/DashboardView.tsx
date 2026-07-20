"use client";

import dynamic from "next/dynamic";

import { SummaryStatsGrid } from "./SummaryWidget";
import { TeamCalendarWidget } from "./CalendarWidget";
import { UpcomingMatchesList } from "./MatchesWidget";
import { TaskListWidget } from "./TaskListWidget";
import { DashboardRowSkeleton } from "./dashboard-skeletons";

const InventoryTrackerWidget = dynamic(
  () =>
    import("./InventoryTrackerWidget").then((m) => m.InventoryTrackerWidget),
  {
    loading: () => (
      <div className="rounded-[32px] border border-slate-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-6">
        <DashboardRowSkeleton className="h-[320px]" />
      </div>
    ),
  },
);

export function DashboardView() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-6 py-6 font-sans text-slate-900 dashboard-scroll dark:bg-[#000000] dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Team Dashboard
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            See what needs doing today — tasks, today&apos;s focus, and upcoming
            events.
          </p>
        </header>

        <SummaryStatsGrid />

        <div className="grid gap-6 lg:grid-cols-2">
          <TaskListWidget />
          <div className="space-y-6">
            <TeamCalendarWidget />
            <UpcomingMatchesList />
          </div>
        </div>

        <InventoryTrackerWidget />
      </div>
    </div>
  );
}
