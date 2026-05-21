"use client";

import NotificationDropdown from "@/components/header/NotificationDropdown";
import { useAuthContext } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Khung giao diện khách (storefront-style) cho trang thông báo không có sidebar admin.
 */
export default function NotificationsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isInitialized } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated && pathname?.startsWith("/notifications")) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, isInitialized, pathname, router]);

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50/50 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
      <header className="sticky top-0 z-50 border-b border-amber-100/80 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 md:max-w-4xl">
          <Link
            href="/notifications"
            className="text-lg font-bold tracking-tight text-amber-900 dark:text-amber-100"
          >
            ToyStore
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/admin"
              className="hidden text-sm text-gray-600 hover:text-amber-800 dark:text-gray-400 dark:hover:text-amber-200 sm:inline"
            >
              Admin
            </Link>
            <NotificationDropdown variant="customer" />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-6 md:max-w-4xl">{children}</div>
    </div>
  );
}
