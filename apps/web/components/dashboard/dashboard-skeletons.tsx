export const contentSkeletonClass =
  "animate-pulse rounded-3xl border border-slate-300 bg-slate-100 dark:border-[#1a1a1a] dark:bg-[#121212]/60";

export function SummaryStatCardSkeleton() {
  return (
    <div className="relative h-[8.75rem] w-full overflow-hidden rounded-[28px] border border-slate-300 bg-slate-100 animate-pulse dark:border-[#1a1a1a] dark:bg-[#121212]/70" />
  );
}

export function DashboardRowSkeleton({ className = "h-20" }: { className?: string }) {
  return <div className={`${contentSkeletonClass} ${className}`} />;
}
