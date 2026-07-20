"use client";

import { Bell, User } from "lucide-react";

export type SettingsSectionId = "profile" | "notifications";

const settingsItems = [
  { id: "profile" as const, label: "Profile", icon: User },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
] as const;

type SettingsSidebarProps = {
  section: SettingsSectionId;
  onSectionChange: (section: SettingsSectionId) => void;
};

export function SettingsSidebar({
  section,
  onSectionChange,
}: SettingsSidebarProps) {
  return (
    <nav className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 p-4 space-y-1 shadow-sm dark:bg-[#0a0a0a] dark:border-[#1a1a1a]">
      {settingsItems.map((item) => {
        const Icon = item.icon;
        const isActive = section === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition border ${
              isActive
                ? "bg-blue-600/10 text-blue-600 border-blue-500/10 dark:text-blue-400"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent dark:text-slate-400 dark:hover:bg-[#121212]/50 dark:hover:text-slate-200"
            }`}
          >
            <Icon
              className={`h-4.5 w-4.5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`}
            />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
