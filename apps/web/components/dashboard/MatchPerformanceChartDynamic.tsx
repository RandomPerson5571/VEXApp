"use client";

import dynamic from "next/dynamic";
import type { MatchRecord } from "@/lib/types/team";

const MatchPerformanceChart = dynamic(
  () => import("./PerformanceWidget").then((m) => m.MatchPerformanceChart),
  {
    ssr: false,
    loading: () => (
      <div
        aria-busy
        aria-label="Loading match performance chart"
        className="lg:col-span-8 h-[420px] animate-pulse rounded-2xl border border-slate-900 bg-slate-950/60"
      />
    ),
  },
);

export function MatchPerformanceChartDynamic({ matches }: { matches: MatchRecord[] }) {
  return <MatchPerformanceChart matches={matches} />;
}
