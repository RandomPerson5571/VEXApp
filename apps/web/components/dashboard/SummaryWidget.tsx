import { AlertTriangle, Award, Package, Search, TrendingUp, Wrench } from "lucide-react";
import type { DashboardSummaryStats } from "@/lib/types/team";
import { SummaryStatCard } from "./Header";

export function SummaryStatsGrid({ stats }: { stats: DashboardSummaryStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-7">
      <SummaryStatCard
        label="Build Progress"
        value={`${stats.buildProgress}%`}
        delta={stats.buildProgressDelta}
        deltaTone="blue"
        subtitle="Upcoming trends higher"
        icon={Wrench}
        iconTone="blue"
      />
      <SummaryStatCard
        label="Matches Scouted"
        value={stats.matchesScouted}
        delta={stats.matchesScoutedDelta}
        deltaTone="green"
        subtitle="Since last regional"
        icon={Search}
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
        label="Team Rank (Local)"
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
