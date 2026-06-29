import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/Sidebar";
import { UserProvider } from "@/components/providers/UserProvider";
import { getCurrentUserState } from "@/lib/auth/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userState = await getCurrentUserState();

  if (userState.status === "unauthenticated") {
    redirect("/login");
  }

  if (userState.status === "needs_verification") {
    redirect(`/login?error=${encodeURIComponent(userState.error)}`);
  }

  if (userState.status === "needs_onboarding") {
    redirect("/onboarding");
  }

  return (
    <UserProvider value={userState.user}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#03070e] text-slate-900 dark:text-slate-100 flex h-screen overflow-hidden selection:bg-orange-600/30 selection:text-orange-200">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-hidden flex flex-col relative">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
}