import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

export function SummaryStatCard({
  label,
  value,
  delta,
  subtitle,
  icon: Icon,
  warning,
  danger,
}: {
  label: string;
  value: string | number;
  delta?: string;
  subtitle: React.ReactNode;
  icon: LucideIcon;
  warning?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.08)] ${
        danger
          ? "border-red-500/30 bg-red-500/5 ring-1 ring-red-500/30 dark:border-red-500/30 dark:bg-red-500/5"
          : "border-slate-300 bg-slate-100 dark:border-[#1a1a1a] dark:bg-[#0a0a0a]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-400">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                danger ? "bg-red-500" : "bg-orange-400"
              }`}
            />
            {label}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
            {delta ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-orange-600 dark:text-orange-300">
                <TrendingUp className="h-3 w-3" />
                {delta}
              </span>
            ) : null}
          </div>
          <p
            className={`text-xs font-semibold ${
              danger
                ? "text-red-600 dark:text-red-300"
                : warning
                  ? "text-amber-600 dark:text-amber-300"
                  : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {subtitle}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
            danger
              ? "border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-300"
              : "border-slate-300 bg-slate-200/60 text-slate-600 dark:border-[#2a2a2a] dark:bg-[#121212] dark:text-slate-300"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
