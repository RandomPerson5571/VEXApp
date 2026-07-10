"use client";

import dynamic from "next/dynamic";
import type { MatchRecord } from "@/lib/types/team";

const MatchPerformanceChart = dynamic(
  () => import("./PerformanceWidget").then((m) => m.MatchPerformanceChart),
  {
    ssr: false,
    loading: () => <div aria-hidden className="min-h-[420px]" />,
  },
);

export function MatchPerformanceChartDynamic({ matches }: { matches: MatchRecord[] }) {
  return <MatchPerformanceChart matches={matches} />;
}
