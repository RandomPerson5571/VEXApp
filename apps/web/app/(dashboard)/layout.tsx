import type { Metadata } from "next";

import { DashboardAuthenticatedShell } from "@/components/layout/DashboardAuthenticatedShell";
import { PRIVATE_LAYOUT_METADATA } from "@/lib/seo";

export const metadata: Metadata = PRIVATE_LAYOUT_METADATA;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthenticatedShell>
      {children}
    </DashboardAuthenticatedShell>
  );
}
