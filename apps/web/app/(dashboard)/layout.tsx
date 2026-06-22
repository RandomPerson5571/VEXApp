import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/Sidebar";
import { mockSummaryStats } from "@/lib/mock/dashboard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#03070e] text-slate-100 flex h-screen overflow-hidden selection:bg-blue-600/30 selection:text-blue-200">
      <AppSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-hidden flex flex-col relative">{children}</main>
      </div>
    </div>
  );
}