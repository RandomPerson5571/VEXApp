"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Link as LinkIcon, User } from "lucide-react";

const settingsItems = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/integrations", label: "Integrations", icon: LinkIcon },
] as const;

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 p-4 space-y-1 shadow-sm dark:bg-[#090e18]/80 dark:border-slate-900 dark:shadow-none">
      {settingsItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition border ${
              isActive
                ? "bg-blue-600/10 text-blue-600 border-blue-500/10 dark:text-blue-400"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-slate-200"
            }`}
          >
            <Icon
              className={`h-4.5 w-4.5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
