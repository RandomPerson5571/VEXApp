import { CheckCircle2, CircleDashed } from "lucide-react";

type IntegrationStatusBadgeProps = {
  connected: boolean;
  active?: boolean;
};

export function IntegrationStatusBadge({
  connected,
  active = true,
}: IntegrationStatusBadgeProps) {
  if (!connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
        <CircleDashed className="h-3 w-3" />
        Not connected
      </span>
    );
  }

  if (!active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Paused
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <CheckCircle2 className="h-3 w-3" />
      Connected
    </span>
  );
}
