import Link from "next/link";
import Image from "next/image";
import RoaryIcon from "@/components/roaryicon.png";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#071023] text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">Team Dashboard</h1>
            <p className="text-sm text-slate-400">Overview of robot build status, event readiness, inventory alerts, and match analytics in one place.</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold">Customize Layout</button>
            <button className="rounded-full bg-slate-800 px-4 py-2 text-sm font-bold">Live Team View</button>
          </div>
        </header>

        {/* Top stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-slate-800 bg-[#071827]/50 p-4">
            <p className="text-xs text-slate-400 uppercase font-bold">Incomplete Tasks</p>
            <div className="mt-2 text-2xl font-extrabold">1</div>
            <p className="text-xs text-slate-500">0 completed</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#071827]/50 p-4">
            <p className="text-xs text-slate-400 uppercase font-bold">Next Event</p>
            <div className="mt-2 text-2xl font-extrabold">No upcoming events</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#071827]/50 p-4">
            <p className="text-xs text-slate-400 uppercase font-bold">Inventory Items</p>
            <div className="mt-2 text-2xl font-extrabold">0</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#071827]/50 p-4">
            <p className="text-xs text-slate-400 uppercase font-bold">Team Rank</p>
            <div className="mt-2 text-2xl font-extrabold">3rd</div>
            <p className="text-xs text-slate-500">In District & Regional</p>
          </div>
        </div>

        {/* Main grid: top two wide widgets, then large chart + calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="rounded-3xl border border-slate-800 bg-[#071827]/40 p-6">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold tracking-wide">Team Tasks</h2>
              <a className="text-sm text-amber-400">View All</a>
            </div>
            <p className="mt-2 text-sm text-slate-300">Active work across build, software, and CAD.</p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/40 px-3 py-1 text-xs font-bold">1 active</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-900/30 px-3 py-1 text-xs">1 overdue</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-900/30 px-3 py-1 text-xs">0 completed</span>
              </div>

              <div className="mt-3 rounded-lg border border-slate-900 bg-[#03111a] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-extrabold">TUNE DATTITT AUTONNN BOIOBOIBOIBO!!!</div>
                    <div className="mt-2 text-xs text-slate-400">Overdue · Jun 28, 2026</div>
                  </div>
                  <div className="space-y-2 text-right">
                    <span className="inline-flex items-center rounded-full bg-violet-900/40 px-2 py-1 text-xs">SOFTWARE</span>
                    <span className="inline-flex items-center rounded-full bg-rose-700/40 px-2 py-1 text-xs">HIGH</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#071827]/40 p-6">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold tracking-wide">Inventory Tracker</h2>
              <a className="text-sm text-amber-400">Manage Inventory</a>
            </div>
            <p className="mt-2 text-sm text-slate-300">Live stock levels across the workshop.</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#03121a] p-3 text-center">
                <div className="text-xs text-slate-400">SKUS</div>
                <div className="text-xl font-extrabold mt-2">0</div>
              </div>
              <div className="rounded-xl bg-[#03121a] p-3 text-center">
                <div className="text-xs text-slate-400">AVAILABLE</div>
                <div className="text-xl font-extrabold mt-2">0</div>
              </div>
              <div className="rounded-xl bg-[#03121a] p-3 text-center">
                <div className="text-xs text-slate-400">ALERTS</div>
                <div className="text-xl font-extrabold mt-2">0</div>
              </div>
            </div>

            <div className="mt-4">
              <input placeholder="Search parts..." className="w-full rounded-md border border-slate-900 bg-[#021218] px-3 py-2 text-sm" />
            </div>

            <div className="mt-4 rounded-lg border border-slate-900 bg-[#03111a] p-6 text-center text-slate-400">No matching parts</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-[#071827]/40 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-wide">Recent Match Performance</h2>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#02131c] px-3 py-2 text-xs">High Score<br/><span className="font-extrabold">92</span></div>
                <div className="rounded-full bg-[#02131c] px-3 py-2 text-xs">Auto Win %<br/><span className="font-extrabold">57%</span></div>
                <div className="rounded-full bg-[#02131c] px-3 py-2 text-xs">Driver Win %<br/><span className="font-extrabold">71%</span></div>
              </div>
            </div>

            <div className="mt-6">
              <svg viewBox="0 0 800 240" className="w-full h-56">
                <defs>
                  <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#071021" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="transparent" />
                <path d="M40 180 C120 120 200 160 280 120 C360 80 440 140 520 160 C600 180 680 120 760 60" fill="none" stroke="#54a0ff" strokeWidth="4" strokeLinecap="round" />
                <g fill="#54a0ff">
                  <circle cx="40" cy="180" r="3" />
                  <circle cx="120" cy="120" r="3" />
                  <circle cx="200" cy="160" r="3" />
                  <circle cx="280" cy="120" r="3" />
                  <circle cx="360" cy="80" r="3" />
                  <circle cx="440" cy="140" r="3" />
                  <circle cx="520" cy="160" r="3" />
                  <circle cx="600" cy="180" r="3" />
                  <circle cx="680" cy="120" r="3" />
                </g>
              </svg>

              <div className="mt-4 text-xs text-slate-500">Showing last 7 scouting records. <a className="text-amber-400">Manage Match Records →</a></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-[#071827]/40 p-6">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-bold tracking-wide">Team Calendar</h2>
                <a className="text-sm text-amber-400">View Calendar</a>
              </div>
              <div className="mt-4 bg-[#03111a] rounded-lg p-4">
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
                  {['S','M','T','W','T','F','S'].map((d)=> (
                    <div key={d} className="font-bold text-[10px]">{d}</div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-7 gap-2 text-center text-sm text-slate-300">
                  {Array.from({length:35}).map((_,i)=> (
                    <div key={i} className={`py-3 rounded ${i===8? 'bg-amber-800 text-black font-bold':'hover:bg-slate-900/50'}`}>{i>0? i: ''}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-[#071827]/40 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Upcoming Matches</h3>
                <a className="text-sm text-amber-400">View All</a>
              </div>
              <div className="mt-3 text-sm text-slate-400">No upcoming matches scheduled.</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
