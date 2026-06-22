import Link from "next/link";
import type { Activity } from "@/lib/types/team";

export function RecentActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <div className="lg:col-span-5 rounded-2xl bg-[#090e18]/80 border border-slate-900/80 shadow-md p-6 flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4.5">
        <div>
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wide">Recent Activity</h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Platform audit log events</p>
        </div>
        <Link href="/scouting" className="text-[10px] font-bold text-blue-500 hover:underline">
          View All →
        </Link>
      </div>

      <div className="flex-1 space-y-4">
        {activities.slice(0, 5).map((act) => (
          <div key={act.id} className="flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <span className="h-2 w-2 rounded-full bg-slate-700 mt-1.5 flex-shrink-0" />
              <div className="flex flex-col">
                <p className="font-bold text-slate-200 leading-tight">{act.text}</p>
                {act.subtext && (
                  <span className="text-[10.5px] text-slate-500 font-semibold mt-0.5">{act.subtext}</span>
                )}
              </div>
            </div>
            <span className="text-[9.5px] text-slate-500 font-semibold flex-shrink-0">{act.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
