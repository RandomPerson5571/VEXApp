import { Suspense } from "react";

import { DashboardAuthenticatedShell } from "@/components/layout/DashboardAuthenticatedShell";
import { DashboardShellSkeleton } from "@/components/layout/skeletons/DashboardShellSkeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthenticatedShell>
      <Suspense fallback={<DashboardShellSkeleton />}>{children}</Suspense>
    </DashboardAuthenticatedShell>
  );
}
