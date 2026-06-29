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
import { PlusIcon, EyeIcon, PencilIcon, TrashBinIcon, PieChartIcon, DocsIcon, BoxCubeIcon, PageIcon, BoltIcon, BellIcon } from "@/icons";
import SearchInput from "@/components/common/SearchInput";
import { campaignApi, PaginatedCampaigns } from "../services/campaign-api";
import { CampaignListItem } from "../types/campaign";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import { formatDisplayDate } from "@/utils/date-utils";
import { useCampaignMutations } from "../hooks/useCampaignMutations";
import { useAuthContext } from "@/context/AuthContext";
import { CampaignReviewModal } from "./CampaignReviewModal";
import {
  campaignDetailPath,
  campaignSchedulePath,
  resolveCampaignListItemId,
} from "../utils/campaign-navigation";


// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }
> = {
  Draft: {
    label: "Draft",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-400",
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
  },
  PendingApproval: {
    label: "Pending Approval",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-600 dark:text-yellow-400",
    dot: "bg-yellow-500",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  Approved: {
    label: "Approved",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  Rejected: {
    label: "Rejected",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  Scheduled: {
    label: "Scheduled",
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
    label: "Sending",
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
    label: "Sent",
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
    label: "Cancelled",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  Failed: {
    label: "Failed",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
};

const REFERENCE_TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  VOUCHER: {
    label: "Voucher",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
    icon: <DocsIcon className="w-6 h-6" />,
  },
  PRODUCT: {
    label: "Product",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    icon: <BoxCubeIcon className="w-6 h-6" />,
  },
  BLOG: {
    label: "Blog",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
    icon: <PageIcon className="w-6 h-6" />,
  },
  SALE: {
    label: "Sale",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    icon: <BoltIcon className="w-6 h-6" />,
  },
  OTHER: {
    label: "Other",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    icon: <BellIcon className="w-6 h-6" />,
  },
};
const TARGET_TYPE_LABELS: Record<string, string> = {
  ALL: "All Accounts",
  ROLE: "By Role",
  INDIVIDUAL: "Individual",
};

const selectClassName =
  "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const STATUS_TABS = [
  { id: "", label: "All Status" },
  { id: "Draft", label: "Draft" },
  { id: "PendingApproval", label: "Pending Approval" },
  { id: "Approved", label: "Approved" },
  { id: "Rejected", label: "Rejected" },
  { id: "Scheduled", label: "Scheduled" },
  { id: "Sending", label: "Sending" },
  { id: "Sent", label: "Sent" },
  { id: "Cancelled", label: "Cancelled" },
  { id: "Failed", label: "Failed" },
];

const SOURCE_TABS = [
  { id: "", label: "All Sources" },
  { id: "ADMIN", label: "Admin" },
  { id: "SYSTEM", label: "System" },
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
        <BellIcon className="w-5 h-5" /> General
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

const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const isSystem = source === "SYSTEM";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isSystem
        ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
        : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
        }`}
    >
      {isSystem ? "System" : "Admin"}
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
      {hasFilter ? "No campaigns found" : "No campaigns yet"}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
      {hasFilter
        ? "Try changing your filters or search term."
        : "Start by creating your first notification campaign to reach your customers."}
    </p>

  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const CampaignListPage: React.FC = () => {
  const router = useRouter();

  const [activeStatus, setActiveStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<PaginatedCampaigns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmCancelState, setConfirmCancelState] = useState<{ isOpen: boolean; campaign: CampaignListItem | null }>({ isOpen: false, campaign: null });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteState, setConfirmDeleteState] = useState<{ isOpen: boolean; campaign: CampaignListItem | null }>({ isOpen: false, campaign: null });
  const [submitId, setSubmitId] = useState<number | null>(null);
  const [reviewId, setReviewId] = useState<number | null>(null);

  const { account } = useAuthContext();

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
      toast.error("Failed to load campaigns");
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

  const handleCancelClick = (campaign: CampaignListItem) => {
    setConfirmCancelState({ isOpen: true, campaign });
  };

  const handleConfirmCancel = async () => {
    const campaign = confirmCancelState.campaign;
    if (!campaign) return;

    setCancellingId(campaign.campaignId);
    const ok = await cancelCampaign(campaign.campaignId);
    if (ok) {
      fetchData();
      setConfirmCancelState({ isOpen: false, campaign: null });
    }
    setCancellingId(null);
  };

  const handleDeleteClick = (campaign: CampaignListItem) => {
    setConfirmDeleteState({ isOpen: true, campaign });
  };

  const handleConfirmDelete = async () => {
    const campaign = confirmDeleteState.campaign;
    if (!campaign) return;

    setDeletingId(campaign.campaignId);
    const ok = await deleteCampaign(campaign.campaignId);
    if (ok) {
      fetchData();
      setConfirmDeleteState({ isOpen: false, campaign: null });
    }
    setDeletingId(null);
  };

  const { submitCampaign, reviewCampaign, cancelCampaign, deleteCampaign, isSubmitting } =
    useCampaignMutations(() => {
      fetchData();
      setSubmitId(null);
      setReviewId(null);
    });

  const handleConfirmSubmit = async () => {
    if (submitId) {
      await submitCampaign(submitId);
    }
  };

  const handleApprove = async (): Promise<boolean> => {
    if (!reviewId) return false;
    const result = await reviewCampaign(reviewId, { action: "Approved" });
    return result.success;
  };

  const handleReject = async (reason: string): Promise<{ ok: boolean; reviewNoteError?: string }> => {
    if (!reviewId) return { ok: false };
    const result = await reviewCampaign(reviewId, { action: "Rejected", reviewNote: reason });
    return { ok: result.success, reviewNoteError: result.reviewNoteError };
  };

  const items = data?.items ?? [];
  const totalItems = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasFilter = !!searchQuery || !!activeStatus;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Campaigns
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your notification campaigns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/campaigns/new">
              <Button variant="primary" startIcon={<PlusIcon />}>
                Create Campaign
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchQuery(searchInput);
                }
              }}
              placeholder="Search by name... (Press Enter)"
            />
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:justify-end">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  className={`${selectClassName} w-full sm:w-44`}
                  value={activeStatus}
                  onChange={(e) => setActiveStatus(e.target.value)}
                >
                  {STATUS_TABS.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  #
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Campaign Name
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Reference Type
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Source
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Target Audience
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Scheduled For
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
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
                items.map((campaign, index) => {
                  const isAdmin = account?.roleName?.toLowerCase() === "admin" || account?.roleId === 2;
                  const isOwner = account?.accountId != null && campaign.createdByAccountId === account.accountId;
                  const isOwnerOrAdmin = isAdmin || isOwner;

                  return (
                    <TableRow
                      key={campaign.campaignId}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* STT */}
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>

                      {/* Name */}
                      <TableCell className="px-5 py-4">
                        {(() => {
                          const cid = resolveCampaignListItemId(campaign);
                          return cid != null ? (
                            <Link
                              href={campaignDetailPath(cid)}
                              className="font-medium text-gray-900 dark:text-white hover:text-brand-500 transition-colors block max-w-[220px] truncate"
                              title={campaign.campaignName}
                            >
                              {campaign.campaignName}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-900 dark:text-white block max-w-[220px] truncate" title={campaign.campaignName}>
                              {campaign.campaignName}
                            </span>
                          );
                        })()}
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 block">
                          {formatDisplayDate(campaign.createdAt)}
                        </span>
                      </TableCell>

                      {/* Reference Type */}
                      <TableCell className="px-5 py-4">
                        <ReferenceBadge referenceType={campaign.referenceType} />
                      </TableCell>

                      {/* Source */}
                      <TableCell className="px-5 py-4">
                        <SourceBadge source={campaign.sourceType} />
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
                        {formatDisplayDate(campaign.scheduledAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Submit button (for Draft) */}
                          {(campaign.status === "Draft" || campaign.status === "Rejected") &&
                            !isAdmin &&
                            isOwnerOrAdmin && (
                              <button
                                title={campaign.status === "Rejected" ? "Nộp lại để duyệt" : "Nộp để duyệt"}
                                onClick={() => setSubmitId(campaign.campaignId)}
                                className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-green-400 hover:text-green-500 dark:border-gray-700 dark:text-gray-300"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}

                          {/* Review button (for PendingApproval - Admin only) */}
                          {campaign.status === "PendingApproval" && isAdmin && (
                            <button
                              type="button"
                              title="Review campaign"
                              onClick={() => setReviewId(campaign.campaignId)}
                              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-amber-400 hover:text-amber-600 dark:border-gray-700 dark:text-gray-300"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                />
                              </svg>
                            </button>
                          )}

                          {/* Schedule button (for Approved) */}
                          {campaign.status === "Approved" && isOwnerOrAdmin && (
                            <button
                              type="button"
                              title="Schedule Campaign"
                              onClick={() => {
                                const cid = resolveCampaignListItemId(campaign);
                                if (cid != null) router.push(campaignSchedulePath(cid, "schedule"));
                              }}
                              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-purple-400 hover:text-purple-500 dark:border-gray-700 dark:text-gray-300"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}

                          {/* Reschedule button (for Scheduled) */}
                          {campaign.status === "Scheduled" &&
                            isOwnerOrAdmin &&
                            (campaign.maxRescheduleCount == null ||
                              (campaign.rescheduleCount ?? 0) < campaign.maxRescheduleCount) && (
                              <button
                                title="Reschedule"
                                type="button"
                                onClick={() => {
                                  const cid = resolveCampaignListItemId(campaign);
                                  if (cid != null) router.push(campaignSchedulePath(cid, "reschedule"));
                                }}
                                className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-purple-400 hover:text-purple-500 dark:border-gray-700 dark:text-gray-300"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}

                          {/* View detail — always */}
                          <button
                            type="button"
                            title="View details"
                            disabled={resolveCampaignListItemId(campaign) == null}
                            onClick={() => {
                              const cid = resolveCampaignListItemId(campaign);
                              if (cid != null) router.push(campaignDetailPath(cid));
                            }}
                            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:pointer-events-none"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>

                          {/* Draft/Rejected → edit */}
                          {(campaign.status === "Draft" || campaign.status === "Rejected") && isOwnerOrAdmin && (
                            <button
                              type="button"
                              title="Edit campaign"
                              disabled={resolveCampaignListItemId(campaign) == null}
                              onClick={() => {
                                const cid = resolveCampaignListItemId(campaign);
                                if (cid != null) router.push(`${campaignDetailPath(cid)}/edit`);
                              }}
                              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:pointer-events-none"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                          )}

                          {/* Draft/Approved/Scheduled → cancel */}
                          {["Draft", "Approved", "Scheduled"].includes(campaign.status) && isOwnerOrAdmin && (
                            <button
                              onClick={() => handleCancelClick(campaign)}
                              disabled={cancellingId === campaign.campaignId}
                              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-error-400 hover:text-error-500 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                              title="Cancel campaign"
                            >
                              {cancellingId === campaign.campaignId ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Sent/Cancelled/Failed → delete */}
                          {["Sent", "Cancelled", "Failed"].includes(campaign.status) && isOwnerOrAdmin && (
                            <button
                              onClick={() => handleDeleteClick(campaign)}
                              disabled={deletingId === campaign.campaignId}
                              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-red-400 hover:text-red-500 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                              title="Delete campaign"
                            >
                              {deletingId === campaign.campaignId ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <TrashBinIcon className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} - {Math.min(currentPage * pageSize, totalItems)} / {totalItems} campaigns
              </span>
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="py-1 px-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmCancelState.isOpen}
        onClose={() => setConfirmCancelState({ isOpen: false, campaign: null })}
        onConfirm={handleConfirmCancel}
        title="Cancel Campaign"
        message={`Are you sure you want to cancel campaign "${confirmCancelState.campaign?.campaignName}"? This action cannot be undone.`}
        confirmText="Cancel Campaign"
        isDestructive={true}
        isLoading={cancellingId !== null}
      />

      <ConfirmModal
        isOpen={confirmDeleteState.isOpen}
        onClose={() => setConfirmDeleteState({ isOpen: false, campaign: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Campaign"
        message={`Are you sure you want to delete campaign "${confirmDeleteState.campaign?.campaignName}"? This action is permanent and cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deletingId !== null}
      />

      <ConfirmModal
        isOpen={submitId !== null}
        onClose={() => setSubmitId(null)}
        onConfirm={handleConfirmSubmit}
        title="Submit for Approval"
        message="Are you sure you want to submit this campaign for Admin approval? Once submitted, you will not be able to edit it until it has been reviewed."
        confirmText="Submit"
        isDestructive={false}
        isLoading={isSubmitting}
      />

      <CampaignReviewModal
        isOpen={reviewId !== null}
        onClose={() => setReviewId(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
