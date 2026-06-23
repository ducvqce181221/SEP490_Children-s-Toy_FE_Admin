"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useAuthContext } from "@/context/AuthContext";
import { getDefaultAdminPath, isAllowedAdminPath } from "@/features/auth/utils/admin-access";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { account, isAuthenticated, isInitialized } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);
  const unauthorizedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isInitialized) return;
    if (pathname === "/admin/login") return;
    if (pathname.startsWith("/admin") && !isAuthenticated && !redirectingRef.current) {
      redirectingRef.current = true;
      const manualLogout = sessionStorage.getItem("admin_logout") === "1";
      if (manualLogout) {
        sessionStorage.removeItem("admin_logout");
      } else {
        toast.error("Session expired. Please sign in again.");
      }
      const search = typeof window !== "undefined" ? window.location.search : "";
      const returnTo = encodeURIComponent(pathname + search);
      router.replace(`/admin/login?returnTo=${returnTo}`);
    }
  }, [isAuthenticated, isInitialized, pathname, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || pathname === "/admin/login") {
      unauthorizedPathRef.current = null;
      return;
    }

    if (!pathname.startsWith("/admin")) {
      return;
    }

    if (!isAllowedAdminPath(account, pathname)) {
      if (unauthorizedPathRef.current !== pathname) {
        toast.error("You do not have permission to access this page.");
        unauthorizedPathRef.current = pathname;
      }
      router.replace(getDefaultAdminPath(account));
      return;
    }

    unauthorizedPathRef.current = null;
  }, [account, isAuthenticated, isInitialized, pathname, router]);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !isAuthenticated) {
    return null;
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
