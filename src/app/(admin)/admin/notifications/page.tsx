"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useNotificationRealtime } from "@/features/notifications/context/NotificationRealtimeContext";
import { notificationApi } from "@/features/notifications/services/notification-api";
import type { NotificationListItem } from "@/features/notifications/types/notification";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  BellIcon, 
  CheckCircleIcon, 
  TrashBinIcon, 
  EnvelopeIcon, 
  BoxCubeIcon, 
  DollarLineIcon,
  InfoIcon,
  ChevronLeftIcon,
  ChevronDownIcon
} from "@/icons";
import EmptyState from "@/components/common/EmptyState";

function formatTime(iso: string): string {
  if (!iso) return "";
  
  // Try parsing as UTC first
  let d = new Date(iso.includes("Z") || iso.includes("+") ? iso : iso + "Z");
  const now = new Date();

  // If parsing failed or result is suspiciously in the future, 
  // it might be a local time string. Try parsing without Z.
  if (isNaN(d.getTime()) || d.getTime() > now.getTime() + 60000) {
    d = new Date(iso);
  }

  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationIcon(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("order")) return <BoxCubeIcon className="w-5 h-5 text-blue-500 fill-current" />;
  if (lowerType.includes("promo") || lowerType.includes("voucher")) return <DollarLineIcon className="w-5 h-5 text-orange-500 fill-current" />;
  if (lowerType.includes("system")) return <InfoIcon className="w-5 h-5 text-purple-500 fill-current" />;
  return <BellIcon className="w-5 h-5 text-gray-500 fill-current" />;
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
    <div className="max-w-4xl mx-auto pb-10">
      <PageBreadcrumb pageTitle="Notification Center" />

      {/* Header Stats & Actions */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inbox</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            You have <span className="font-semibold text-orange-600">{unreadCount}</span> unread messages
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => void markAllRead()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <CheckCircleIcon className="w-4 h-4 fill-current" />
            Mark all as read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl w-fit">
        <button
          onClick={() => { setPage(1); setTab("unread"); }}
          className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === "unread"
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => { setPage(1); setTab("all"); }}
          className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === "all"
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          All Messages
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState 
            message="All caught up!"
            description={tab === "unread" ? "You have no unread notifications at the moment." : "Your notification inbox is empty."}
          />
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                key={item.deliveryId}
                onClick={() => void handleRowClick(item)}
                className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  item.status === "Unread"
                    ? "bg-white border-orange-100 shadow-sm hover:shadow-md dark:bg-gray-900/50 dark:border-orange-900/20"
                    : "bg-gray-50/50 border-gray-100 hover:bg-white hover:border-gray-200 dark:bg-transparent dark:border-gray-800 dark:hover:bg-gray-800/30"
                }`}
              >
                {/* Status Dot */}
                {item.status === "Unread" && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                )}

                {/* Icon Wrapper */}
                <div className={`p-3 rounded-xl shrink-0 ${
                  item.status === "Unread" ? "bg-orange-50 dark:bg-orange-900/10" : "bg-gray-100 dark:bg-gray-800"
                }`}>
                  {getNotificationIcon(item.notificationType)}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`font-semibold truncate ${
                      item.status === "Unread" ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                    }`}>
                      {item.title}
                    </h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 leading-relaxed ${
                    item.status === "Unread" ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"
                  }`}>
                    {item.message}
                  </p>
                  
                  <div className="mt-3 flex items-center gap-4">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                      item.status === "Unread" 
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" 
                        : "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                    }`}>
                      {item.notificationType}
                    </span>
                    
                    {item.actionTarget && (
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > pageSize && (
          <div className="mt-10 flex items-center justify-center gap-8">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6 fill-current rotate-0" />
            </button>
            
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Page <span className="text-gray-900 dark:text-white font-bold">{page}</span> of {Math.ceil(total / pageSize)}
            </span>

            <button
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6 fill-current rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
