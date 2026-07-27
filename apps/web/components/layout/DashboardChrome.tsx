"use client";

import { useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/Sidebar";

type DashboardChromeProps = {
  children: React.ReactNode;
};

const DESKTOP_NAV_QUERY = "(min-width: 1024px)";

export function DashboardChrome({ children }: DashboardChromeProps) {
  // ponytail: closed on phone by default; desktop opens after matchMedia
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_NAV_QUERY);
    const sync = () => {
      const desktop = media.matches;
      setIsDesktop(desktop);
      setIsNavigationOpen(desktop);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const closeNavigation = () => setIsNavigationOpen(false);

  return (
    // ponytail: h-dvh + min-h-0 — h-screen was taller than the visual viewport and flex min-content grew the document
    <div className="flex h-dvh max-h-dvh min-h-0 overflow-hidden bg-slate-50 text-slate-900 selection:bg-orange-600/30 selection:text-orange-200 dark:bg-[#000000] dark:text-slate-100">
      {isNavigationOpen ? (
        <>
          {!isDesktop ? (
            <button
              type="button"
              aria-label="Close navigation overlay"
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
              onClick={closeNavigation}
            />
          ) : null}
          <div
            className={
              isDesktop
                ? "relative z-20 flex h-full shrink-0"
                : "fixed inset-y-0 left-0 z-50 flex h-full"
            }
          >
            <AppSidebar
              onClose={closeNavigation}
              onNavigate={isDesktop ? undefined : closeNavigation}
            />
          </div>
        </>
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
