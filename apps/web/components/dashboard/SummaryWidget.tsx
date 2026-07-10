"use client";

import { AlertTriangle, Award, Calendar, Package, Wrench } from "lucide-react";

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
        label="Incomplete Tasks"
        value={stats.incompleteTasks}
        subtitle={`${stats.completedTasks} completed`}
        icon={Wrench}
        iconTone="orange"
      />
      <SummaryStatCard
        label="Next Event"
        value={stats.nextEvent}
        subtitle={stats.nextEventDate}
        icon={Calendar}
        iconTone="indigo"
      />
      <SummaryStatCard
        label="Inventory Items"
        value={stats.inventoryItems}
        subtitle={
          stats.inventoryWarning ? (
            <span className="flex items-center gap-1 text-yellow-300">
              <AlertTriangle className="h-3 w-3 animate-pulse inline" />
              Low stock warning activated
            </span>
          ) : (
            "Stock levels nominal"
          )
        }
        icon={Package}
        iconTone="yellow"
        warning={stats.inventoryWarning}
      />
      <SummaryStatCard
        label="Team Rank"
        value={stats.teamRank}
        delta={stats.teamRankDelta}
        deltaTone="green"
        subtitle={stats.teamRankContext}
        icon={Award}
        iconTone="green"
      />
    </div>
  );
}
