import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/layout/DashboardChrome";
import { UserProvider } from "@/components/providers/UserProvider";
import { getCurrentUserState, type CurrentUser } from "@/lib/auth/current-user";

export type AuthenticatedUser = CurrentUser;

type Props = {
  children: React.ReactNode;
  beforeRender?: (user: AuthenticatedUser) => void;
};

export async function DashboardAuthenticatedShell({
  children,
  beforeRender,
}: Props) {
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

  beforeRender?.(userState.user);

  return (
    <UserProvider value={userState.user}>
      <DashboardChrome>{children}</DashboardChrome>
    </UserProvider>
  );
}
