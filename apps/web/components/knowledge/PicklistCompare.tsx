"use client";

import { ArrowLeftRight, X } from "lucide-react";

import type { TeamEventStats } from "@/lib/queries/robotevents";
import type { ScoutNoteRecord } from "@/lib/queries/scouting";

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function Stat({
  label,
  value,
  digits = 1,
}: {
  label: string;
  value: number | null | undefined;
  digits?: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 px-2.5 py-2 dark:border-[#2a2a2a]">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
        {value == null ? "—" : value.toFixed(digits)}
      </div>
    </div>
  );
}

function CompareSide({
  note,
  side,
  onPrefer,
  canDecide,
  stats,
}: {
  note: ScoutNoteRecord;
  side: "left" | "right";
  onPrefer: () => void;
  canDecide: boolean;
  stats?: TeamEventStats;
}) {
  const extraNotes = stripHtml(note.content);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-[#1a1a1a]">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {side === "left" ? "Team A" : "Team B"}
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
          {note.targetTeamNumber}
        </h2>
        {note.targetTeamName ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {note.targetTeamName}
          </p>
        ) : null}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 dashboard-scroll">
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Advanced analytics
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="OPR" value={stats?.opr} />
            <Stat label="CCWM" value={stats?.ccwm} />
            <Stat label="AP" value={stats?.ap} digits={0} />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Scout form
          </h3>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-[#121212]">
              <dt className="text-[10px] uppercase text-slate-400">Drive</dt>
              <dd className="font-bold text-slate-900 dark:text-slate-100">
                {note.driveRating ?? "—"}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-[#121212]">
              <dt className="text-[10px] uppercase text-slate-400">Auton</dt>
              <dd className="font-bold text-slate-900 dark:text-slate-100">
                {note.autonReliability ?? "—"}
              </dd>
            </div>
            <div className="col-span-2 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-[#121212]">
              <dt className="text-[10px] uppercase text-slate-400">
                Mechanisms
              </dt>
              <dd className="mt-0.5 text-slate-800 dark:text-slate-200">
                {note.mechanisms?.trim() || "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Notes
          </h3>
          <p className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs whitespace-pre-wrap text-slate-700 dark:bg-[#121212] dark:text-slate-300">
            {extraNotes || "—"}
          </p>
        </section>
      </div>

      {canDecide ? (
        <div className="border-t border-slate-200 p-3 dark:border-[#1a1a1a]">
          <button
            type="button"
            onClick={onPrefer}
            className="inline-flex w-full items-center justify-center rounded-lg bg-orange-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-500"
          >
            Prefer {note.targetTeamNumber}
          </button>
        </div>
      ) : null}
    </div>
  );
}

type PicklistCompareProps = {
  left: ScoutNoteRecord;
  right: ScoutNoteRecord;
  canDecide: boolean;
  statsByTeamNumber: Record<string, TeamEventStats>;
  onPrefer: (winnerId: string, loserId: string) => void;
  onCancel: () => void;
};

export function PicklistCompare({
  left,
  right,
  canDecide,
  statsByTeamNumber,
  onPrefer,
  onCancel,
}: PicklistCompareProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-orange-500" />
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Head-to-head
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pick the stronger alliance partner. Winner moves above the other
              on the picklist.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-[#1a1a1a] dark:text-slate-300 dark:hover:bg-[#121212]"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <CompareSide
          note={left}
          side="left"
          canDecide={canDecide}
          stats={statsByTeamNumber[left.targetTeamNumber.trim().toUpperCase()]}
          onPrefer={() => onPrefer(left.id, right.id)}
        />
        <CompareSide
          note={right}
          side="right"
          canDecide={canDecide}
          stats={statsByTeamNumber[right.targetTeamNumber.trim().toUpperCase()]}
          onPrefer={() => onPrefer(right.id, left.id)}
        />
      </div>
    </div>
  );
}
