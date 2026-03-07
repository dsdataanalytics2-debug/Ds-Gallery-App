"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Menu,
  Search,
  Upload,
  User,
  Bell,
  Command,
  LogOut,
  Settings as SettingsIcon,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import UploadModal from "@/components/media/UploadModal";
import NotificationDropdown from "./NotificationDropdown";
import { useSettings } from "@/components/providers/SettingsProvider";
import { SidebarContent } from "./Sidebar";

export default function Topbar() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );
  const { darkTheme, setDarkTheme } = useSettings();
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        console.error("Failed to parse user data");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
    setIsProfileOpen(false);
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Mobile: Hamburger Menu */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 md:hidden text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Left: Search Bar (Desktop) / Search Trigger (Mobile) */}
        <div className="flex-1 max-w-xl">
          <div
            className={cn("relative group md:block", !isSearchOpen && "hidden")}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search assets..."
              className="w-full bg-slate-900/50 border border-border rounded-xl py-2 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center md:hidden"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
            <div className="absolute inset-y-0 right-0 pr-3 hidden md:flex items-center pointer-events-none">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-slate-800 text-[10px] font-medium text-slate-400">
                <Command className="h-2.5 w-2.5" />
                <span>K</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className={cn(
              "md:hidden p-2 text-slate-400 hover:text-white",
              isSearchOpen && "hidden",
            )}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileOpen(false);
              }}
              className={cn(
                "p-2 rounded-lg transition-all relative group",
                isNotificationsOpen
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-slate-400 hover:text-indigo-500 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5",
              )}
            >
              <Bell
                className={cn(
                  "h-5 w-5 transition-transform",
                  isNotificationsOpen && "scale-110",
                )}
              />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-background animate-pulse"></span>
            </button>
          </div>

          <button
            onClick={() => setDarkTheme(!darkTheme)}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            title={darkTheme ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkTheme ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={() => {
              setIsUploadModalOpen(true);
              setIsNotificationsOpen(false);
              setIsProfileOpen(false);
            }}
            className="flex items-center justify-center p-2 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Upload Media</span>
          </button>

          <div className="h-8 w-px bg-border mx-1 md:mx-2" />

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all">
                <div className="w-full h-full rounded-full border-2 border-background bg-slate-900 flex items-center justify-center overflow-hidden">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-slate-300" />
                </div>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-card border border-border rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-3 border-b border-border mb-2">
                  <p className="text-sm font-bold text-white truncate">
                    {user?.name || "Premium User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.email || "admin@dsgallery.com"}
                  </p>
                </div>

                <button
                  onClick={() => {
                    router.push("/settings");
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span>Account Settings</span>
                </button>

                <div className="h-px bg-border my-2" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 inset-y-0 w-[280px] bg-sidebar border-r border-border animate-in slide-in-from-left duration-300 ease-out shadow-2xl">
            <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Global Modals & Dropdowns moved outside header to avoid stacking context issues */}
      <NotificationDropdown
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </>
  );
}
