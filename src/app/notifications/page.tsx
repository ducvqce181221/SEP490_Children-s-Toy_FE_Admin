"use client";

import { useNotificationRealtime } from "@/features/notifications/context/NotificationRealtimeContext";
import { notificationApi } from "@/features/notifications/services/notification-api";
import type { NotificationListItem } from "@/features/notifications/types/notification";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US");
}

type Tab = "unread" | "all";

export default function CustomerNotificationsPage() {
  const router = useRouter();
  const { refreshUnread } = useNotificationRealtime();
  const [tab, setTab] = useState<Tab>("unread");
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

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
          setItems(res.items);
          setTotal(res.total);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, page, pageSize]);

  async function handleOpen(item: NotificationListItem) {
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
      setItems(res.items);
      setTotal(res.total);
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-amber-100 bg-white/80 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
        <h1 className="text-2xl font-bold text-amber-950 dark:text-amber-50">
          Your Notifications
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Order updates, promotions, and store news.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-amber-200 bg-amber-50/50 p-0.5 dark:border-amber-900/50 dark:bg-gray-800">
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === "unread"
                  ? "bg-white text-amber-900 shadow dark:bg-amber-900/40 dark:text-amber-100"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              onClick={() => {
                setPage(1);
                setTab("unread");
              }}
            >
              Unread
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === "all"
                  ? "bg-white text-amber-900 shadow dark:bg-amber-900/40 dark:text-amber-100"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              onClick={() => {
                setPage(1);
                setTab("all");
              }}
            >
              All
            </button>
          </div>
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="text-sm font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
          >
            Mark all as read
          </button>
          <Link
            href="/admin"
            className="ml-auto text-sm text-gray-500 hover:text-amber-800 dark:text-gray-400 dark:hover:text-amber-200"
          >
            ← Back to Admin
          </Link>
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-500">Loading…</p>
      )}

      {!loading && items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-amber-200 bg-white/60 py-12 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900/40">
          No notifications found.
        </p>
      )}

      <ul className="space-y-3">
        {!loading &&
          items.map((item) => (
            <li key={item.deliveryId}>
              <button
                type="button"
                onClick={() => void handleOpen(item)}
                className={`w-full rounded-2xl border p-4 text-left transition hover:border-amber-300 hover:shadow-md dark:hover:border-amber-800 ${
                  item.status === "Unread"
                    ? "border-amber-200 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/20"
                    : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {item.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {item.notificationType} · {formatTime(item.createdAt)}
                    </p>
                  </div>
                  {item.status === "Unread" && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                  )}
                </div>
              </button>
            </li>
          ))}
      </ul>

      {!loading && total > pageSize && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="self-center text-sm text-gray-500">
            Page {page} / {Math.ceil(total / pageSize)}
          </span>
          <button
            type="button"
            disabled={page >= Math.ceil(total / pageSize)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
