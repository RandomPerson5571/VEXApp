"use client";

import { AlertTriangle, Award, Calendar, Package, Wrench } from "lucide-react";

import { useDashboardSummary } from "@/lib/hooks/use-dashboard-summary";
import { SummaryStatCard } from "./Header";

export function SummaryStatsGrid() {
  const { data: stats, isLoading } = useDashboardSummary();

  if (!stats) {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-7 transition-opacity ${isLoading ? "opacity-50" : "opacity-100"}`}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-7">
      <SummaryStatCard
        label="Incomplete Tasks"
        value={stats.incompleteTasks}
        subtitle={`${stats.completedTasks} completed`}
        icon={Wrench}
        iconTone="blue"
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
            <span className="flex items-center gap-1">
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
