export function HeaderSkeleton() {
  return (
    <header
      aria-hidden
      className="z-30 flex h-16 select-none items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-[#1a1a1a] dark:bg-[#0a0a0a]"
    >
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 dark:border-[#1a1a1a] dark:bg-[#121212]">
        <div className="h-7 w-7 animate-pulse rounded bg-slate-200 dark:bg-[#121212]/80" />
        <div className="flex flex-col gap-1.5 pr-1">
          <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-[#121212]/80" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100 dark:bg-[#121212]/80" />
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="h-8.5 w-8.5 animate-pulse rounded-full bg-slate-200 dark:bg-[#121212]/80" />
        <div className="hidden flex-col gap-1.5 md:flex">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-[#121212]/80" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100 dark:bg-[#121212]/80" />
        </div>
      </div>
    </header>
  );
}
