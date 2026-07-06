import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardAuthenticatedShell } from "@/components/layout/DashboardAuthenticatedShell";
import { isGlobalAdmin } from "@/lib/auth/auth-guards";
import { PRIVATE_LAYOUT_METADATA } from "@/lib/seo";

export const metadata: Metadata = PRIVATE_LAYOUT_METADATA;

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthenticatedShell
      beforeRender={(user) => {
        if (!isGlobalAdmin(user)) redirect("/dashboard");
      }}
    >
      {children}
    </DashboardAuthenticatedShell>
  );
}
