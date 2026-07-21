import type { ReactNode } from "react";

export function ProductMock() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] text-xs shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-[#1a1a1a] px-3 py-2">
        <span className="size-2 rounded-full bg-[#2a2a2a]" />
        <span className="size-2 rounded-full bg-[#2a2a2a]" />
        <span className="size-2 rounded-full bg-[#2a2a2a]" />
        <span className="ml-2 text-[#52525b]">Roary · Team Hub</span>
      </div>

      <div className="flex h-72 sm:h-80">
        <aside className="hidden w-36 shrink-0 border-r border-[#1a1a1a] bg-black/40 p-3 sm:block">
          <div className="mb-4 text-[10px] font-medium tracking-wide text-[#ffa800]">
            STL Robotics
          </div>
          {["Dashboard", "Calendar", "Tasks", "Knowledge", "Inventory"].map(
            (item, i) => (
              <div
                key={item}
                className={[
                  "mb-1 rounded-md px-2 py-1.5",
                  i === 0
                    ? "bg-[#121212] text-zinc-100"
                    : "text-zinc-500",
                ].join(" ")}
              >
                {item}
              </div>
            ),
          )}
        </aside>

        <div className="grid flex-1 grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-4">
          <MockPanel title="Tasks due" className="col-span-2 sm:col-span-1">
            <MockRow label="Wire intake sensors" meta="Today" accent />
            <MockRow label="Update scouting for 9927A" meta="Tomorrow" />
            <MockRow label="Inventory recount — screws" meta="Fri" />
          </MockPanel>

          <MockPanel title="Next event" className="col-span-2 sm:col-span-1">
            <div className="mt-2 text-sm font-medium text-zinc-100 sm:text-base">
              Qualifier · Regionals
            </div>
            <div className="mt-1 text-zinc-500">Sat · 8:30 AM</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#121212]">
              <div className="h-full w-2/3 rounded-full bg-[#ffa800]" />
            </div>
          </MockPanel>

          <MockPanel title="Match prep" className="col-span-2">
            <div className="mt-2 flex gap-2">
              {["9927A", "2145B", "8844C"].map((t) => (
                <span
                  key={t}
                  className="rounded border border-[#1a1a1a] bg-[#121212] px-2 py-1 text-zinc-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </MockPanel>
        </div>
      </div>
    </div>
  );
}

function MockPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-[#1a1a1a] bg-black/50 p-3 ${className}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {title}
      </div>
      {children}
    </div>
  );
}

function MockRow({
  label,
  meta,
  accent,
}: {
  label: string;
  meta: string;
  accent?: boolean;
}) {
  return (
    <div className="mt-2 flex items-center justify-between gap-2">
      <span className="truncate text-zinc-300">{label}</span>
      <span className={accent ? "text-[#ffa800]" : "text-zinc-600"}>{meta}</span>
    </div>
  );
}
