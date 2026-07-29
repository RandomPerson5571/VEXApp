"use client";

import { AlertTriangle } from "lucide-react";

import type { CalendarSourcesStatus } from "@/lib/mappers/calendar-sources";

type CalendarSourcesBannerProps = {
  status: CalendarSourcesStatus;
  warning: string | null;
  className?: string;
};

export function CalendarSourcesBanner({
  status,
  warning,
  className = "",
}: CalendarSourcesBannerProps) {
  if (status === "both-unavailable") {
    return (
      <div
        role="alert"
        className={`rounded-xl border border-red-300/60 bg-red-50 px-3 py-2.5 text-[11px] font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 ${className}`}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Couldn&apos;t load team schedule or official RobotEvents data. Check
            your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!warning) return null;

  return (
    <p
      role="status"
      className={`text-[10px] font-medium text-[color:var(--site-accent)] dark:text-[color:var(--site-accent)]/90 ${className}`}
    >
      {warning}
    </p>
  );
}
