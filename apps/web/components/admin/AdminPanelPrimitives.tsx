"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@stlvex/ui";

type AdminStatChipProps = {
  icon: LucideIcon;
  label: string;
  variant?: "default" | "accent" | "success";
};

export function AdminStatChip({
  icon: Icon,
  label,
  variant = "default",
}: AdminStatChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold tracking-wide",
        variant === "default" &&
          "border-slate-800/80 bg-slate-950/50 text-slate-300",
        variant === "accent" &&
          "border-blue-500/20 bg-blue-500/10 text-blue-300",
        variant === "success" &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
      {label}
    </span>
  );
}

type AdminTabOption<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
};

type AdminTabSwitcherProps<T extends string> = {
  tabs: AdminTabOption<T>[];
  active: T;
  onChange: (tab: T) => void;
};

export function AdminTabSwitcher<T extends string>({
  tabs,
  active,
  onChange,
}: AdminTabSwitcherProps<T>) {
  return (
    <div
      className="flex items-center gap-1 self-start rounded-xl border border-slate-800/80 bg-slate-950/60 p-1 shadow-inner"
      role="tablist"
      aria-label="Administration sections"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-[color,background-color,box-shadow,transform] duration-200",
              "motion-safe:hover:scale-[1.02] motion-reduce:transition-none",
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

type AdminErrorAlertProps = {
  message: string;
  onDismiss?: () => void;
};

export function AdminErrorAlert({ message, onDismiss }: AdminErrorAlertProps) {
  return (
    <div
      className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200"
      role="alert"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
      <p className="min-w-0 flex-1 text-xs font-semibold leading-relaxed text-red-300">
        {message}
      </p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-0.5 text-red-400/80 transition hover:bg-red-500/15 hover:text-red-300"
          aria-label="Dismiss error"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

type AdminEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
};

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/50">
        <Icon className="size-5 text-slate-500" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-300">{title}</p>
        {description ? (
          <p className="max-w-xs text-xs font-medium text-slate-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

type AdminTableFrameProps = {
  children: ReactNode;
  className?: string;
};

export function AdminTableFrame({ children, className }: AdminTableFrameProps) {
  return (
    <div
      className={cn(
        "admin-scroll overflow-auto rounded-xl border border-slate-800/80 bg-slate-950/30 shadow-sm backdrop-blur-sm",
        "ring-1 ring-white/[0.02]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const adminSelectContentClassName = cn(
  "z-[200] min-w-[var(--radix-select-trigger-width)] border-slate-700/80 bg-[#0c1220] text-slate-100 shadow-xl shadow-black/50",
  "admin-scroll",
);

export const adminSelectItemClassName = cn(
  "cursor-pointer rounded-md py-2 pl-2 pr-2 text-slate-200",
  "[&>span:first-child]:hidden",
  "focus:bg-slate-800 focus:text-slate-100",
  "data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-100",
);

export const adminTableHeadClassName =
  "h-10 text-[10px] font-black uppercase tracking-widest text-slate-500";

export const adminTableRowClassName = cn(
  "border-slate-800/60 transition-colors duration-150",
  "hover:bg-slate-900/40",
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:fill-mode-backwards motion-safe:duration-300",
  "motion-reduce:animate-none",
);

export const adminInlineInputClassName =
  "h-9 border-slate-800/80 bg-slate-950/50 transition-[border-color,box-shadow] focus-visible:border-blue-500/40 focus-visible:ring-blue-500/20";

export const adminSwitchClassName = cn(
  "shrink-0 border border-slate-600/50 shadow-inner",
  "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-700",
  "[&>span]:bg-white [&>span]:shadow-md",
  "focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
);
