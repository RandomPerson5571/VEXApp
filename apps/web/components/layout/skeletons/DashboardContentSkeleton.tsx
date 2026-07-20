export function DashboardContentSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading page content"
      className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6 dashboard-scroll dark:bg-[#000000]"
    >
      <div className="mb-6 space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-[#121212]/80" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-100 dark:bg-[#121212]/70" />
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#121212]/60"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#121212]/60 lg:col-span-8" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#121212]/60 lg:col-span-4" />
      </div>
    </div>
  );
}
