"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderOpen,
  Library,
  BarChart3,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Users,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FolderOpen, label: "Collections", href: "/folders" },
  { icon: Library, label: "Media Library", href: "/media" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const adminItems = [
  { icon: Users, label: "User Management", href: "/admin/users" },
  { icon: History, label: "Activity History", href: "/admin/history" },
  { icon: ShieldAlert, label: "System Roles", href: "/admin/roles" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get user from localStorage safely
  const userStr =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-border flex flex-col transition-all duration-300 h-screen sticky top-0 z-40",
        isCollapsed ? "w-20" : "w-[260px]",
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 relative flex items-center justify-center group-hover:scale-110 transition-transform">
            <img
              src="/logo-v2.jpg"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <MenuItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="space-y-1.5">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Administration
              </p>
            )}
            {adminItems.map((item) => (
              <MenuItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Footer / Collapse Toggle */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center p-2 rounded-lg transition-colors text-rose-400 hover:bg-rose-500/10 hover:text-rose-300",
            isCollapsed ? "justify-center" : "gap-3 px-3",
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm font-bold">Log Out</span>}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

function MenuItem({
  item,
  isActive,
  isCollapsed,
}: {
  item: any;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
        isActive
          ? "bg-indigo-500/10 text-white"
          : "text-slate-400 hover:text-white hover:bg-white/5",
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-full" />
      )}
      <item.icon
        className={cn(
          "w-5 h-5 shrink-0 transition-colors",
          isActive ? "text-indigo-400" : "group-hover:text-white",
        )}
      />
      {!isCollapsed && (
        <span className={cn("font-medium", isActive && "font-bold")}>
          {item.label}
        </span>
      )}
    </Link>
  );
}
