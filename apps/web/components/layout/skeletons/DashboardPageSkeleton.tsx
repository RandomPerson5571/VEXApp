import {
  DashboardRowSkeleton,
  SummaryStatCardSkeleton,
} from "@/components/dashboard/dashboard-skeletons";

export function DashboardPageSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading dashboard"
      className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-6 py-6 font-sans text-slate-900 dashboard-scroll dark:bg-[#000000] dark:text-slate-100"
    >
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <header className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-[#121212]/80" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-100 dark:bg-[#121212]/70" />
        </header>

        <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SummaryStatCardSkeleton key={index} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <DashboardRowSkeleton key={index} className="h-[88px]" />
            ))}
          </div>
          <div className="space-y-6">
            <DashboardRowSkeleton className="h-72" />
            {Array.from({ length: 3 }).map((_, index) => (
              <DashboardRowSkeleton key={index} className="h-[72px]" />
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
          <DashboardRowSkeleton className="h-[320px]" />
        </div>
      </div>
    </div>
  );
}
