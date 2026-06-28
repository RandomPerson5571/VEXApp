"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ClipboardList,
  FileCode,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  Swords,
  Users2,
} from "lucide-react";
import { useOptionalUser } from "@/components/providers/UserProvider";
import { isGlobalAdmin } from "@/lib/auth/auth-guards";
import { SidebarItem } from "@/lib/types/sidebar";
import STLRoboticsLogoComponent from "../Logo";

const menuItems: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/task-list", label: "Task List", icon: ClipboardList },
  { href: "/documents", label: "Documents", icon: FileCode },
  { href: "/team-management", label: "Members", icon: Users2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const user = useOptionalUser();
  const showAdminLink = user !== null && isGlobalAdmin(user);

  return (
    <aside className="w-[240px] flex-shrink-0 bg-[#070b13] border-r border-slate-900/60 flex flex-col h-screen select-none font-sans">
      <div className="p-6 border-b border-slate-900/40 flex items-center gap-3">
        <STLRoboticsLogoComponent />
        <div className="flex flex-col">
          <span className="text-slate-100 font-black tracking-normal leading-tight text-sm uppercase">
            STL Robotics
          </span>
          <span className="text-slate-400 font-semibold tracking-wider text-[10px] uppercase leading-none">
            2026-2027 Season
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 dashboard-scroll">
        <span className="px-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-1">
          Navigation
        </span>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-normal transition-all duration-150 ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-sm shadow-blue-500/5"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-400/20 text-center scale-90">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {showAdminLink && (
        <div className="border-t border-slate-900/40 px-3 py-4">
          <Link
            href="/admin"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-normal transition-all duration-150 ${
              pathname === "/admin" || pathname.startsWith("/admin/")
                ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-sm shadow-blue-500/5"
                : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent"
            }`}
          >
            <ShieldCheck
              className={`h-4.5 w-4.5 ${
                pathname === "/admin" || pathname.startsWith("/admin/")
                  ? "text-blue-400"
                  : "text-slate-400"
              }`}
            />
            <span>Admin Panel</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
