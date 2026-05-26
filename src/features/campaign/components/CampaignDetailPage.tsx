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
import { campaignApi, audienceApi } from "../services/campaign-api";
import { accountApi } from "@/features/account/services/account-api";
import { Campaign, CampaignDelivery, PaginatedDeliveries, RoleItem } from "../types/campaign";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import { useAuthContext } from "@/context/AuthContext";
import { useCampaignMutations } from "../hooks/useCampaignMutations";
import { CampaignReviewModal } from "./CampaignReviewModal";
import { CampaignReferenceCardFromCampaign } from "./CampaignReferenceCard";
import { campaignSchedulePath } from "../utils/campaign-navigation";
import { formatDisplayDate } from "@/utils/date-utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_DISPLAY: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  Draft: {
    label: "Draft",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
  },
  PendingApproval: {
    label: "Pending Approval",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-600 dark:text-yellow-400",
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
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  Sending: {
    label: "Sending",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
    icon: (
      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
  },
  Sent: {
    label: "Sent",
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  Cancelled: {
    label: "Cancelled",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  Failed: {
    label: "Failed",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  ALL: "All Accounts",
  ROLE: "By User Group",
  INDIVIDUAL: "Specific Customers",
};

const DELIVERY_STATUS_TABS = [
  { id: "", label: "All" },
  { id: "Unread", label: "Unread" },
  { id: "Read", label: "Read" },
];

const DELIVERY_STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  Unread: { label: "Unread", color: "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400" },
  Read: { label: "Read", color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400" },
  Archived: { label: "Archived", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" },
  Deleted: { label: "Deleted", color: "text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400" },
};

// ─── Phone Notification Mockup ────────────────────────────────────────────────

const DesktopPreview: React.FC<{ campaign: Campaign }> = ({ campaign }) => {
  let title = campaign.resolvedTitle || campaign.titleOverride || "Notification Title";
  let message = campaign.resolvedMessage || campaign.messageOverride || "Notification content...";

  if (campaign.resolvedReference?.placeholders) {
    Object.entries(campaign.resolvedReference.placeholders).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
      title = title.replace(regex, value);
      message = message.replace(regex, value);
    });
  }

  const imageUrl = campaign.imageUrl;

  return (
    <div className="mx-auto w-full max-w-[350px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-md">
      <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-700">
        <div className="w-3.5 h-3.5 rounded-[3px] bg-brand-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[8px] font-medium">T</span>
        </div>
        <span className="text-[11px] text-zinc-500 flex-1 truncate">Toy Store</span>
        <span className="text-[10px] text-zinc-400 flex-shrink-0">now</span>
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
  icon: React.ReactNode;
}> = ({ label, value, total, color, icon }) => {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={`rounded-xl p-5 border ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString("en-US")}</p>
      {total !== undefined && total > 0 && (
        <p className="text-xs opacity-70 mt-1">{pct}% total sent</p>
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
      setError("No recipient data available or feature is under development.");
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
          Recipient List
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
                Customer
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-left">
                Status
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-left">
                Read Time
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
                  <p className="text-sm text-gray-400">No recipients in this group</p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((delivery: CampaignDelivery) => {
                const statusCfg = DELIVERY_STATUS_DISPLAY[delivery.status] ?? {
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
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        {delivery.isClicked && (
                          <span title="User clicked on this notification" className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                      {delivery.readAt ? (
                        formatDisplayDate(delivery.readAt)
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
            Page {currentPage} / {totalPages} · {data?.totalCount.toLocaleString("en-US")} recipients
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
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [accountLabelById, setAccountLabelById] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [submitId, setSubmitId] = useState<number | null>(null);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const { account } = useAuthContext();

  const fetchCampaignDetail = useCallback(() => {
    setIsLoading(true);
    campaignApi
      .getCampaignById(campaignId)
      .then(setCampaign)
      .catch(() => {
        toast.error("Cannot load campaign information");
        router.push("/admin/campaigns");
      })
      .finally(() => setIsLoading(false));
  }, [campaignId, router]);

  useEffect(() => {
    audienceApi.getRoles().then(setRoles).catch(() => { });
  }, []);

  useEffect(() => {
    if (!campaign?.targets?.length) {
      setAccountLabelById({});
      return;
    }
    const ids = [
      ...new Set(
        campaign.targets
          .filter((t) => t.targetType === "ACCOUNT_ID")
          .map((t) => parseInt(t.targetValue, 10))
          .filter((id) => !Number.isNaN(id) && id > 0),
      ),
    ];
    if (ids.length === 0) {
      setAccountLabelById({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const updates: Record<number, string> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const acc = await accountApi.getAccountById(id);
            updates[id] = acc.email?.trim() || acc.accountName || `Account #${id}`;
          } catch {
            updates[id] = `Account #${id}`;
          }
        }),
      );
      if (!cancelled) setAccountLabelById(updates);
    })();
    return () => {
      cancelled = true;
    };
  }, [campaign?.campaignId, campaign?.targets]);

  useEffect(() => {
    fetchCampaignDetail();
  }, [fetchCampaignDetail]);

  const { submitCampaign, reviewCampaign, recallCampaign, isSubmitting } = useCampaignMutations(() => {
    fetchCampaignDetail();
    setSubmitId(null);
    setReviewId(null);
    setReviewAction(null);
  });

  const handleConfirmSubmit = async () => {
    if (submitId) {
      await submitCampaign(submitId);
    }
  };

  const handleApprove = async () => {
    if (reviewId) {
      await reviewCampaign(reviewId, { action: "Approved" });
    }
  };

  const handleReject = async (reason: string) => {
    if (reviewId) {
      await reviewCampaign(reviewId, { action: "Rejected", reviewNote: reason });
    }
  };

  const handleCancelClick = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!campaign) return;
    setIsCancelling(true);
    try {
      await campaignApi.cancelCampaign(campaignId);
      toast.success("Campaign has been cancelled");
      setCampaign((prev) => prev ? { ...prev, status: "Cancelled" } : prev);
      setIsConfirmModalOpen(false);
    } catch {
      toast.error("Cannot cancel campaign. Please try again.");
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

  const statusCfg = STATUS_DISPLAY[campaign.status] ?? {
    label: campaign.status,
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    icon: null,
  };

  const isEditable = campaign.status === "Draft" || campaign.status === "Rejected";

  const getTargetValueDisplay = (target: { targetType: string; targetValue: string }) => {
    if (target.targetType === "ROLE_ID") {
      const role = roles.find((r) => String(r.roleId) === target.targetValue);
      return role ? role.roleName : `Role ID: ${target.targetValue}`;
    }
    if (target.targetType === "ACCOUNT_ID") {
      const id = parseInt(target.targetValue, 10);
      if (!Number.isNaN(id) && id > 0) {
        const label = accountLabelById[id];
        if (label) return label;
        return `Account #${id}`;
      }
    }
    return target.targetValue;
  };

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
              Created on {formatDisplayDate(campaign.createdAt)} by <span className="font-medium text-gray-700 dark:text-gray-300">{campaign.createdByAccountName || "System"}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(campaign.status === "Draft" || campaign.status === "Rejected") && (
            <button
              title={campaign.status === "Rejected" ? "Re-submit for Review" : "Submit for Review"}
              onClick={() => setSubmitId(campaign.campaignId)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800/50 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {campaign.status === "Rejected" ? "Re-submit" : "Submit"}
            </button>
          )}

          {campaign.status === "PendingApproval" &&
            campaign.submittedByAccountId != null &&
            account?.accountId === campaign.submittedByAccountId && (
              <button
                type="button"
                title="Recall — move back to Draft"
                onClick={() => void recallCampaign(campaign.campaignId)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50 text-sm font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Recall
              </button>
            )}

          {campaign.status === "PendingApproval" && account?.roleName?.toLowerCase() === "admin" && (
            <>
              <button
                title="Approve Campaign"
                onClick={() => { setReviewId(campaign.campaignId); setReviewAction("approve"); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </button>
              <button
                title="Reject Campaign"
                onClick={() => { setReviewId(campaign.campaignId); setReviewAction("reject"); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </button>
            </>
          )}

          {campaign.status === "Scheduled" &&
            (campaign.maxRescheduleCount == null ||
              (campaign.rescheduleCount ?? 0) < campaign.maxRescheduleCount) && (
              <Link
                href={campaignSchedulePath(campaignId, "reschedule")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-800/50 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reschedule
              </Link>
            )}

          {campaign.status === "Approved" && (
            <Link
              href={campaignSchedulePath(campaignId, "schedule")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule
            </Link>
          )}

          {isEditable && (
            <>
              <Link
                href={`/admin/campaigns/${campaignId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
            </>
          )}

          {["Draft", "Approved", "Scheduled"].includes(campaign.status) && (
            <button
              onClick={handleCancelClick}
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
              Cancel Campaign
            </button>
          )}
        </div>
      </div>

      {/* ── Campaign Results (Top Level) ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          Campaign Results
        </h3>

        {/* Big 3 numbers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Sent"
            value={sent}
            icon={
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            }
            color="border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white/90"
          />
          <StatCard
            label="Read"
            value={read}
            total={sent}
            icon={
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
            color="border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400"
          />
          <StatCard
            label="Clicked"
            value={clicked}
            total={sent}
            icon={
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            }
            color="border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400"
          />
        </div>

      </div>

      {/* ── 4-8 Layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Metadata */}
        <div className={campaign.referenceType ? "lg:col-span-4 space-y-5" : "lg:col-span-4 space-y-5"}>
          {/* Campaign Information Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Campaign Information
            </h3>
            <ul className="space-y-3">
              <InfoRow label="Status">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                  {statusCfg.icon} {statusCfg.label}
                </span>
              </InfoRow>
              <InfoRow label="Send to">
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {TARGET_TYPE_LABELS[campaign.targetType] ?? campaign.targetType}
                  {campaign.targetType === "ROLE" && campaign.targets[0] && (
                    <span className="ml-1 text-gray-500 font-normal">
                      ({getTargetValueDisplay(campaign.targets[0])})
                    </span>
                  )}
                </span>
              </InfoRow>
              <InfoRow label="Schedule">
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {campaign.scheduledAt
                    ? formatDisplayDate(campaign.scheduledAt)
                    : campaign.status === "Sent"
                      ? "Sent"
                      : "Not scheduled"}
                </span>
              </InfoRow>
              {(campaign.validFrom || campaign.validTo) && (
                <InfoRow label="Valid from / to">
                  <span className="text-sm text-gray-800 dark:text-white/90">
                    {campaign.validFrom ? formatDisplayDate(campaign.validFrom) : "—"}
                    {" → "}
                    {campaign.validTo ? formatDisplayDate(campaign.validTo) : "—"}
                  </span>
                </InfoRow>
              )}
              {campaign.approvedExpireAt &&
                (campaign.status === "Approved" || campaign.status === "Scheduled") && (
                  <InfoRow label="Approval expires">
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      {formatDisplayDate(campaign.approvedExpireAt)}
                    </span>
                  </InfoRow>
                )}
              {campaign.status === "Scheduled" && campaign.maxRescheduleCount != null && (
                <InfoRow label="Reschedules">
                  <span className="text-sm text-gray-800 dark:text-white/90">
                    {campaign.rescheduleCount ?? 0} / {campaign.maxRescheduleCount}
                  </span>
                </InfoRow>
              )}
              <InfoRow label="Created Date">
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {formatDisplayDate(campaign.createdAt)}
                </span>
              </InfoRow>
              {campaign.submittedByAccountName && (
                <InfoRow label="Submitted By">
                  <span className="text-sm text-gray-800 dark:text-white/90">
                    {campaign.submittedByAccountName}
                  </span>
                </InfoRow>
              )}
              {campaign.reviewedByAccountName && (
                <InfoRow label="Reviewed By">
                  <span className="text-sm text-gray-800 dark:text-white/90">
                    {campaign.reviewedByAccountName}
                  </span>
                </InfoRow>
              )}
              {campaign.updatedAt && (
                <InfoRow label="Last Updated">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDisplayDate(campaign.updatedAt)}
                  </span>
                </InfoRow>
              )}

              {/* Approval Info Section */}
              {(campaign.submittedAt || campaign.reviewedAt) && (
                <>
                  <details className="pt-3 mt-3 border-t border-gray-100 dark:border-white/[0.05] group">
                    <summary className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex justify-between items-center cursor-pointer list-none [&::-webkit-details-marker]:hidden outline-none">
                      Approval Audit
                      <span className="text-brand-500 normal-case font-medium tracking-normal group-open:hidden">
                        Show details
                      </span>
                      <span className="text-brand-500 normal-case font-medium tracking-normal hidden group-open:block">
                        Hide details
                      </span>
                    </summary>
                    <ul className="space-y-3 pt-4">
                      {campaign.submittedAt && (
                        <InfoRow label="Submitted At">
                          <span className="text-sm text-gray-800 dark:text-white/90">
                            {formatDisplayDate(campaign.submittedAt)}
                          </span>
                        </InfoRow>
                      )}
                      {campaign.reviewedAt && (
                        <InfoRow label="Reviewed At">
                          <span className="text-sm text-gray-800 dark:text-white/90">
                            {formatDisplayDate(campaign.reviewedAt)}
                          </span>
                        </InfoRow>
                      )}
                      {campaign.reviewNote && (
                        <InfoRow label="Review Note">
                          <span className="text-sm text-red-600 dark:text-red-400 italic bg-red-50 dark:bg-red-900/10 p-2 rounded block">
                            {campaign.reviewNote}
                          </span>
                        </InfoRow>
                      )}
                    </ul>
                  </details>
                </>
              )}
            </ul>
          </div>



        </div>

        {/* Column 2: Reference Card */}
        <div className="lg:col-span-8 space-y-6">
          {campaign.referenceType && (
            <CampaignReferenceCardFromCampaign campaign={campaign} />
          )}

          {(!campaign.referenceType || campaign.referenceType === "BLOG") && (
            <details
              className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5 group cursor-pointer shadow-sm transition-all duration-200 hover:shadow-md"
              open={!campaign.referenceType}
            >
              <summary className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex justify-between items-center list-none [&::-webkit-details-marker]:hidden outline-none">
                Notification Preview
                <span className="text-brand-500 text-xs normal-case font-medium tracking-normal group-open:hidden">
                  Show preview
                </span>
                <span className="text-brand-500 text-xs normal-case font-medium tracking-normal hidden group-open:block">
                  Hide preview
                </span>
              </summary>
              <div className="pt-6 pb-2 flex justify-center cursor-default">
                <DesktopPreview campaign={campaign} />
              </div>
            </details>
          )}
        </div>
      </div>

      {/* ── Full Width Section (12 columns) ────────────────────────── */}
      <div className="mt-6 space-y-6 pb-10">
        {/* Notification Preview (Accordion Option for Non-Blog/Non-General) */}
        {campaign.referenceType && campaign.referenceType !== "BLOG" && (
          <details className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5 group cursor-pointer shadow-sm transition-all duration-200 hover:shadow-md">
            <summary className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex justify-between items-center list-none [&::-webkit-details-marker]:hidden outline-none">
              Notification Preview
              <span className="text-brand-500 text-xs normal-case font-medium tracking-normal group-open:hidden">
                Show preview
              </span>
              <span className="text-brand-500 text-xs normal-case font-medium tracking-normal hidden group-open:block">
                Hide preview
              </span>
            </summary>
            <div className="pt-6 pb-2 flex justify-center cursor-default">
              <DesktopPreview campaign={campaign} />
            </div>
          </details>
        )}

        {/* ── Recipient Table ─────────────────────────────────────────── */}
        <RecipientTable campaignId={campaignId} />
      </div>

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
        onClose={() => { setReviewId(null); setReviewAction(null); }}
        onApprove={handleApprove}
        onReject={handleReject}
        isSubmitting={isSubmitting}
        initialAction={reviewAction}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Campaign"
        message={`Are you sure you want to cancel campaign "${campaign?.campaignName}"? This action cannot be undone.`}
        confirmText="Cancel Campaign"
        isDestructive={true}
        isLoading={isCancelling}
      />
    </div>
  );
};

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <li className="flex items-start justify-between gap-4">
    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
    <div className="text-right">{children}</div>
  </li>
);
