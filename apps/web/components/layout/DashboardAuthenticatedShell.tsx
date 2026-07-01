import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/layout/DashboardChrome";
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
      <DashboardChrome>{children}</DashboardChrome>
    </UserProvider>
  );
}
