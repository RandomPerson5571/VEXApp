export function DocumentsPageSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading documents"
      className="flex flex-1 overflow-hidden bg-[#03070e] font-sans"
    >
      <aside className="flex h-full w-[250px] flex-col border-r border-slate-900 bg-[#070b13] p-5">
        <div className="mb-4 h-3 w-20 animate-pulse rounded bg-slate-900/70" />
        <div className="space-y-3.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-6 animate-pulse rounded-md bg-slate-900/80" />
              <div className="ml-4 space-y-1.5 border-l border-slate-900 pl-3">
                <div className="h-5 animate-pulse rounded-md bg-slate-950/80" />
                <div className="h-5 animate-pulse rounded-md bg-slate-950/60" />
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto px-10 py-8 dashboard-scroll">
        <div className="mb-6 flex gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-slate-900/70" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-950/60" />
        </div>
        <div className="max-w-3xl space-y-6">
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-900/80" />
          <div className="h-1 w-16 animate-pulse rounded-full bg-blue-600/40" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-slate-900/70" />
              <div className="h-16 animate-pulse rounded-lg bg-slate-950/60" />
            </div>
          ))}
        </div>
      </div>

      <aside className="hidden w-[220px] border-l border-slate-900 bg-[#070b13] p-5 xl:block">
        <div className="mb-4 h-3 w-24 animate-pulse rounded bg-slate-900/70" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-4 animate-pulse rounded bg-slate-950/70"
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
