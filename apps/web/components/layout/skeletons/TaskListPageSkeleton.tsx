export function TaskListPageSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading task list"
      className="relative flex-1 overflow-y-auto bg-[#03070e] px-8 py-6 font-sans dashboard-scroll"
    >
      <div className="relative mb-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl border border-slate-900 bg-slate-950/60" />
          <div className="space-y-2">
            <div className="h-2.5 w-24 animate-pulse rounded bg-blue-600/20" />
            <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-900/80" />
          </div>
        </div>
        <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-slate-950/70" />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-xl border border-slate-900 bg-slate-950/60"
            />
          ))}
        </div>
        <div className="h-28 animate-pulse rounded-2xl border border-slate-900 bg-slate-950/60" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl border border-slate-900 bg-slate-950/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
