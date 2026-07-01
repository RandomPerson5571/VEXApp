"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { useTeamEvents } from "@/lib/hooks/use-team-events";
import { toUpcomingMatches } from "@/lib/mappers/upcoming-matches";

export function UpcomingMatchesList() {
  const { data: events = [], isLoading } = useTeamEvents();
  const matches = useMemo(() => toUpcomingMatches(events), [events]);

  return (
    <div className="rounded-[32px] border border-white/10 bg-[#091126]/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <span className="text-xs font-black text-slate-100 uppercase tracking-wider">
          Upcoming Matches
        </span>
        <Link
          href="/matches"
          className="text-[10px] font-bold text-slate-400 hover:text-slate-200"
        >
          View All
        </Link>
      </div>

      <div className={`space-y-3 ${isLoading ? "opacity-60" : ""}`}>
        {matches.length === 0 && !isLoading ? (
          <p className="text-[11px] text-slate-400 font-medium py-2">
            No upcoming matches scheduled.
          </p>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="p-3 rounded-3xl border border-white/10 bg-slate-950/60 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex gap-3">
                <div
                  className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg border font-black text-center min-w-[45px] ${match.accentClass}`}
                >
                  <span className="text-[9px] uppercase leading-none font-black text-slate-100">
                    {match.monthLabel}
                  </span>
                  <span className="text-md leading-none mt-1">{match.day}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-white">{match.title}</span>
                  <span className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                    {match.location}
                  </span>
                  <span className="text-[9.5px] text-slate-500 font-medium">
                    {match.time}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600 flex-shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
