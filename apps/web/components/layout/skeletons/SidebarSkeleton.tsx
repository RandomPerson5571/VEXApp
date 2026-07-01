export function SidebarSkeleton() {
  return (
    <aside
      aria-hidden
      className="flex h-screen w-[240px] flex-shrink-0 flex-col border-r border-slate-200 bg-white select-none dark:border-slate-900/60 dark:bg-[#070b13]"
    >
      <div className="flex items-center gap-3 border-b border-slate-200 p-6 dark:border-slate-900/40">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-900/80" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-900/80" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-950/80" />
        </div>
      </div>

      <div className="flex-1 space-y-1.5 overflow-hidden px-3 py-4">
        <div className="mx-3 mb-2 h-2.5 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-900/60" />
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900/50"
          />
        ))}
      </div>
    </aside>
  );
}
