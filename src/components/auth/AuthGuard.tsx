"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import GlobalSearch from "@/components/layout/GlobalSearch";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const hasToken = !!token;

    setIsAuthenticated(hasToken);

    if (!hasToken && pathname !== "/login") {
      router.push("/login");
    } else if (hasToken && pathname === "/login") {
      router.push("/");
    }
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // If we are on login page, show it centered (regardless of auth state, but usually when not auth)
  if (pathname === "/login") {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  // Otherwise, only show if authenticated, wrapped in admin layout
  if (isAuthenticated) {
    return (
      <div className="layout-container">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
            {children}
          </main>
        </div>
        <GlobalSearch />
      </div>
    );
  }

  return null;
}
