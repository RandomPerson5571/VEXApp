"use client";

import type { CSSProperties } from "react";
import {
  AlertTriangle,
  Box,
  Package,
  PackageCheck,
  PackageMinus,
  Search,
  Users,
} from "lucide-react";

import type { TeamInventoryItem } from "@stlvex/database/types";
import {
  type AvailabilityFilter,
  formatBorrowerName,
  formatUpdatedAt,
  getAvailableStock,
  getBorrowerInitials,
  getStockFill,
  getStockStatus,
  getTeamCheckedOutQuantity,
  getTeamSignOuts,
  summarizeInventory,
  type StockStatus,
} from "@/lib/inventory/inventory-utils";

const AVAILABILITY_FILTERS: { id: AvailabilityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "checked-out", label: "Team checked out" },
  { id: "depleted", label: "Depleted" },
];

const statusBarClass: Record<StockStatus, string> = {
  nominal: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]",
  low: "bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.35)]",
  depleted: "bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.45)]",
};

const statusLabelClass: Record<StockStatus, string> = {
  nominal: "text-emerald-400",
  low: "text-yellow-400",
  depleted: "text-red-400",
};

const statusBadgeClass: Record<StockStatus, string> = {
  nominal: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  low: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  depleted: "border-red-500/30 bg-red-500/10 text-red-400",
};

export function InventoryItemImage({
  item,
  className = "h-10 w-10",
}: {
  item: TeamInventoryItem;
  className?: string;
}) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt=""
        className={`shrink-0 rounded-xl border border-slate-800 object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10 ${className}`}
    >
      <Package className="h-4 w-4 text-yellow-400" />
    </div>
  );
}

export function InventoryStats({
  items,
  teamId,
}: {
  items: TeamInventoryItem[];
  teamId: string;
}) {
  const summary = summarizeInventory(items, teamId);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <StatCard
        label="SKUs"
        value={summary.totalSkus}
        icon={Box}
        tone="slate"
      />
      <StatCard
        label="Total stock"
        value={summary.totalStock}
        icon={Package}
        tone="blue"
      />
      <StatCard
        label="Available"
        value={summary.availableUnits}
        icon={PackageCheck}
        tone="green"
      />
      <StatCard
        label="Team out"
        value={summary.teamCheckedOut}
        icon={Users}
        tone="yellow"
      />
      <StatCard
        label="Alerts"
        value={summary.alerts}
        icon={AlertTriangle}
        tone={summary.depleted > 0 ? "red" : summary.alerts > 0 ? "yellow" : "green"}
        pulse={summary.depleted > 0}
      />
    </div>
  );
}

function StatCard({
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
    slate: "border-slate-800/80 bg-slate-950/50 text-slate-300",
    blue: "border-blue-500/20 bg-blue-500/5 text-blue-300",
    yellow: "border-yellow-500/20 bg-yellow-500/5 text-yellow-300",
    red: "border-red-500/20 bg-red-500/5 text-red-300",
    green: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
  };

  const iconClasses = {
    slate: "text-slate-500",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    green: "text-emerald-400",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 backdrop-blur-sm transition-[transform,box-shadow] duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none ${toneClasses[tone]} ${pulse ? "motion-safe:animate-pulse" : ""}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${iconClasses[tone]}`} />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>
      </div>
      <span className="text-2xl font-black font-mono leading-none text-slate-100">
        {value}
      </span>
    </div>
  );
}

export function InventoryFilters({
  search,
  availabilityFilter,
  onSearchChange,
  onAvailabilityChange,
  resultCount,
}: {
  search: string;
  availabilityFilter: AvailabilityFilter;
  onSearchChange: (value: string) => void;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  resultCount: number;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-900/80 bg-[#090e18]/70 p-4 shadow-md backdrop-blur-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search parts by name or description…"
            className="w-full rounded-xl border border-slate-900 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-200 outline-none transition-[border-color,box-shadow] placeholder:text-slate-600 focus:border-yellow-500/40 focus:shadow-[0_0_0_3px_rgba(234,179,8,0.12)]"
          />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {AVAILABILITY_FILTERS.map((filter) => {
          const active = availabilityFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onAvailabilityChange(filter.id)}
              className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-[transform,background-color,border-color,color] duration-200 motion-safe:active:scale-95 motion-reduce:transition-none ${
                active
                  ? "border-yellow-500/30 bg-yellow-500/15 text-yellow-300"
                  : "border-slate-900 bg-slate-950/60 text-slate-500 hover:border-slate-800 hover:text-slate-300"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function InventoryCard({
  item,
  teamId,
  index,
}: {
  item: TeamInventoryItem;
  teamId: string;
  index: number;
}) {
  const status = getStockStatus(item);
  const fill = getStockFill(item);
  const available = getAvailableStock(item);
  const teamCheckedOut = getTeamCheckedOutQuantity(item, teamId);
  const teamSignOuts = getTeamSignOuts(item, teamId);

  const staggerStyle = {
    animationDelay: `${index * 70}ms`,
  } satisfies CSSProperties;

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-slate-900/80 bg-[#090e18]/80 p-5 shadow-md backdrop-blur-sm transition-[transform,border-color] duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-backwards motion-safe:hover:-translate-y-1 motion-safe:hover:border-slate-800 motion-reduce:animate-none motion-reduce:transition-none"
      style={staggerStyle}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-500/[0.04] via-transparent to-blue-500/[0.03] opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
      />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-slate-100">{item.name}</h2>
              <span
                className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusBadgeClass[status]}`}
              >
                {status === "depleted" ? (
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle
                      className={`h-3 w-3 ${status === "depleted" ? "motion-safe:animate-pulse" : ""}`}
                    />
                    Depleted
                  </span>
                ) : status === "low" ? (
                  "Low stock"
                ) : (
                  "In stock"
                )}
              </span>
            </div>
            {item.description ? (
              <p className="text-xs font-medium leading-relaxed text-slate-400">
                {item.description}
              </p>
            ) : null}
            <p className="text-[10px] font-semibold text-slate-500">
              Updated {formatUpdatedAt(item.updatedAt)}
            </p>
          </div>

          <InventoryItemImage item={item} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-400">
              Available{" "}
              <span className={`font-mono ${statusLabelClass[status]}`}>
                {available}
              </span>
              <span className="text-slate-600"> / {item.totalStock} total</span>
            </span>
            {teamCheckedOut > 0 ? (
              <span className="inline-flex items-center gap-1 text-yellow-400">
                <PackageMinus className="h-3.5 w-3.5" />
                {teamCheckedOut} with team
              </span>
            ) : null}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-slate-900/80 bg-slate-950">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${statusBarClass[status]}`}
              style={{ width: `${fill}%` }}
            />
          </div>
        </div>

        {teamSignOuts.length > 0 ? (
          <div className="rounded-xl border border-slate-900/80 bg-slate-950/40 p-3">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Checked out by your team
            </p>
            <ul className="space-y-2">
              {teamSignOuts.map((signOut) => (
                <li
                  key={signOut.id}
                  className="flex items-center justify-between gap-3 text-[11px]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      title={formatBorrowerName(signOut.user)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-gradient-to-br from-yellow-700 to-amber-900 text-[9px] font-bold text-white"
                    >
                      {getBorrowerInitials(signOut.user)}
                    </div>
                    <span className="truncate font-semibold text-slate-300">
                      {formatBorrowerName(signOut.user)}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono font-bold text-slate-400">
                    ×{signOut.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}
