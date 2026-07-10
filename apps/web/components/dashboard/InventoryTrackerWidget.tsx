"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Box,
  ChevronRight,
  Package,
  Search,
} from "lucide-react";

import type { TeamInventoryItem } from "@stlvex/database/types";
import { InventoryItemImage } from "@/components/inventory/InventoryComponents";
import { useTeam } from "@/components/providers/UserProvider";
import { isQueryInitiallyLoading } from "@/lib/hooks/use-query-loading";
import { useTeamInventory } from "@/lib/hooks/use-team-inventory";
import {
  formatUpdatedAt,
  getAvailableStock,
  getStockFill,
  getStockStatus,
  summarizeInventory,
  type StockStatus,
} from "@/lib/inventory/inventory-utils";
import { DashboardRowSkeleton } from "./dashboard-skeletons";

const statusBarClass: Record<StockStatus, string> = {
  nominal: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]",
  low: "bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.35)]",
  depleted: "bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.45)]",
};

const statusLabelClass: Record<StockStatus, string> = {
  nominal: "text-emerald-600 dark:text-emerald-400",
  low: "text-yellow-600 dark:text-yellow-400",
  depleted: "text-red-600 dark:text-red-400",
};

function InventoryRow({ item, index }: { item: TeamInventoryItem; index: number }) {
  const status = getStockStatus(item);
  const fill = getStockFill(item);
  const available = getAvailableStock(item);

  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-950/60 p-3 transition-[transform,opacity,border-color] duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-slate-400 dark:motion-safe:hover:border-white/20 motion-reduce:transition-none"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-400/[0.10] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none" />

      <div className="relative flex items-start justify-between gap-3">
        <InventoryItemImage item={item} className="h-9 w-9" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-xs font-extrabold text-slate-900 dark:text-white">{item.name}</p>
            {status !== "nominal" ? (
              <span
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider ${
                  status === "depleted"
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                }`}
              >
                <AlertTriangle
                  className={`h-2.5 w-2.5 ${status === "depleted" ? "motion-safe:animate-pulse" : ""}`}
                />
                {status === "depleted" ? "Depleted" : "Low"}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {item.description ? (
              <span className="truncate text-slate-600 dark:text-slate-400">{item.description}</span>
            ) : null}
            <span>Updated {formatUpdatedAt(item.updatedAt)}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-600 dark:text-slate-400">
                Available{" "}
                <span className={`font-mono ${statusLabelClass[status]}`}>{available}</span>
                <span className="text-slate-500 dark:text-slate-600"> / {item.totalStock} total</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-slate-900/80">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${statusBarClass[status]}`}
                style={{ width: `${fill}%` }}
              />
            </div>
          </div>
        </div>

        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-700 dark:group-hover:text-slate-500" />
      </div>
    </div>
  );
}

export function InventoryTrackerWidget() {
  const team = useTeam();
  const teamId = team?.id ?? "";
  const inventoryQuery = useTeamInventory();
  const { data: items = [] } = inventoryQuery;
  const isInitialLoading = isQueryInitiallyLoading(inventoryQuery);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [item.name, item.description ?? ""].join(" ").toLowerCase().includes(query),
    );
  }, [items, search]);

  const summary = useMemo(
    () => summarizeInventory(items, teamId),
    [items, teamId],
  );

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#091126]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mb-4 flex items-start justify-between gap-3 border-b border-slate-300 dark:border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-500/10">
              <Package className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.24em] text-slate-900 dark:text-slate-100">
              Inventory Tracker
            </h3>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Live stock levels across the workshop
          </p>
        </div>
        <Link
          href="/inventory"
          className="text-[10px] font-bold text-orange-600 transition-colors hover:text-orange-500 hover:underline dark:text-orange-500 dark:hover:text-orange-400"
        >
          Manage Inventory →
        </Link>
      </div>

      <div className="relative mb-4 grid grid-cols-3 gap-3">
        {isInitialLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[4.25rem] animate-pulse rounded-3xl border border-slate-300 bg-slate-100 dark:border-white/10 dark:bg-slate-950/60"
              />
            ))
          : (
            <>
              <SummaryPill
                label="SKUs"
                value={summary.totalSkus}
                icon={Box}
                tone="slate"
              />
              <SummaryPill
                label="Available"
                value={summary.availableUnits}
                icon={Package}
                tone="blue"
              />
              <SummaryPill
                label="Alerts"
                value={summary.alerts}
                icon={AlertTriangle}
                tone={summary.depleted > 0 ? "red" : summary.alerts > 0 ? "yellow" : "green"}
                pulse={summary.depleted > 0}
              />
            </>
          )}
      </div>

      <div className="relative mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parts…"
            className="w-full rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/80 py-2.5 pl-10 pr-3 text-[11px] font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-500 dark:focus:border-blue-400/40 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.16)] placeholder:text-slate-600 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="relative flex-1 space-y-2.5 overflow-y-auto pr-0.5 dashboard-scroll max-h-[340px]">
        {isInitialLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <DashboardRowSkeleton key={index} className="h-20" />
          ))
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-300 bg-slate-100 py-10 text-center dark:border-white/10 dark:bg-slate-950/60">
            <Package className="mb-2 h-8 w-8 text-slate-500 dark:text-slate-400" />
            <p className="text-xs font-bold text-slate-900 dark:text-white">No matching parts</p>
            <p className="mt-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              Try a different search query
            </p>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <InventoryRow key={item.id} item={item} index={index} />
          ))
        )}
      </div>

      {summary.depleted > 0 ? (
        <div className="relative mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400 motion-safe:animate-pulse" />
          <p className="text-[10px] font-bold text-red-600 dark:text-red-300/90">
            {summary.depleted} part{summary.depleted === 1 ? "" : "s"} fully depleted —
            reorder before the next build session.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SummaryPill({
  label,
  value,
  icon: Icon,
  tone,
  pulse,
}: {
  label: string;
  value: number;
  icon: typeof Package;
  tone: "slate" | "blue" | "yellow" | "red" | "green";
  pulse?: boolean;
}) {
  const toneClasses = {
    slate: "border-slate-300 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200",
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-600 dark:text-blue-300",
    yellow: "border-yellow-400/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-300",
    red: "border-red-400/20 bg-red-500/10 text-red-600 dark:text-red-300",
    green: "border-emerald-400/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  };

  const iconClasses = {
    slate: "text-slate-500",
    blue: "text-blue-600 dark:text-blue-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    red: "text-red-600 dark:text-red-400",
    green: "text-emerald-600 dark:text-emerald-400",
  };

  return (
    <div
      className={`rounded-3xl border px-3 py-2.5 text-center ${toneClasses[tone]} ${pulse ? "motion-safe:animate-pulse" : ""}`}
    >
      <div className="mb-1 flex items-center justify-center gap-1">
        <Icon className={`h-3 w-3 ${iconClasses[tone]}`} />
        <span className="text-[8.5px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>
      </div>
      <span className="text-lg font-black font-mono leading-none text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}
