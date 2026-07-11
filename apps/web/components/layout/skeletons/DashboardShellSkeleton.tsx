import { DashboardContentSkeleton } from "@/components/layout/skeletons/DashboardContentSkeleton";
import { HeaderSkeleton } from "@/components/layout/skeletons/HeaderSkeleton";
import { SidebarSkeleton } from "@/components/layout/skeletons/SidebarSkeleton";

export function DashboardShellSkeleton() {
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#03070e] dark:text-slate-100 selection:bg-orange-600/30 selection:text-orange-200">
      <SidebarSkeleton />
      <div className="flex min-h-0 h-full flex-1 flex-col overflow-hidden">
        <HeaderSkeleton />
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <DashboardContentSkeleton />
        </main>
      </div>
    </div>
  );
}
