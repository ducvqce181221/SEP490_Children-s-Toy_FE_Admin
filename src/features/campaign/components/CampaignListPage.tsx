"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/common/Pagination";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";
import { campaignApi, PaginatedCampaigns } from "../services/campaign-api";
import { CampaignListItem } from "../types/campaign";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }
> = {
  Draft: {
    label: "Nháp",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-400",
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
  },
  Scheduled: {
    label: "Chờ gửi",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  Sending: {
    label: "Đang gửi",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
    icon: (
      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
  },
  Sent: {
    label: "Đã gửi",
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  Cancelled: {
    label: "Đã hủy",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

const REFERENCE_TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: string }
> = {
  VOUCHER: {
    label: "Voucher",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
    icon: "🎫",
  },
  PRODUCT: {
    label: "Sản phẩm",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    icon: "📦",
  },
  BLOG: {
    label: "Blog",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
    icon: "📝",
  },
  SALE: {
    label: "Sale",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    icon: "🏷️",
  },
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  ALL: "Tất cả KH",
  ROLE: "Theo nhóm",
  INDIVIDUAL: "Cụ thể",
  SEGMENT: "Phân khúc",
};

const STATUS_TABS = [
  { id: "", label: "Tất cả" },
  { id: "Draft", label: "Nháp" },
  { id: "Scheduled", label: "Chờ gửi" },
  { id: "Sending", label: "Đang gửi" },
  { id: "Sent", label: "Đã gửi" },
  { id: "Cancelled", label: "Đã hủy" },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

// ─── Reference Badge ─────────────────────────────────────────────────────────

const ReferenceBadge: React.FC<{ referenceType?: string | null }> = ({ referenceType }) => {
  if (!referenceType) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-gray-400 dark:text-gray-500">
        🔔 Chung
      </span>
    );
  }
  const cfg = REFERENCE_TYPE_CONFIG[referenceType];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ hasFilter: boolean; onClear: () => void }> = ({
  hasFilter,
  onClear,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-20 h-20 mb-5 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-4xl">
      📣
    </div>
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
      {hasFilter ? "Không tìm thấy chiến dịch" : "Chưa có chiến dịch nào"}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
      {hasFilter
        ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
        : "Bắt đầu bằng cách tạo chiến dịch thông báo đầu tiên để tiếp cận khách hàng của bạn."}
    </p>
    {hasFilter ? (
      <button
        onClick={onClear}
        className="text-sm text-brand-500 hover:underline font-medium"
      >
        Xóa bộ lọc
      </button>
    ) : (
      <Link
        href="/admin/campaigns/new"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
      >
        <PlusIcon />
        Tạo chiến dịch đầu tiên
      </Link>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const CampaignListPage: React.FC = () => {
  const router = useRouter();

  const [activeStatus, setActiveStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState<PaginatedCampaigns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await campaignApi.getCampaigns(
        currentPage,
        pageSize,
        "createdAt",
        true,
        searchQuery || undefined,
        activeStatus || undefined
      );
      setData(res);
    } catch {
      toast.error("Không thể tải danh sách chiến dịch");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, activeStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleCancel = async (campaign: CampaignListItem) => {
    if (
      !confirm(
        `Bạn có chắc muốn hủy chiến dịch "${campaign.campaignName}"? Hành động này không thể hoàn tác.`
      )
    )
      return;
    setCancellingId(campaign.campaignId);
    try {
      await campaignApi.cancelCampaign(campaign.campaignId);
      toast.success("Chiến dịch đã được hủy");
      fetchData();
    } catch {
      toast.error("Không thể hủy chiến dịch. Vui lòng thử lại.");
    } finally {
      setCancellingId(null);
    }
  };

  const items = data?.items ?? [];
  const totalItems = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasFilter = !!searchQuery || !!activeStatus;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Chiến dịch thông báo
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý các chiến dịch gửi thông báo đến khách hàng
          </p>
        </div>
        <Link href="/admin/campaigns/new">
          <Button variant="primary" startIcon={<PlusIcon />}>
            Tạo chiến dịch mới
          </Button>
        </Link>
      </div>

      {/* ── Main Card ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="border-b border-gray-100 dark:border-white/[0.05] px-5 pt-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
            {STATUS_TABS.map((tab) => {
              const active = activeStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatus(tab.id)}
                  className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                    active
                      ? "border-brand-500 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.05]">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên chiến dịch..."
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 dark:focus:border-brand-700"
              />
            </div>
            <button
              type="submit"
              className="px-4 h-10 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Tìm
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
                className="px-3 h-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-left">
                  Tên chiến dịch
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-left">
                  Đối tượng
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-left">
                  Gửi cho
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-left">
                  Trạng thái
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-left">
                  Lịch gửi
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-center">
                  Hành động
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      hasFilter={hasFilter}
                      onClear={() => {
                        setSearchInput("");
                        setSearchQuery("");
                        setActiveStatus("");
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((campaign) => (
                  <TableRow
                    key={campaign.campaignId}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Name */}
                    <TableCell className="px-5 py-4">
                      <Link
                        href={`/admin/campaigns/${campaign.campaignId}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-brand-500 transition-colors block max-w-[220px] truncate"
                        title={campaign.campaignName}
                      >
                        {campaign.campaignName}
                      </Link>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 block">
                        {new Date(campaign.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </TableCell>

                    {/* Reference Type */}
                    <TableCell className="px-5 py-4">
                      <ReferenceBadge referenceType={campaign.referenceType} />
                    </TableCell>

                    {/* Target */}
                    <TableCell className="px-5 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {TARGET_TYPE_LABELS[campaign.targetType] ?? campaign.targetType}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-5 py-4">
                      <StatusBadge status={campaign.status} />
                    </TableCell>

                    {/* Schedule */}
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {campaign.scheduledAt ? (
                        <span>
                          {new Date(campaign.scheduledAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* View detail — always */}
                        <Link
                          href={`/admin/campaigns/${campaign.campaignId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Xem chi tiết"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Chi tiết
                        </Link>

                        {/* Sent → view results */}
                        {campaign.status === "Sent" && (
                          <Link
                            href={`/admin/campaigns/${campaign.campaignId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Kết quả
                          </Link>
                        )}

                        {/* Draft/Scheduled → edit */}
                        {(campaign.status === "Draft" || campaign.status === "Scheduled") && (
                          <Link
                            href={`/admin/campaigns/${campaign.campaignId}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Sửa
                          </Link>
                        )}

                        {/* Draft/Scheduled → cancel */}
                        {(campaign.status === "Draft" || campaign.status === "Scheduled") && (
                          <button
                            onClick={() => handleCancel(campaign)}
                            disabled={cancellingId === campaign.campaignId}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            title="Hủy chiến dịch"
                          >
                            {cancellingId === campaign.campaignId ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            )}
                            Hủy
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Hiển thị{" "}
              <strong>{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</strong> –{" "}
              <strong>{Math.min(currentPage * pageSize, totalItems)}</strong> /{" "}
              <strong>{totalItems}</strong> chiến dịch
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
