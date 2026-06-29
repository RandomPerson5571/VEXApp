"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
  Link as LinkIcon,
  Moon,
  Sun,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { useUser } from "@/components/providers/UserProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { UserRole } from "@stlvex/database/types";

function formatRole(role: UserRole): string {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function AppHeader() {
  const { profile, team } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const displayName = `${profile.firstName} ${profile.lastName}`.trim();
  const initials = getInitials(profile.firstName, profile.lastName);
  const roleLabel = formatRole(profile.role);

  async function handleGenerateInvite() {
    if (!team) {
      setInviteStatus("error");
      setInviteMessage("Join a team to generate an invite link.");
      return;
    }

    setInviteStatus("pending");
    setInviteMessage(null);

    try {
      const response = await fetch("/api/auth/create-invite", {
        method: "POST",
      });

      const payload = (await response.json()) as { inviteId?: string; error?: string };

      if (!response.ok || !payload.inviteId) {
        throw new Error(payload.error ?? "Unable to generate invite link.");
      }

      const inviteUrl = `${window.location.origin}/join/${payload.inviteId}`;
      await navigator.clipboard.writeText(inviteUrl);

      setInviteStatus("success");
      setInviteMessage("Invite link copied to clipboard.");
    } catch (error) {
      setInviteStatus("error");
      setInviteMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate invite link.",
      );
    }
  }

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-900/60 bg-white dark:bg-[#070b13] flex items-center justify-between px-6 select-none font-sans z-30">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 shadow-sm">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-orange-600/10 border border-orange-500/20 text-orange-400">
          <ShieldCheck className="h-4.5 w-4.5" />
        </div>
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

      <div className="flex items-center gap-4">
        {/*<div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((open) => !open)}
            className="relative p-2 rounded-lg bg-slate-950 border border-slate-900/80 hover:border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-600 text-[10px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </button>

          {showNotifications && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close notifications"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#090e18] border border-slate-900 shadow-2xl z-50 p-2 text-xs">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-900 mb-1">
                  <span className="font-bold text-slate-100">Live Notifications</span>
                </div>
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {mockNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2 rounded-lg transition ${
                        notif.unread
                          ? "bg-orange-600/5 border border-orange-500/10 text-slate-200"
                          : "text-slate-400"
                      }`}
                    >
                      <p className="font-semibold text-[11px] leading-snug">{notif.text}</p>
                      <span className="text-[9px] text-slate-500 font-medium block mt-1">{notif.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div> */}

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserDropdown((open) => !open)}
            className="flex items-center gap-3.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/45 text-left cursor-pointer transition select-none"
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
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-[#090e18] border border-slate-200 dark:border-slate-900 shadow-2xl z-50 p-1.5 text-xs text-slate-900 dark:text-slate-300">
                <div className="px-2.5 py-2 border-b border-slate-200 dark:border-slate-900 mb-1">
                  <span className="font-black text-slate-900 dark:text-slate-100 block">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-500 block break-all">
                    {profile.email}
                  </span>
                </div>
                <Link
                  href="/settings"
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/60 text-slate-900 dark:text-slate-300 font-semibold"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <User className="h-4.5 w-4.5 text-slate-600 dark:text-slate-500" />
                  Personal Profile
                </Link>
                <button
                  type="button"
                  disabled={inviteStatus === "pending"}
                  onClick={handleGenerateInvite}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/60 text-slate-900 dark:text-slate-300 font-semibold text-left"
                >
                  <LinkIcon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-500" />
                  {inviteStatus === "pending" ? "Generating invite…" : "Invite"}
                </button>
                {inviteMessage ? (
                  <div className="px-2.5 py-2 text-[10px] font-semibold leading-snug text-slate-600 dark:text-slate-400">
                    {inviteMessage}
                  </div>
                ) : null}
                <Link
                  href="/members"
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/60 text-slate-900 dark:text-slate-300 font-semibold"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <SettingsIcon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-500" />
                  Team Settings
                </Link>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/60 text-slate-900 dark:text-slate-300 font-semibold"
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
