"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useAuthContext } from "@/context/AuthContext";
import { useNotificationRealtime } from "@/features/notifications/context/NotificationRealtimeContext";
import { notificationApi } from "@/features/notifications/services/notification-api";
import type { NotificationListItem, NotificationType } from "@/features/notifications/types/notification";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BellIcon,
  EnvelopeIcon,
  BoxCubeIcon,
  DollarLineIcon,
  InfoIcon,
} from "@/icons";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";

// ─── Role → allowed notification types ───────────────────────────────────────
const ROLE_ID = { ADMIN: 2, STAFF: 3, MERCHANDISE: 4 } as const;

const ROLE_ALLOWED_TYPES: Record<number, NotificationType[]> = {
  [ROLE_ID.ADMIN]: ["ORDER", "PROMOTION", "SYSTEM", "BLOG", "STOCK"],
  [ROLE_ID.STAFF]: ["ORDER", "SYSTEM"],
  [ROLE_ID.MERCHANDISE]: ["ORDER", "STOCK", "SYSTEM"],
};

const TYPE_META: Record<NotificationType, { label: string; icon: React.ReactNode; badge: string }> = {
  ORDER: { label: "Order", icon: <BoxCubeIcon className="w-6 h-6 text-blue-500   fill-current" />, badge: "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300" },
  PROMOTION: { label: "Promotion", icon: <DollarLineIcon className="w-6 h-6 text-orange-500 fill-current" />, badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  SYSTEM: { label: "System", icon: <InfoIcon className="w-6 h-6 text-purple-500 fill-current" />, badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  BLOG: { label: "Blog", icon: <EnvelopeIcon className="w-6 h-6 text-sky-500    fill-current" />, badge: "bg-sky-100    text-sky-700    dark:bg-sky-900/30    dark:text-sky-300" },
  STOCK: { label: "Product Quantity", icon: <BoxCubeIcon className="w-5 h-5 text-green-500  fill-current" />, badge: "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300" },
};

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

type Tab = "unread" | "all";

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { account } = useAuthContext();
  const { unreadCount, refreshUnread } = useNotificationRealtime();

  // Derive allowed types for current role (fallback to all if unknown role)
  const allowedTypes = useMemo<NotificationType[]>(() => {
    if (!account) return ["ORDER", "PROMOTION", "SYSTEM", "BLOG", "STOCK"];
    return ROLE_ALLOWED_TYPES[account.roleId] ?? ["ORDER", "PROMOTION", "SYSTEM", "BLOG", "STOCK"];
  }, [account]);

  const roleName = account?.roleName ?? "";
  const isAdmin = account?.roleId === ROLE_ID.ADMIN;
  const isMerch = account?.roleId === ROLE_ID.MERCHANDISE;

  const [tab, setTab] = useState<Tab>("unread");
  // Merchandise defaults to STOCK filter; others default to "all types"
  const [type, setType] = useState<string>(() =>
    account?.roleId === ROLE_ID.MERCHANDISE ? "STOCK" : ""
  );
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await notificationApi.getNotifications({
          status: tab === "unread" ? "Unread" : undefined,
          type: type || undefined,
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
  }, [tab, type, page, pageSize]);

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


  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Notification Center" />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="px-5 py-5 sm:px-6">
          {/* Header Stats & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Notifications</h3>
                {/* Role badge */}
                {roleName && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isAdmin
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                    : isMerch
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}>
                    {roleName}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                You have <span className="font-semibold text-brand-600">{unreadCount}</span> unread messages
                {!isAdmin && allowedTypes.length > 0 && (
                  <span className="ml-2 text-gray-400 dark:text-gray-500">
                    · Showing: {allowedTypes.map(t => TYPE_META[t]?.label ?? t).join(", ")}
                  </span>
                )}
              </p>
            </div>


          </div>

          {/* Tabs & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 mb-5">
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg w-fit">
              <button
                onClick={() => { setPage(1); setTab("unread"); }}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${tab === "unread"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
              >
                Unread
              </button>
              <button
                onClick={() => { setPage(1); setTab("all"); }}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${tab === "all"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
              >
                All Messages
              </button>
            </div>

            <div>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value); setPage(1); }}
                className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                {/* Only show "All Types" if the role has access to more than 1 type */}
                {allowedTypes.length > 1 && <option value="">All Types</option>}
                {allowedTypes.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_META[t]?.label ?? t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="border-t border-gray-100 dark:border-white/[0.05]">
          <div className="p-5 sm:p-6 space-y-4">
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
                    className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${item.status === "Unread"
                      ? "bg-white border-orange-100 shadow-sm hover:shadow-md dark:bg-gray-900/50 dark:border-orange-900/20"
                      : "bg-gray-50/50 border-gray-100 hover:bg-white hover:border-gray-200 dark:bg-transparent dark:border-gray-800 dark:hover:bg-gray-800/30"
                      }`}
                  >
                    {/* Status Dot */}
                    {item.status === "Unread" && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                    )}

                    {/* Icon Wrapper */}
                    <div className={`p-3 rounded-xl shrink-0 ${item.status === "Unread" ? "bg-orange-50 dark:bg-orange-900/10" : "bg-gray-100 dark:bg-gray-800"
                      }`}>
                      {TYPE_META[item.notificationType]?.icon ?? <BellIcon className="w-6 h-6 text-gray-500 fill-current" />}
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`font-semibold truncate ${item.status === "Unread" ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                          }`}>
                          {item.title}
                        </h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm line-clamp-2 leading-relaxed ${item.status === "Unread" ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"
                        }`}>
                        {item.message}
                      </p>

                      <div className="mt-3 flex items-center gap-4">
                        {/* Type badge using TYPE_META colors */}
                        {(() => {
                          const meta = TYPE_META[item.notificationType];
                          return meta ? (
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${meta.badge}`}>
                              {meta.label}
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-500">
                              {item.notificationType}
                            </span>
                          );
                        })()}

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
            {!loading && total > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    Showing {Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)} / {total} messages
                  </span>
                  <div className="flex items-center gap-2">
                    <span>Rows:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="py-1 px-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil(total / pageSize)}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
