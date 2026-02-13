"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Upload,
  User,
  Bell,
  Command,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UploadModal from "@/components/media/UploadModal";

export default function Topbar() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
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
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Left: Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search assets, collections..."
            className="w-full bg-slate-900/50 border border-border rounded-xl py-2 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            onKeyDown={(e) => {
              if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                // Trigger global search
              }
            }}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-slate-800 text-[10px] font-medium text-slate-400">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-background"></span>
        </button>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.03] active:scale-[0.98] transition-all"
        >
          <Upload className="h-4 w-4" />
          <span>Upload</span>
        </button>

        <div className="h-8 w-px bg-border mx-2" />

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all">
              <div className="w-full h-full rounded-full border-2 border-background bg-slate-900 flex items-center justify-center overflow-hidden">
                <User className="h-5 w-5 text-slate-300" />
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

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </header>
  );
}
