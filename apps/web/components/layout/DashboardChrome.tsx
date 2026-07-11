"use client";

import { useState } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/Sidebar";

type DashboardChromeProps = {
  children: React.ReactNode;
};

export function DashboardChrome({ children }: DashboardChromeProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(true);

  return (
    // ponytail: h-dvh + min-h-0 — h-screen was taller than the visual viewport and flex min-content grew the document
    <div className="flex h-dvh max-h-dvh min-h-0 overflow-hidden bg-slate-50 text-slate-900 selection:bg-orange-600/30 selection:text-orange-200 dark:bg-[#03070e] dark:text-slate-100">
      {isNavigationOpen ? (
        <AppSidebar onClose={() => setIsNavigationOpen(false)} />
      ) : null}
      <div className="flex min-h-0 h-full flex-1 flex-col overflow-hidden">
        <AppHeader
          isNavigationOpen={isNavigationOpen}
          onToggleNavigation={() => setIsNavigationOpen((open) => !open)}
        />
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
