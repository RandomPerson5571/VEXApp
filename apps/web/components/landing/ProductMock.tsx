const navItems = ["Dashboard", "Calendar", "Tasks", "Knowledge", "Inventory"];

const stats = [
  { label: "Upcoming events", value: "4", meta: "Next: Jan 10", accent: true },
  { label: "Open tasks", value: "18", meta: "7 due this week" },
  { label: "Knowledge notes", value: "126", meta: "12 updated" },
];

const tasks = [
  "Finalize auton path notes",
  "Pack spare motors",
  "Review scouting questions",
];

export function ProductMock() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#050505] shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3">
        <div>
          <div className="mb-1 text-[10px] font-medium tracking-wide text-[#ffa800]">
            ROARY TEAM HUB
          </div>
          <p className="text-sm font-semibold text-zinc-100">
            Competition command center
          </p>
        </div>
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-zinc-700" />
          <span className="size-2 rounded-full bg-zinc-700" />
          <span className="size-2 rounded-full bg-[#ffa800]" />
        </div>
      </div>

      <div className="grid min-h-[420px] grid-cols-[180px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#1a1a1a] bg-black/70 p-4 sm:block">
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <div
                key={item}
                className={[
                  "rounded-md px-3 py-2 text-xs font-medium",
                  index === 0
                    ? "bg-[#ffa800]/15 text-[#ffa800]"
                    : "text-zinc-500",
                ].join(" ")}
              >
                {item}
              </div>
            ))}
          </div>
        </aside>

        <div className="p-4 sm:p-5">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-500">Dashboard</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-zinc-100">
                Season snapshot
              </h3>
            </div>
            <div className="rounded-md border border-[#ffa800]/35 bg-[#ffa800]/10 px-3 py-1.5 text-xs font-semibold text-[#ffa800]">
              Live sync
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-100">
                  Prep progress
                </p>
                <span className="text-xs text-zinc-500">72%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                <div className="h-full w-2/3 rounded-full bg-[#ffa800]" />
              </div>
              <div className="mt-5 space-y-3">
                {tasks.map((task, index) => (
                  <div
                    key={task}
                    className="flex items-center justify-between rounded-md border border-[#1a1a1a] bg-black/40 px-3 py-2"
                  >
                    <span className="text-xs font-medium text-zinc-300">
                      {task}
                    </span>
                    <span
                      className={[
                        "size-2 rounded-full",
                        index === 0 ? "bg-[#ffa800]" : "bg-zinc-700",
                      ].join(" ")}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <p className="text-sm font-semibold text-zinc-100">Next match</p>
              <div className="mt-4 rounded-md border border-[#ffa800]/25 bg-[#ffa800]/10 p-3">
                <p className="text-xs font-medium text-zinc-500">Qualifier 12</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-100">
                  11:40 AM
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Field 2 with 515R and 9640A
                </p>
              </div>
              <div className="mt-4 space-y-2">
                {["Drive team ready", "Battery checked", "Auton selected"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-xs text-zinc-400"
                    >
                      <span className="size-1.5 rounded-full bg-[#ffa800]" />
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  meta,
  accent = false,
}: {
  label: string;
  value: string;
  meta: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
      <span className={accent ? "text-[#ffa800]" : "text-zinc-600"}>{meta}</span>
    </div>
  );
}
