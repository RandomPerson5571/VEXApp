import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { UpcomingMatch } from "@/lib/types/team";

export function UpcomingMatchesList({ matches }: { matches: UpcomingMatch[] }) {
  return (
    <div className="rounded-2xl bg-[#090e18]/80 border border-slate-900/80 p-5 shadow-md space-y-4">
      <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
        <span className="text-xs font-black text-slate-200 uppercase tracking-wider">Upcoming Matches</span>
        <Link href="/matches" className="text-[10px] font-bold text-slate-500 hover:underline">
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {matches.map((match) => (
          <div
            key={match.id}
            className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex gap-3">
              <div
                className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg border font-black text-center min-w-[45px] ${match.accentClass}`}
              >
                <span className="text-[9px] uppercase leading-none font-bold">{match.monthLabel}</span>
                <span className="text-md leading-none mt-1">{match.day}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-200">{match.title}</span>
                <span className="text-[10.5px] text-slate-500 font-semibold mt-0.5">{match.location}</span>
                <span className="text-[9.5px] text-slate-500 font-medium">{match.time}</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
