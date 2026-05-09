"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useNotificationRealtime } from "@/features/notifications/context/NotificationRealtimeContext";
import { notificationApi } from "@/features/notifications/services/notification-api";
import type { NotificationListItem } from "@/features/notifications/types/notification";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

type Tab = "unread" | "all";

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { unreadCount, refreshUnread } = useNotificationRealtime();
  const [tab, setTab] = useState<Tab>("unread");
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await notificationApi.getNotifications({
          status: tab === "unread" ? "Unread" : undefined,
          page,
          pageSize,
        });
        if (!cancelled) {
          setItems(res?.items || []);
          setTotal(res?.total || 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, page, pageSize]);

  async function handleRowClick(item: NotificationListItem) {
    if (item.status === "Unread") {
      try {
        await notificationApi.markRead(item.deliveryId);
        await refreshUnread();
        setItems((prev) =>
          prev.map((x) =>
            x.deliveryId === item.deliveryId
              ? { ...x, status: "Read" as const, readAt: new Date().toISOString() }
              : x,
          ),
        );
      } catch {
        /* ignore */
      }
    }
    if (item.actionTarget) {
      try {
        await notificationApi.recordClick(item.deliveryId);
      } catch {
        /* ignore */
      }
      if (item.actionTarget.startsWith("http")) {
        window.open(item.actionTarget, "_blank", "noopener,noreferrer");
      } else {
        router.push(item.actionTarget);
      }
    }
  }

  async function markAllRead() {
    try {
      await notificationApi.markAllRead();
      await refreshUnread();
      const res = await notificationApi.getNotifications({
        status: tab === "unread" ? "Unread" : undefined,
        page,
        pageSize,
      });
      setItems(res?.items || []);
      setTotal(res?.total || 0);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Hộp thông báo" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Chưa đọc:
          </span>
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-sm font-semibold text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
            {unreadCount}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm ${
                tab === "unread"
                  ? "bg-gray-900 text-white dark:bg-brand-500"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              onClick={() => {
                setPage(1);
                setTab("unread");
              }}
            >
              Chưa đọc
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm ${
                tab === "all"
                  ? "bg-gray-900 text-white dark:bg-brand-500"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              onClick={() => {
                setPage(1);
                setTab("all");
              }}
            >
              Tất cả
            </button>
          </div>
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Đọc tất cả
          </button>
          <Link
            href="/notifications"
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/30"
          >
            Giao diện khách
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Trạng thái
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Loại
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Nội dung
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Đang tải…
                  </td>
                </tr>
              )}
              {!loading && (!items || items.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Không có thông báo.
                  </td>
                </tr>
              )}
              {!loading &&
                items?.map((item) => (
                  <tr
                    key={item.deliveryId}
                    className={`cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.04] ${
                      item.status === "Unread" ? "bg-brand-50/30 dark:bg-brand-500/5" : ""
                    }`}
                    onClick={() => void handleRowClick(item)}
                  >
                    <td className="px-4 py-3">
                      {item.status === "Unread" ? (
                        <span className="inline-flex items-center gap-1 text-orange-600">
                          <span className="h-2 w-2 rounded-full bg-orange-500" />
                          Mới
                        </span>
                      ) : (
                        <span className="text-gray-400">Đã đọc</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {item.notificationType}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </td>
                    <td className="max-w-md truncate px-4 py-3 text-gray-600 dark:text-gray-400">
                      {item.message}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatTime(item.createdAt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && total > pageSize && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </button>
          <span className="self-center text-sm text-gray-500">
            {page} / {Math.ceil(total / pageSize)}
          </span>
          <button
            type="button"
            disabled={page >= Math.ceil(total / pageSize)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </button>
        </div>
      )}
    </>
  );
}
