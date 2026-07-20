"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { isQueryInitiallyLoading } from "@/lib/hooks/use-query-loading";
import { useTeamEvents } from "@/lib/hooks/use-team-events";
import { toUpcomingMatches } from "@/lib/mappers/upcoming-matches";
import { DashboardRowSkeleton } from "./dashboard-skeletons";

export function UpcomingMatchesList() {
  const eventsQuery = useTeamEvents();
  const { data: events = [] } = eventsQuery;
  const isInitialLoading = isQueryInitiallyLoading(eventsQuery);
  const matches = useMemo(() => toUpcomingMatches(events), [events]);

  return (
    <div className="rounded-[32px] border border-slate-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.08)] space-y-4">
      <div className="flex items-start justify-between border-b border-slate-300 dark:border-[#1a1a1a] pb-2.5">
        <div>
          <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Upcoming Events
          </span>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Everything on the calendar in the next 2 weeks
          </p>
        </div>
        <Link
          href="/calendar"
          className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {isInitialLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <DashboardRowSkeleton key={index} className="h-[72px]" />
          ))
        ) : matches.length === 0 ? (
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium py-2">
            No events in the next 2 weeks.{" "}
            <Link
              href="/calendar"
              className="font-bold text-orange-600 dark:text-orange-400 hover:underline"
            >
              Add one on the calendar
            </Link>
            .
          </p>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="p-3 rounded-3xl border border-slate-300 dark:border-[#1a1a1a] bg-slate-100 dark:bg-[#121212]/60 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex gap-3">
                <div className="flex min-w-[45px] flex-col items-center justify-center rounded-lg border border-orange-400/30 bg-orange-500/15 px-2 py-1.5 text-center font-black text-orange-700 dark:text-orange-300">
                  <span className="text-[9px] uppercase leading-none font-black">
                    {match.monthLabel}
                  </span>
                  <span className="text-md mt-1 leading-none">{match.day}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-900 dark:text-white">{match.title}</span>
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
