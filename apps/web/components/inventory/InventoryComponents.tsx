"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  Box,
  Package,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";

import type { TeamInventoryItem } from "@stlvex/database/types";
import { useTeamInventoryMutations } from "@/lib/hooks/use-team-inventory-mutations";
import { useInventoryImageUrl } from "@/lib/hooks/use-inventory-image-url";
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

function InventoryActionDialog({
  isOpen,
  title,
  description,
  children,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-action-dialog-title"
        className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-5 font-sans shadow-2xl dark:border-slate-900 dark:bg-[#090e18]"
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-900">
          <div className="min-w-0">
            <h3
              id="inventory-action-dialog-title"
              className="text-sm font-black text-slate-900 dark:text-slate-100"
            >
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function InventoryItemImage({
  item,
  className = "h-10 w-10",
}: {
  item: TeamInventoryItem;
  className?: string;
}) {
  const { url, isLoading } = useInventoryImageUrl(item.imageUrl);

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`shrink-0 rounded-xl border border-slate-800 object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10 ${className} ${isLoading ? "motion-safe:animate-pulse" : ""}`}
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
    slate: "border-slate-300 dark:border-slate-800/80 bg-slate-200 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300",
    blue: "border-blue-300 dark:border-blue-500/20 bg-blue-100 dark:bg-blue-500/5 text-blue-700 dark:text-blue-300",
    yellow: "border-yellow-300 dark:border-yellow-500/20 bg-yellow-100 dark:bg-yellow-500/5 text-yellow-700 dark:text-yellow-300",
    red: "border-red-300 dark:border-red-500/20 bg-red-100 dark:bg-red-500/5 text-red-700 dark:text-red-300",
    green: "border-emerald-300 dark:border-emerald-500/20 bg-emerald-100 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  };

  const iconClasses = {
    slate: "text-slate-600 dark:text-slate-500",
    blue: "text-blue-600 dark:text-blue-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    red: "text-red-600 dark:text-red-400",
    green: "text-emerald-600 dark:text-emerald-400",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 backdrop-blur-sm transition-[transform,box-shadow] duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none ${toneClasses[tone]} ${pulse ? "motion-safe:animate-pulse" : ""}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${iconClasses[tone]}`} />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-500">
          {label}
        </span>
      </div>
      <span className="text-2xl font-black font-mono leading-none text-slate-900 dark:text-slate-100">
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
    <div className="space-y-3 rounded-2xl border border-slate-300 dark:border-slate-900/80 bg-slate-50 dark:bg-[#090e18]/70 p-4 shadow-md dark:shadow-md backdrop-blur-sm dark:backdrop-blur-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search parts by name or description…"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-900 bg-white dark:bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 dark:text-slate-200 outline-none transition-[border-color,box-shadow] placeholder:text-slate-600 dark:placeholder:text-slate-600 focus:border-yellow-500 dark:focus:border-yellow-500/40 focus:shadow-[0_0_0_3px_rgba(234,179,8,0.12)]"
          />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-500">
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
                  ? "border-yellow-500/30 bg-yellow-500/15 text-yellow-600 dark:text-yellow-300"
                  : "border-slate-300 dark:border-slate-900 bg-slate-200 dark:bg-slate-950/60 text-slate-700 dark:text-slate-500 hover:border-slate-400 dark:hover:border-slate-800 hover:text-slate-900 dark:hover:text-slate-300"
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
  const [quantity, setQuantity] = useState("1");
  const [actionError, setActionError] = useState<string | undefined>();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const { signOutMutation, returnMutation } = useTeamInventoryMutations({
    teamId,
  });
  const isSigningOut = signOutMutation.isPending;
  const isReturning = returnMutation.isPending;
  const parsedQuantity = Number.parseInt(quantity, 10);
  const maxCheckoutQuantity =
    item.checkoutLimit === null || item.checkoutLimit === undefined
      ? available
      : Math.min(available, item.checkoutLimit);
  const canSignOut =
    available > 0 &&
    Number.isInteger(parsedQuantity) &&
    parsedQuantity > 0 &&
    parsedQuantity <= maxCheckoutQuantity &&
    !isSigningOut;

  const staggerStyle = {
    animationDelay: `${index * 70}ms`,
  } satisfies CSSProperties;

  const handleSignOut = async () => {
    if (!canSignOut) return;

    setActionError(undefined);

    try {
      await signOutMutation.mutateAsync({
        itemId: item.id,
        quantity: parsedQuantity,
      });
      setQuantity("1");
      setIsCheckoutOpen(false);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to sign out inventory item.",
      );
    }
  };

  const handleReturn = async (signOutId: string) => {
    if (isReturning) return;

    setActionError(undefined);

    try {
      await returnMutation.mutateAsync({
        itemId: item.id,
        signOutId,
      });
      if (teamSignOuts.length <= 1) {
        setIsCheckinOpen(false);
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to return inventory item.",
      );
    }
  };

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-900/80 bg-slate-100 dark:bg-[#090e18]/80 p-5 shadow-md dark:shadow-md backdrop-blur-sm transition-[transform,border-color] duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-backwards motion-safe:hover:-translate-y-1 motion-safe:hover:border-slate-400 dark:motion-safe:hover:border-slate-800 motion-reduce:animate-none motion-reduce:transition-none"
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
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">{item.name}</h2>
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
              <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
            ) : null}
            <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-500">
              Updated {formatUpdatedAt(item.updatedAt)}
            </p>
          </div>

          <InventoryItemImage item={item} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-600 dark:text-slate-400">
              Available{" "}
              <span className={`font-mono ${statusLabelClass[status]}`}>
                {available}
              </span>
              <span className="text-slate-600 dark:text-slate-600"> / {item.totalStock} total</span>
            </span>
            {teamCheckedOut > 0 ? (
              <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                <PackageMinus className="h-3.5 w-3.5" />
                {teamCheckedOut} with team
              </span>
            ) : null}
          </div>
          {item.checkoutLimit ? (
            <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-500">
              Checkout limit: {item.checkoutLimit} per sign-out
            </p>
          ) : null}
          <div className="h-2 w-full overflow-hidden rounded-full border border-slate-300 dark:border-slate-900/80 bg-slate-200 dark:bg-slate-950">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${statusBarClass[status]}`}
              style={{ width: `${fill}%` }}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setActionError(undefined);
              setIsCheckoutOpen(true);
            }}
            disabled={available <= 0}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-yellow-600 px-3 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-yellow-500/15 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-95 motion-reduce:transition-none"
          >
            <PackagePlus className="h-3.5 w-3.5" />
            Check out
          </button>
          <button
            type="button"
            onClick={() => {
              setActionError(undefined);
              setIsCheckinOpen(true);
            }}
            disabled={teamSignOuts.length === 0}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-600 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Check in
          </button>
        </div>

        {teamSignOuts.length > 0 ? (
          <div className="rounded-xl border border-slate-300 dark:border-slate-900/80 bg-slate-100 dark:bg-slate-950/40 p-3">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-500">
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
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-800 dark:border-slate-800 bg-gradient-to-br from-yellow-700 dark:from-yellow-700 to-amber-900 dark:to-amber-900 text-[9px] font-bold text-white dark:text-white"
                    >
                      {getBorrowerInitials(signOut.user)}
                    </div>
                    <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                      {formatBorrowerName(signOut.user)}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono font-bold text-slate-600 dark:text-slate-400">
                    x{signOut.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {actionError ? (
          <p className="text-[10px] font-semibold text-red-500 dark:text-red-400">
            {actionError}
          </p>
        ) : null}
      </div>

      <InventoryActionDialog
        isOpen={isCheckoutOpen}
        title={`Check out ${item.name}`}
        description={`${available} of ${item.totalStock} currently available${
          item.checkoutLimit ? `, ${item.checkoutLimit} max per sign-out` : ""
        }.`}
        onClose={() => {
          if (!isSigningOut) {
            setIsCheckoutOpen(false);
          }
        }}
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-500">
              Quantity
            </span>
            <input
              type="number"
              min={1}
              max={Math.max(maxCheckoutQuantity, 1)}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={available <= 0 || isSigningOut}
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none transition-[border-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 focus:border-yellow-500 focus:shadow-[0_0_0_3px_rgba(234,179,8,0.12)] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-yellow-500/40"
            />
          </label>
          {actionError ? (
            <p className="text-xs font-semibold text-red-500 dark:text-red-400">
              {actionError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              disabled={isSigningOut}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={!canSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-yellow-500/15 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PackagePlus className="h-4 w-4" />
              {isSigningOut ? "Checking out..." : "Check out"}
            </button>
          </div>
        </div>
      </InventoryActionDialog>

      <InventoryActionDialog
        isOpen={isCheckinOpen}
        title={`Check in ${item.name}`}
        description="Return active sign-outs from your team."
        onClose={() => {
          if (!isReturning) {
            setIsCheckinOpen(false);
          }
        }}
      >
        <div className="space-y-3">
          {teamSignOuts.length > 0 ? (
            <ul className="space-y-2">
              {teamSignOuts.map((signOut) => (
                <li
                  key={signOut.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs dark:border-slate-900 dark:bg-slate-950/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-900 dark:text-slate-100">
                      {formatBorrowerName(signOut.user)}
                    </p>
                    <p className="mt-1 font-mono font-bold text-slate-600 dark:text-slate-400">
                      x{signOut.quantity}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReturn(signOut.id)}
                    disabled={isReturning}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-600 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {isReturning ? "Checking in..." : "Check in"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-xs font-semibold text-slate-600 dark:border-slate-900 dark:bg-slate-950/50 dark:text-slate-400">
              Your team does not have this part checked out.
            </p>
          )}
          {actionError ? (
            <p className="text-xs font-semibold text-red-500 dark:text-red-400">
              {actionError}
            </p>
          ) : null}
        </div>
      </InventoryActionDialog>
    </article>
  );
}
