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
import { campaignApi } from "../services/campaign-api";
import { Campaign, CampaignDelivery, PaginatedDeliveries } from "../types/campaign";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_VI: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  Draft: {
    label: "Nháp",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    icon: <span>📝</span>,
  },
  Scheduled: {
    label: "Chờ gửi",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    icon: <span>🕐</span>,
  },
  Sending: {
    label: "Đang gửi",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
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
    icon: <span>✅</span>,
  },
  Cancelled: {
    label: "Đã hủy",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    icon: <span>🚫</span>,
  },
};

const REFERENCE_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  VOUCHER: { label: "Voucher / Mã giảm giá", icon: "🎫" },
  PRODUCT: { label: "Sản phẩm", icon: "📦" },
  BLOG: { label: "Bài viết / Blog", icon: "📝" },
  SALE: { label: "Chương trình sale", icon: "🏷️" },
};

const TARGET_TYPE_VI: Record<string, string> = {
  ALL: "Tất cả khách hàng",
  ROLE: "Theo nhóm người dùng",
  INDIVIDUAL: "Khách hàng cụ thể",
  SEGMENT: "Theo phân khúc",
};

const DELIVERY_STATUS_TABS = [
  { id: "", label: "Tất cả" },
  { id: "Unread", label: "Chưa đọc" },
  { id: "Read", label: "Đã đọc" },
  { id: "Archived", label: "Đã click" },
];

