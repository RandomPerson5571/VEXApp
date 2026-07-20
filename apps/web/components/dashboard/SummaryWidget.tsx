"use client";

import { AlertCircle, AlertTriangle, Calendar, Package, Wrench } from "lucide-react";

import { useDashboardSummary } from "@/lib/hooks/use-dashboard-summary";
import { isQueryInitiallyLoading } from "@/lib/hooks/use-query-loading";
import { SummaryStatCardSkeleton } from "./dashboard-skeletons";
import { SummaryStatCard } from "./SummaryStatCard";

export function SummaryStatsGrid() {
  const summaryQuery = useDashboardSummary();
  const { data: stats } = summaryQuery;
  const isInitialLoading = isQueryInitiallyLoading(summaryQuery);

  if (!stats) {
    return (
      <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {isInitialLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <SummaryStatCardSkeleton key={index} />
            ))
          : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
      <SummaryStatCard
        label="Open Tasks"
        value={Math.max(0, stats.incompleteTasks - stats.overdueTasks)}
        subtitle="Due soon or unscheduled"
        icon={Wrench}
      />
      <SummaryStatCard
        label="Next Event"
        value={stats.nextEvent}
        subtitle={stats.nextEventDate}
        icon={Calendar}
      />
      <SummaryStatCard
        label="Inventory"
        value={stats.inventoryItems}
        subtitle={
          stats.inventoryWarning ? (
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 animate-pulse inline" />
              Low stock warning
            </span>
          ) : (
            "Stock looks good"
          )
        }
        icon={Package}
        warning={stats.inventoryWarning}
      />
      <SummaryStatCard
        label="Overdue Tasks"
        value={stats.overdueTasks}
        subtitle={
          stats.overdueTasks > 0 ? "Due date passed" : "Nothing overdue"
        }
        icon={AlertCircle}
        danger={stats.overdueTasks > 0}
      />
    </div>
  );
}
