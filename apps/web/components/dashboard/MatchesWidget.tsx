"use client";

import { ChevronRight, ExternalLink } from "lucide-react";

import { CalendarSourcesBanner } from "@/components/calendar/CalendarSourcesBanner";
import { useMergedCalendarSources } from "@/lib/hooks/use-merged-calendar-sources";
import { DashboardRowSkeleton } from "./dashboard-skeletons";

export function UpcomingMatchesList() {
  const {
    upcomingMatches: events,
    status,
    warning,
    isInitialLoading,
    configured,
    teamNumber,
  } = useMergedCalendarSources();

  return (
    <div className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
      <div className="flex items-start justify-between border-b border-slate-300 pb-2.5 dark:border-[#1a1a1a]">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Upcoming Matches
          </span>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            {teamNumber
              ? `Team schedule + RobotEvents for ${teamNumber}`
              : "Team schedule + RobotEvents tournaments"}
          </p>
        </div>
        <a
          href="https://events.vex.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          events.vex
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-3">
        {isInitialLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <DashboardRowSkeleton key={index} className="h-[72px]" />
          ))
        ) : status === "both-unavailable" ? (
          <CalendarSourcesBanner status={status} warning={warning} />
        ) : events.length === 0 && !configured ? (
          <p className="py-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            Set <code className="font-mono text-[10px]">VEX_API_TOKEN</code> on
            the web app to load RobotEvents data. Team calendar events still
            appear here when present.
          </p>
        ) : events.length === 0 ? (
          <>
            <CalendarSourcesBanner status={status} warning={warning} />
            <p className="py-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              No upcoming team or RobotEvents tournaments found.
            </p>
          </>
        ) : (
          <>
            <CalendarSourcesBanner status={status} warning={warning} />
            {events.map((match) => {
              const content = (
                <>
                  <div className="flex gap-3">
                    <div className="flex min-w-[45px] flex-col items-center justify-center rounded-lg border border-orange-400/30 bg-orange-500/15 px-2 py-1.5 text-center font-black text-orange-700 dark:text-orange-300">
                      <span className="text-[9px] font-black uppercase leading-none">
                        {match.monthLabel}
                      </span>
                      <span className="text-md mt-1 leading-none">
                        {match.day}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {match.title}
                      </span>
                      <span className="mt-0.5 text-[10.5px] font-semibold text-slate-400">
                        {match.location}
                      </span>
                      <span className="text-[9.5px] font-medium text-slate-500">
                        {match.time}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-slate-800 dark:group-hover:text-slate-400" />
                </>
              );

              const className =
                "group flex items-center justify-between gap-3 rounded-3xl border border-slate-300 bg-slate-100 p-3 text-xs transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-slate-400 dark:border-[#1a1a1a] dark:bg-[#121212]/60 dark:hover:border-[#2a2a2a]";

              if (match.href) {
                return (
                  <a
                    key={match.id}
                    href={match.href}
                    target="_blank"
                    rel="noreferrer"
                    className={className}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div key={match.id} className={className}>
                  {content}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
