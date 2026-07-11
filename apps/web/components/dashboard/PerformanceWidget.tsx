"use client";

import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MatchRecord } from "@/lib/types/team";

function computeMatchStats(matches: MatchRecord[]) {
  const avgScore =
    matches.length > 0
      ? Math.round((matches.reduce((sum, m) => sum + m.highScore, 0) / matches.length) * 10) / 10
      : 0;
  const maxScore = matches.length > 0 ? Math.max(...matches.map((m) => m.highScore)) : 0;
  const autoWinRate =
    matches.length > 0
      ? Math.round((matches.filter((m) => m.autoWin).length / matches.length) * 100)
      : 0;
  const driverWinRate =
    matches.length > 0
      ? Math.round((matches.filter((m) => m.driverWin).length / matches.length) * 100)
      : 0;

  return { avgScore, maxScore, autoWinRate, driverWinRate };
}

export function MatchPerformanceChart({ matches }: { matches: MatchRecord[] }) {
  const chartData = matches.slice(-7).map((m) => ({
    name: m.matchName,
    score: m.highScore,
    autonomous: m.autonomousScore,
    driver: m.driverScore,
    scoutedBy: m.scoutedBy,
  }));

  const { avgScore, maxScore, autoWinRate, driverWinRate } = computeMatchStats(matches);

  return (
    <div className="rounded-[32px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#08112a]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-4 border-b border-slate-300 dark:border-white/10 pb-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-[0.24em]">Recent Match Performance</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">High stakes scouting tracking</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatBadge label="High Score" value={maxScore} />
          <StatBadge label="Auto Win %" value={`${autoWinRate}%`} />
          <StatBadge label="Driver Win %" value={`${driverWinRate}%`} />
        </div>
      </div>

      <div className="h-[420px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={10}
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
              domain={[0, 120]}
            />
            <Tooltip
              content={(props) => {
                const { active, payload } = props;
                if (!active || !payload?.length) return null;
                const data = payload[0]?.payload as (typeof chartData)[number];
                if (!data) return null;
                return (
                  <div className="p-3 bg-slate-100 dark:bg-[#061423] border border-slate-300 dark:border-white/10 rounded-2xl shadow-2xl text-xs text-slate-900 dark:text-slate-200">
                    <p className="font-extrabold text-orange-300 mb-2">{data.name} Match Results</p>
                    <div className="h-px bg-white/10 my-1.5" />
                    <p className="flex justify-between gap-4 font-semibold text-slate-200">
                      Total Score:
                      <span className="font-mono text-white font-black">{data.score}</span>
                    </p>
                    <p className="flex justify-between gap-4 text-slate-400">
                      Autonomous: <span className="font-semibold">{data.autonomous}</span>
                    </p>
                    <p className="flex justify-between gap-4 text-slate-400">
                      Driver Skill: <span className="font-semibold">{data.driver}</span>
                    </p>
                    <p className="mt-2 text-[10px] text-slate-500 font-semibold">Scouted by {data.scoutedBy}</p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={4}
              activeDot={{ r: 7, stroke: "#93c5fd", strokeWidth: 2 }}
              dot={{ r: 4, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-slate-950/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-700 dark:text-slate-300 shadow-lg">
          <span>Avg score</span>
          <span className="rounded-full bg-slate-300 dark:bg-slate-900 px-2 py-0.5 text-slate-900 dark:text-white font-black">{avgScore}</span>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-950/60 px-3 py-2 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400 block leading-none">{label}</span>
      <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-1 block">{value}</span>
    </div>
  );
}
