export function DashboardPageSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading dashboard"
      className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6 font-sans dashboard-scroll dark:bg-[#03070e]"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-900/80" />
          <div className="h-4 w-56 animate-pulse rounded bg-slate-100 dark:bg-slate-950/70" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-900/70" />
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-900 dark:bg-slate-950/60"
          />
        ))}
      </div>

      <div className="mb-7 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-900 dark:bg-slate-950/60 lg:col-span-6" />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-900 dark:bg-slate-950/60 lg:col-span-6" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-900 dark:bg-slate-950/60 lg:col-span-8" />
        <div className="space-y-6 lg:col-span-4">
          <div className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-900 dark:bg-slate-950/60" />
          <div className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-900 dark:bg-slate-950/60" />
        </div>
      </div>
    </div>
  );
}
