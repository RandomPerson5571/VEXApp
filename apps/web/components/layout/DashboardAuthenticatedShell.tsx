import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/Sidebar";
import { UserProvider } from "@/components/providers/UserProvider";
import { getCurrentUserState } from "@/lib/auth/current-user";

export async function DashboardAuthenticatedShell({
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
      <div className="flex h-screen min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#03070e] dark:text-slate-100 selection:bg-orange-600/30 selection:text-orange-200">
        <AppSidebar />
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="relative flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
