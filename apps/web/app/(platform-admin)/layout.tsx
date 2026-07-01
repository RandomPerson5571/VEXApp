import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/layout/DashboardChrome";
import { UserProvider } from "@/components/providers/UserProvider";
import { isGlobalAdmin } from "@/lib/auth/auth-guards";
import { getCurrentUserState } from "@/lib/auth/current-user";

export default async function PlatformAdminLayout({
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

  if (!isGlobalAdmin(userState.user)) {
    redirect("/dashboard");
  }

  return (
    <UserProvider value={userState.user}>
      <DashboardChrome>{children}</DashboardChrome>
    </UserProvider>
  );
}
