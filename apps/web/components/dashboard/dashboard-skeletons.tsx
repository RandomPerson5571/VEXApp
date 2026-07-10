export const contentSkeletonClass =
  "animate-pulse rounded-3xl border border-slate-300 bg-slate-100 dark:border-white/10 dark:bg-slate-950/60";

export function SummaryStatCardSkeleton() {
  return (
    <div className="relative h-[8.75rem] w-full overflow-hidden rounded-[28px] border border-slate-300 bg-slate-100 animate-pulse dark:border-white/10 dark:bg-slate-950/70" />
  );
}

export function DashboardRowSkeleton({ className = "h-20" }: { className?: string }) {
  return <div className={`${contentSkeletonClass} ${className}`} />;
}
