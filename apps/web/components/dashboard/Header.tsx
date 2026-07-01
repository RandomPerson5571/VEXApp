import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-6 rounded-[32px] border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Team Dashboard</h1>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Overview of robot build status, event readiness, inventory alerts, and match analytics in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-300 dark:hover:bg-slate-900/80"
          >
            Customize Layout
          </Link>
          <span className="rounded-full border border-slate-300 dark:border-slate-800/80 bg-slate-200 dark:bg-slate-950/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
            Live team view
          </span>
        </div>
      </div>
    </div>
  );
}

export function SummaryStatCard({
  label,
  value,
  delta,
  deltaTone = "orange",
  subtitle,
  icon: Icon,
  iconTone,
  warning,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "orange" | "green";
  subtitle: React.ReactNode;
  icon: LucideIcon;
  iconTone: "orange" | "indigo" | "yellow" | "green";
  warning?: boolean;
}) {
  const iconToneClasses = {
    orange: "bg-orange-500/10 border-orange-400/20 text-orange-600 dark:text-orange-300",
    indigo: "bg-indigo-500/10 border-indigo-400/20 text-indigo-600 dark:text-indigo-300",
    yellow: "bg-yellow-500/10 border-yellow-400/20 text-yellow-600 dark:text-yellow-300",
    green: "bg-emerald-500/10 border-emerald-400/20 text-emerald-600 dark:text-emerald-300",
  };

  const deltaToneClasses = {
    orange: "text-orange-600 dark:text-orange-300",
    green: "text-emerald-600 dark:text-emerald-300",
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-950/70 px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-400">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-orange-400" />
            {label}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
            {delta ? (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${deltaToneClasses[deltaTone]}`}>
                <TrendingUp className="h-3 w-3" />
                {delta}
              </span>
            ) : null}
          </div>
          <p className={`text-xs font-semibold ${warning ? "text-yellow-600 dark:text-yellow-300" : "text-slate-600 dark:text-slate-400"}`}>
            {subtitle}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${iconToneClasses[iconTone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