const DELIVERY_STATUS_VI: Record<string, { label: string; color: string }> = {
  Unread: { label: "Chưa đọc", color: "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400" },
  Read: { label: "Đã đọc", color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400" },
  Archived: { label: "Đã click", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" },
  Deleted: { label: "Đã xóa", color: "text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400" },
};

// ─── Phone Notification Mockup ────────────────────────────────────────────────

const DesktopPreview: React.FC<{ campaign: Campaign }> = ({ campaign }) => {
  const title = campaign.titleOverride || "Tiêu đề thông báo";
  const message = campaign.messageOverride || "Nội dung thông báo...";
  const imageUrl = campaign.imageUrl;

  return (
    <div className="mx-auto w-full max-w-[350px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-md">
      <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-700">
        <div className="w-3.5 h-3.5 rounded-[3px] bg-brand-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[8px] font-medium">T</span>
        </div>
        <span className="text-[11px] text-zinc-500 flex-1 truncate">Toy Store</span>
        <span className="text-[10px] text-zinc-400 flex-shrink-0">bây giờ</span>
        <span className="text-[11px] text-zinc-400 ml-1 cursor-pointer flex-shrink-0">✕</span>
      </div>
      <div className="p-3 flex gap-2.5 items-start">
        <img
          src={imageUrl || "/images/logo/logo-icon.svg"}
          alt=""
          className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-white"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/images/logo/logo-icon.svg";
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-zinc-900 dark:text-zinc-100 break-words">
            {title}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1 leading-snug whitespace-pre-wrap break-words">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: number;
  total?: number;
  color: string;
  icon: string;
}> = ({ label, value, total, color, icon }) => {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={`rounded-xl p-5 border ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString("vi-VN")}</p>
      {total !== undefined && total > 0 && (
        <p className="text-xs opacity-70 mt-1">{pct}% tổng số gửi</p>
      )}
    </div>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({
  label,
  value,
  total,
  color,
}) => {
  const pct = total > 0 ? Math.min(Math.round((value / total) * 100), 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-bold text-gray-800 dark:text-white/90">{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Insight Text ─────────────────────────────────────────────────────────────

const getInsight = (readPct: number, clickPct: number): string => {
  if (readPct >= 70) {
    if (clickPct >= 30) return `${readPct}% người đã đọc thông báo này — rất xuất sắc! Tỉ lệ click ${clickPct}% cũng rất cao.`;
    return `${readPct}% người đọc — cao hơn trung bình. Cân nhắc thêm nút hành động rõ ràng hơn để tăng tỉ lệ click.`;
  }
  if (readPct >= 40) {
    if (clickPct >= 20) return `${readPct}% người đọc và ${clickPct}% đã click — kết quả khá tốt.`;
    return `${readPct}% người đọc thông báo. Tỉ lệ click còn thấp, cân nhắc điều chỉnh nội dung lần sau.`;
  }
  if (readPct > 0) return `Tỉ lệ đọc ${readPct}% còn thấp. Thử cải thiện tiêu đề để thu hút hơn.`;
  return "Chưa có dữ liệu thống kê. Kiểm tra lại sau khi chiến dịch được gửi đi.";
};

// ─── Recipients Table ─────────────────────────────────────────────────────────

const RecipientTable: React.FC<{ campaignId: number }> = ({ campaignId }) => {
  const [activeTab, setActiveTab] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<PaginatedDeliveries | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await campaignApi.getCampaignDeliveries(campaignId, currentPage, 10, activeTab || undefined);
      setData(res);
    } catch {
      setError("Chưa có dữ liệu người nhận hoặc tính năng đang được phát triển.");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, currentPage, activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  const items = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.totalCount / 10) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] overflow-hidden">
      <div className="px-5 pt-5 pb-0">
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          Danh sách người nhận
        </h3>
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 border-b border-gray-100 dark:border-white/[0.05] overflow-x-auto pb-0">
          {DELIVERY_STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-left">
                Khách hàng
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-left">
                Trạng thái
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-left">
                Thời gian đọc
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {[1, 2, 3].map((j) => (
                    <TableCell key={j} className="px-5 py-3.5">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={3} className="px-5 py-10 text-center">
                  <div className="text-gray-400 dark:text-gray-500">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="text-sm">{error}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="px-5 py-10 text-center">
                  <p className="text-sm text-gray-400">Không có người nhận trong nhóm này</p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((delivery: CampaignDelivery) => {
                const statusCfg = DELIVERY_STATUS_VI[delivery.status] ?? {
                  label: delivery.status,
                  color: "text-gray-500 bg-gray-100",
                };
                return (
                  <TableRow key={delivery.deliveryId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-600 flex-shrink-0">
                          {delivery.accountName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {delivery.accountName}
                          </p>
                          <p className="text-xs text-gray-400">{delivery.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                      {delivery.readAt ? (
                        new Date(delivery.readAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Trang {currentPage} / {totalPages} · {data?.totalCount.toLocaleString("vi-VN")} người nhận
          </span>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface CampaignDetailPageProps {
  campaignId: number;
}

export const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({ campaignId }) => {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    campaignApi
      .getCampaignById(campaignId)
      .then(setCampaign)
      .catch(() => {
        toast.error("Không thể tải thông tin chiến dịch");
        router.push("/admin/campaigns");
      })
      .finally(() => setIsLoading(false));
  }, [campaignId, router]);

  const handleCancel = async () => {
    if (!campaign) return;
    if (!confirm(`Hủy chiến dịch "${campaign.campaignName}"? Hành động này không thể hoàn tác.`)) return;
    setIsCancelling(true);
    try {
      await campaignApi.cancelCampaign(campaignId);
      toast.success("Chiến dịch đã được hủy");
      setCampaign((prev) => prev ? { ...prev, status: "Cancelled" } : prev);
    } catch {
      toast.error("Không thể hủy chiến dịch. Vui lòng thử lại.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!campaign) return null;

  const stat = campaign.stat;
  const sent = stat?.totalSent ?? 0;
  const read = stat?.totalRead ?? 0;
  const clicked = stat?.totalClicked ?? 0;
  const readPct = sent > 0 ? Math.round((read / sent) * 100) : 0;
  const clickPct = sent > 0 ? Math.round((clicked / sent) * 100) : 0;

  const statusCfg = STATUS_VI[campaign.status] ?? {
    label: campaign.status,
    bg: "bg-gray-100",
    text: "text-gray-600",
    icon: null,
  };

  const isEditable = campaign.status === "Draft" || campaign.status === "Scheduled";
  const refTypeInfo = campaign.referenceType ? REFERENCE_TYPE_LABELS[campaign.referenceType] : null;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/campaigns"
            className="mt-1 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                {campaign.campaignName}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                {statusCfg.icon}
                {statusCfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tạo ngày {new Date(campaign.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditable && (
            <>
              <Link
                href={`/admin/campaigns/${campaignId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Chỉnh sửa
              </Link>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800/50 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                {isCancelling ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                Hủy chiến dịch
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── 2-Column Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (2/5) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Campaign Info Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Thông tin chiến dịch
            </h3>
            <ul className="space-y-3">
              <InfoRow label="Trạng thái">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                  {statusCfg.icon} {statusCfg.label}
                </span>
              </InfoRow>
              <InfoRow label="Gửi cho">
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {TARGET_TYPE_VI[campaign.targetType] ?? campaign.targetType}
                </span>
              </InfoRow>
              <InfoRow label="Lịch gửi">
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {campaign.scheduledAt
                    ? new Date(campaign.scheduledAt).toLocaleString("vi-VN")
                    : campaign.status === "Sent"
                      ? "Đã gửi ngay"
                      : "Gửi ngay sau khi tạo"}
                </span>
              </InfoRow>
              <InfoRow label="Ngày tạo">
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {new Date(campaign.createdAt).toLocaleString("vi-VN")}
                </span>
              </InfoRow>
              {campaign.updatedAt && (
                <InfoRow label="Cập nhật lần cuối">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(campaign.updatedAt).toLocaleString("vi-VN")}
                  </span>
                </InfoRow>
              )}
            </ul>
          </div>

          {/* Reference Object Card */}
          {campaign.referenceType && (
            <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{refTypeInfo?.icon ?? "🔗"}</span>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {refTypeInfo?.label ?? campaign.referenceType}
                </h3>
              </div>
              {campaign.resolvedReference ? (
                <div className="space-y-3">
                  <p className="text-base font-semibold text-gray-800 dark:text-white/90">
                    {campaign.resolvedReference.displayName || "—"}
                  </p>
                  {Object.entries(campaign.resolvedReference.placeholders || {}).map(([key, val]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="text-gray-400 flex-shrink-0">
                        {key.replace(/\{\{|\}\}/g, "").replace(/([A-Z])/g, " $1").trim()}:
                      </span>
                      <span className="text-gray-800 dark:text-white/90 font-medium">{val as string}</span>
                    </div>
                  ))}
                  {campaign.resolvedReference.defaultActionTarget && (
                    <a
                      href={campaign.resolvedReference.defaultActionTarget}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 mt-1"
                    >
                      Xem chi tiết
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  {campaign.referenceType} #{campaign.referenceId}
                </p>
              )}
            </div>
          )}

          {/* Phone Preview */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 text-center">
              Xem trước thông báo
            </h3>
            <DesktopPreview campaign={campaign} />
          </div>
        </div>

        {/* Right Column (3/5) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Stats Header */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Kết quả chiến dịch
            </h3>

            {/* Big 3 numbers */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard
                label="Đã gửi"
                value={sent}
                icon="📤"
                color="border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white/90"
              />
              <StatCard
                label="Đã đọc"
                value={read}
                total={sent}
                icon="👁️"
                color="border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400"
              />
              <StatCard
                label="Đã click"
                value={clicked}
                total={sent}
                icon="👆"
                color="border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400"
              />
            </div>

            {/* Progress bars */}
            {sent > 0 && (
              <div className="space-y-4 mb-5">
                <ProgressBar label="Tỉ lệ đọc" value={read} total={sent} color="bg-green-500" />
                <ProgressBar label="Tỉ lệ click" value={clicked} total={sent} color="bg-blue-500" />
              </div>
            )}

            {/* Insight */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                💡 {getInsight(readPct, clickPct)}
              </p>
            </div>
          </div>

          {/* Targets */}
          {campaign.targets.length > 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Danh sách đích nhắm
              </h3>
              <div className="flex flex-wrap gap-2">
                {campaign.targets.map((t) => (
                  <span
                    key={t.campaignTargetId}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {t.targetValue}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recipient Table ─────────────────────────────────────────── */}
      <RecipientTable campaignId={campaignId} />
    </div>
  );
};

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <li className="flex items-start justify-between gap-4">
    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
    <div className="text-right">{children}</div>
  </li>
);
