"use client";

import { useNotificationRealtime } from "@/features/notifications/context/NotificationRealtimeContext";
import { notificationApi } from "@/features/notifications/services/notification-api";
import { notificationHub } from "@/features/notifications/services/notification-hub";
import type { NotificationListItem } from "@/features/notifications/types/notification";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString("en-US");
}

type Variant = "admin" | "customer";

export default function NotificationDropdown({
  variant = "admin",
}: {
  variant?: Variant;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount, refreshUnread } = useNotificationRealtime();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdminChrome = variant === "admin" || pathname?.startsWith("/admin");
  const allNotificationsHref = isAdminChrome
    ? "/admin/notifications"
    : "/notifications";

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications({
        page: 1,
        pageSize: 15,
      });
      setItems(res?.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) void loadItems();
  }, [isOpen, loadItems]);

  function toggleDropdown() {
    setIsOpen((o) => !o);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function handleItemClick(item: NotificationListItem) {
    if (item.status === "Unread") {
      try {
        await notificationApi.markRead(item.deliveryId);
        await notificationHub.markAsRead(item.deliveryId);
        setItems((prev) =>
          prev.map((x) =>
            x.deliveryId === item.deliveryId
              ? { ...x, status: "Read" as const, readAt: new Date().toISOString() }
              : x,
          ),
        );
        await refreshUnread();
      } catch {
        /* axios interceptor */
      }
    }
    if (item.actionTarget) {
      try {
        void notificationApi.recordClick(item.deliveryId);
      } catch {
        /* ignore */
      }
      if (item.actionTarget.startsWith("http")) {
        window.open(item.actionTarget, "_blank", "noopener,noreferrer");
      } else {
        router.push(item.actionTarget);
      }
    }
    closeDropdown();
  }

  const ring =
    variant === "customer"
      ? "border-amber-200 bg-amber-50/90 hover:bg-amber-100/90 dark:border-amber-900/40 dark:bg-amber-950/40 dark:hover:bg-amber-900/30"
      : "border-gray-200 bg-white hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800";

  return (
    <div className="relative">
      <button
        type="button"
        className={`relative dropdown-toggle flex items-center justify-center transition-colors rounded-full h-11 w-11 ${ring} text-gray-600 dark:text-gray-300`}
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className={`absolute mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0 ${variant === "customer"
            ? "-right-[200px] border-amber-100 dark:border-amber-900/30"
            : "-right-[240px] border-gray-200"
          }`}
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h5>
          <button
            type="button"
            onClick={closeDropdown}
            className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
              />
            </svg>
          </button>
        </div>
        <ul className="custom-scrollbar flex h-auto flex-col overflow-y-auto gap-2">
          {loading && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">
              Loading…
            </li>
          )}
          {!loading && (!items || items.length === 0) && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">
              No notifications yet
            </li>
          )}
          {!loading &&
            items?.map((item) => (
              <li key={item.deliveryId}>
                <DropdownItem
                  onItemClick={() => void handleItemClick(item)}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${item.status === "Unread" ? "bg-brand-50/40 dark:bg-white/[0.02]" : ""
                    }`}
                >
                  <span className="relative z-1 block h-10 w-full max-w-10 shrink-0 overflow-hidden rounded-full">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                        {item.notificationType.slice(0, 1)}
                      </span>
                    )}
                    {item.status === "Unread" && (
                      <span className="absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-white bg-orange-500 dark:border-gray-900" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-1.5 block text-theme-sm text-gray-800 dark:text-white/90">
                      {item.title}
                    </span>
                    <span className="line-clamp-2 text-theme-sm text-gray-500 dark:text-gray-400">
                      {item.message}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                      <span>{item.notificationType}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-400" />
                      <span>{formatTime(item.createdAt)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))}
        </ul>
        <Link
          href={allNotificationsHref}
          onClick={closeDropdown}
          className={`mt-3 block rounded-lg border px-4 py-2 text-center text-sm font-medium ${variant === "customer"
              ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/40"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
        >
          View all
        </Link>
      </Dropdown>
    </div>
  );
}
