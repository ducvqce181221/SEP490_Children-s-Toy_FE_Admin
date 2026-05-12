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

const STATUS_TABS = [
  { id: "", label: "All Status" },
  { id: "Draft", label: "Draft" },
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
    {hasFilter ? (
      <button
        onClick={onClear}
        className="text-sm text-brand-500 hover:underline font-medium"
      >
        Clear filters
      </button>
    ) : (
      <Link
        href="/admin/campaigns/new"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
      >
        <PlusIcon />
        Create your first campaign
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
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<PaginatedCampaigns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmCancelState, setConfirmCancelState] = useState<{ isOpen: boolean; campaign: CampaignListItem | null }>({ isOpen: false, campaign: null });

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
    try {
      await campaignApi.cancelCampaign(campaign.campaignId);
      toast.success("Campaign cancelled successfully");
      fetchData();
      setConfirmCancelState({ isOpen: false, campaign: null });
    } catch {
      toast.error("Failed to cancel campaign. Please try again.");
    } finally {
      setCancellingId(null);
    }
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
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

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {STATUS_TABS.map((tab) => {
              const active = activeStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatus(tab.id)}
                  className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${active
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:text-gray-300 dark:hover:bg-white/[0.02]"
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
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
                items.map((campaign, index) => (
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
                      <Link
                        href={`/admin/campaigns/${campaign.campaignId}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-brand-500 transition-colors block max-w-[220px] truncate"
                        title={campaign.campaignName}
                      >
                        {campaign.campaignName}
                      </Link>
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
                        {/* View detail — always */}
                        <Link
                          href={`/admin/campaigns/${campaign.campaignId}`}
                          className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
                          title="View details"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>

                        {/* Sent → view results */}
                        {campaign.status === "Sent" && (
                          <Link
                            href={`/admin/campaigns/${campaign.campaignId}`}
                            className="rounded-lg border border-gray-300 p-1.5 text-gray-500 transition-colors hover:border-green-400 hover:text-green-500 dark:border-gray-700 dark:text-gray-300"
                            title="View results"
                          >
                            <PieChartIcon className="w-5.7 h-5.7" />
                          </Link>
                        )}

                        {/* Draft/Scheduled → edit */}
                        {(campaign.status === "Draft" || campaign.status === "Scheduled") && (
                          <Link
                            href={`/admin/campaigns/${campaign.campaignId}/edit`}
                            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-gray-700 dark:text-gray-300"
                            title="Edit campaign"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                        )}

                        {/* Draft/Scheduled → cancel */}
                        {(campaign.status === "Draft" || campaign.status === "Scheduled") && (
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
    </div>
  );
};
