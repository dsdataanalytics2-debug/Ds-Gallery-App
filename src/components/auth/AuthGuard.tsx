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
    const storedUser = localStorage.getItem("user");

    if (!token) {
      if (pathname !== "/login") {
        router.push("/login");
      }
      // No token + on /login: just stay, login page renders below
      return;
    }

    if (token && pathname === "/login") {
      router.push("/");
      return;
    }

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (pathname.startsWith("/admin") && user.role !== "admin") {
          router.push("/");
        } else {
          setIsAuthenticated(true);
        }
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      }
    } else {
      setIsAuthenticated(true); // token exists but no user object
    }
  }, [pathname, router]);

  // Show login page immediately — no need to wait for auth state
  if (pathname === "/login") {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  // Show spinner while checking auth for protected routes
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
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
