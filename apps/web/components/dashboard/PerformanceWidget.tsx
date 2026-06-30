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
    <div className="lg:col-span-8 rounded-2xl bg-[#090e18]/80 border border-slate-900/80 shadow-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4 mb-5">
        <div>
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wide">
            Recent Match Performance
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">High stakes scouting tracking</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatBadge label="High Score" value={maxScore} />
          <StatBadge label="Auto Win %" value={`${autoWinRate}%`} />
          <StatBadge label="Driver Win %" value={`${driverWinRate}%`} />
        </div>
      </div>

      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid stroke="#0e1726" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#475569"
              fontSize={10}
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#475569"
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
                  <div className="p-3 bg-[#0c1424] border border-slate-800 rounded-lg shadow-xl text-xs font-sans text-slate-200">
                    <p className="font-extrabold text-orange-400 mb-1">{data.name} Match Results</p>
                    <div className="h-px bg-slate-800 my-1.5" />
                    <p className="flex justify-between gap-4 font-semibold">
                      Total Score:{" "}
                      <span className="font-mono text-slate-100 font-black">{data.score}</span>
                    </p>
                    <p className="flex justify-between gap-4 text-slate-400">
                      Autonomous: <span className="font-semibold">{data.autonomous}</span>
                    </p>
                    <p className="flex justify-between gap-4 text-slate-400">
                      Driver Skill: <span className="font-semibold">{data.driver}</span>
                    </p>
                    <p className="text-[9.5px] text-slate-500 mt-1 font-semibold">
                      Scouted by {data.scoutedBy}
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={3}
              activeDot={{ r: 7, stroke: "#93c5fd", strokeWidth: 1 }}
              dot={{ r: 4, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-slate-950 border border-slate-900 shadow text-center select-none pointer-events-none">
          <span className="text-[8.5px] font-bold text-slate-500 uppercase block leading-none">Avg score</span>
          <span className="text-xs font-black text-slate-200 font-mono mt-0.5 block">{avgScore}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-xs">
        <span className="font-bold text-slate-400">Showing last 7 scouting records.</span>
        <Link href="/scouting" className="text-orange-500 font-bold hover:underline">
          Manage Match Records →
        </Link>
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-900 text-center">
      <span className="text-[9px] font-bold text-slate-500 uppercase block leading-none">{label}</span>
      <span className="text-sm font-black text-slate-100 font-mono mt-1 block">{value}</span>
    </div>
  );
}
