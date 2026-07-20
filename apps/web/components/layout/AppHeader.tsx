"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  Link as LinkIcon,
  Moon,
  PanelLeft,
  PanelLeftOpen,
  Settings as SettingsIcon,
  Sun,
  User,
} from "lucide-react";

import { formatRole } from "@/components/admin/admin-types";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useUser } from "@/components/providers/UserProvider";
import { getInitials } from "@/components/tasks/task-list-utils";
import VEXV5Logo from "@/public/logos/VEXV5-icon.svg";

type AppHeaderProps = {
  isNavigationOpen?: boolean;
  onToggleNavigation?: () => void;
};

export function AppHeader({
  isNavigationOpen = true,
  onToggleNavigation,
}: AppHeaderProps) {
  const { profile, team } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const displayName = `${profile.firstName} ${profile.lastName}`.trim();
  const initials = getInitials(profile.firstName, profile.lastName);
  const roleLabel = formatRole(profile.role);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] flex items-center justify-between px-6 select-none font-sans z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleNavigation}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-[#1a1a1a] dark:bg-[#121212] dark:text-slate-500 dark:hover:border-[#1a1a1a] dark:hover:bg-[#121212] dark:hover:text-slate-200"
          aria-label={isNavigationOpen ? "Close navigation panel" : "Open navigation panel"}
          title={isNavigationOpen ? "Close navigation" : "Open navigation"}
        >
          {isNavigationOpen ? (
            <PanelLeft className="h-4.5 w-4.5" />
          ) : (
            <PanelLeftOpen className="h-4.5 w-4.5" />
          )}
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#1a1a1a] shadow-sm">
          <Image src={VEXV5Logo} alt="VEX V5 Logo" width={30} height={30} />
          <div className="flex flex-col pr-1">
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none">
              {team?.name ?? "No team assigned"}
            </span>
            {team ? (
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold tracking-wide">
                Team {team.number}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserDropdown((open) => !open)}
            className="flex items-center gap-3.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121212]/45 text-left cursor-pointer transition select-none"
          >
            <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-tr from-orange-700 to-orange-800 border border-orange-500/30 font-bold text-xs text-white flex items-center justify-center uppercase shadow-md shadow-orange-500/10">
              {initials}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-black text-slate-900 dark:text-slate-200 leading-none">
                {displayName}
              </span>
              <span className="text-[9.5px] font-bold text-slate-600 dark:text-slate-500 mt-1 uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-600 dark:text-slate-500" />
          </button>

          {showUserDropdown && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close profile menu"
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 text-xs text-slate-900 dark:border-[#1a1a1a] dark:bg-[#0a0a0a] dark:bg-gradient-to-b dark:from-white/[0.02] dark:to-transparent dark:text-slate-300">
                <div className="px-2.5 py-2 border-b border-slate-200 dark:border-[#1a1a1a] mb-1">
                  <span className="font-black text-slate-900 dark:text-slate-100 block">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-500 block break-all">
                    {profile.email}
                  </span>
                </div>
                <Link
                  href="/settings/profile"
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121212] text-slate-900 dark:text-slate-300 font-semibold"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <User className="h-4.5 w-4.5 text-slate-600 dark:text-slate-500" />
                  Personal Profile
                </Link>
                <Link
                  href="/invite"
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121212] text-slate-900 dark:text-slate-300 font-semibold"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <LinkIcon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-500" />
                  Invite
                </Link>
                <Link
                  href="/members"
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121212] text-slate-900 dark:text-slate-300 font-semibold"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <SettingsIcon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-500" />
                  Team Settings
                </Link>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121212] text-slate-900 dark:text-slate-300 font-semibold"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4.5 w-4.5 text-slate-600 dark:text-slate-500" />
                  ) : (
                    <Moon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-500" />
                  )}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
                <div className="h-px bg-slate-200 dark:bg-slate-900 my-1" />
                <LogoutButton
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-red-950/20 text-red-400 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  iconClassName="h-4.5 w-4.5"
                  onSignOut={() => setShowUserDropdown(false)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
