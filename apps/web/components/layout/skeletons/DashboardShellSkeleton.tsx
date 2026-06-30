import { DashboardContentSkeleton } from "@/components/layout/skeletons/DashboardContentSkeleton";
import { HeaderSkeleton } from "@/components/layout/skeletons/HeaderSkeleton";
import { SidebarSkeleton } from "@/components/layout/skeletons/SidebarSkeleton";

export function DashboardShellSkeleton() {
  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-[#03070e] text-slate-100 selection:bg-blue-600/30 selection:text-blue-200">
      <SidebarSkeleton />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <HeaderSkeleton />
        <main className="relative flex flex-1 flex-col overflow-hidden">
          <DashboardContentSkeleton />
        </main>
      </div>
    </div>
  );
}
