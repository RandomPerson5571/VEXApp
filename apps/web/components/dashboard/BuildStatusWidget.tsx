import Link from "next/link";
import type { BuildStatusComponent } from "@/lib/types/team";
import { VexRobotSvg } from "@/components/graphics/VexRobot";

export function BuildStatusCard({
  components,
  robotLabel,
}: {
  components: BuildStatusComponent[];
  robotLabel: string;
}) {
  return (
    <div className="lg:col-span-7 rounded-2xl bg-[#090e18]/80 border border-slate-900/80 shadow-md p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4.5">
        <div>
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wide">Build Status</h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Mechanical and electrical integrity checks
          </p>
        </div>
        <Link href="/build-logs" className="text-[10px] font-bold text-blue-500 hover:underline">
          View Full Build Log →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center flex-1">
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative p-3 border border-slate-900/50 rounded-xl bg-slate-950/40">
          <VexRobotSvg className="w-full max-w-[170px] h-auto drop-shadow-[0_4px_12px_rgba(59,130,246,0.1)]" animated={false} />
          <div className="mt-2 text-center">
            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold font-mono tracking-widest bg-red-600/10 border border-red-500/20 text-red-400 uppercase">
              LABEL: {robotLabel}
            </span>
          </div>
        </div>

        <div className="sm:col-span-7 space-y-3.5">
          {components.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">{item.name}</span>
                <span className="font-bold text-slate-400 font-mono">{item.percentage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900/60">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${item.colorClass}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
