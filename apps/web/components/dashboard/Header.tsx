import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Team Dashboard</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
          Overview of robot build statuses, pending scrimmage matches, and scouter analytics feeds.
        </p>
      </div>
      <Link
        href="/settings"
        className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-[#0a101d] border border-slate-200 dark:border-slate-900 text-xs font-bold text-slate-900 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-800 hover:text-slate-700 dark:hover:text-white transition self-start sm:self-center"
      >
        Customize Layout
      </Link>
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
    orange: "bg-orange-600/10 border-orange-500/20 text-orange-400",
    indigo: "bg-indigo-600/10 border-indigo-500/20 text-indigo-400",
    yellow: "bg-yellow-600/10 border-yellow-500/20 text-yellow-400",
    green: "bg-green-600/10 border-green-500/20 text-green-400",
  };

  const deltaToneClasses = {
    orange: "text-orange-400",
    green: "text-green-400",
  };

  return (
    <div className="p-4.5 rounded-xl bg-white dark:bg-[#090e18]/80 border border-slate-200 dark:border-slate-900 shadow-md flex items-center justify-between relative overflow-hidden">
      <div className="space-y-2">
        <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</span>
          {delta && (
            <span className={`text-[11px] font-bold flex items-center gap-0.5 ${deltaToneClasses[deltaTone]}`}>
              <TrendingUp className="h-3 w-3" />
              <span>{delta}</span>
            </span>
          )}
        </div>
        <span
          className={`text-[10px] font-semibold block ${warning ? "text-yellow-500 font-bold" : "text-slate-500"}`}
        >
          {subtitle}
        </span>
      </div>
      <div
        className={`h-11 w-11 rounded-lg border flex items-center justify-center ${iconToneClasses[iconTone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
