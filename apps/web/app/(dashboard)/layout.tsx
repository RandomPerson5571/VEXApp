import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardAuthenticatedShell } from "@/components/layout/DashboardAuthenticatedShell";
import { DashboardShellSkeleton } from "@/components/layout/skeletons/DashboardShellSkeleton";
import { PRIVATE_LAYOUT_METADATA } from "@/lib/seo";

export const metadata: Metadata = PRIVATE_LAYOUT_METADATA;

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
