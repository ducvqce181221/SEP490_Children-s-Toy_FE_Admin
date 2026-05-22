"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useAuthContext } from "@/context/AuthContext";
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
  const { isAuthenticated, isInitialized } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (pathname === "/admin/login") return;
    if (pathname.startsWith("/admin") && !isAuthenticated && !redirectingRef.current) {
      redirectingRef.current = true;
      const manualLogout = sessionStorage.getItem("admin_logout") === "1";
      if (manualLogout) {
        sessionStorage.removeItem("admin_logout");
      } else {
        toast.error("Session expired. Please log in again.");
      }
      router.replace("/admin/login");
    }
  }, [isAuthenticated, isInitialized, pathname, router]);

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
