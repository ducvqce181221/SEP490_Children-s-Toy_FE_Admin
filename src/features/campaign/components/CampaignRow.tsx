"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CampaignListItem } from "../types/campaign";
import { TableCell, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { EyeIcon, PencilIcon, TrashBinIcon } from "@/icons/index";
import { campaignDetailPath, resolveCampaignListItemId } from "../utils/campaign-navigation";

import { formatDisplayDate } from "@/utils/date-utils";

interface CampaignRowProps {
  rowNumber: number;
  campaign: CampaignListItem;
  roleName?: string;
  onEdit?: () => void;
  onCancel?: () => void;
  onSubmit?: () => void;
  onReview?: () => void;
  onSchedule?: () => void;
  onReschedule?: () => void;
}

export const CampaignRow: React.FC<CampaignRowProps> = ({
  rowNumber,
  campaign,
  roleName,
  onEdit,
  onCancel,
  onSubmit,
  onReview,
  onSchedule,
  onReschedule,
}) => {
  const router = useRouter();
  const detailId = resolveCampaignListItemId(campaign);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return <Badge color="light">Draft</Badge>;
      case "pendingapproval":
        return <Badge color="warning">Pending Approval</Badge>;
      case "approved":
        return <Badge color="success">Approved</Badge>;
      case "rejected":
        return <Badge color="error">Rejected</Badge>;
      case "scheduled":
        return <Badge color="info">Scheduled</Badge>;
      case "sending":
        return <Badge color="info">Sending</Badge>;
      case "sent":
        return <Badge color="success">Sent</Badge>;
      case "cancelled":
        return <Badge color="error">Cancelled</Badge>;
      case "failed":
        return <Badge color="error">Failed</Badge>;
      default:
        return <Badge color="light">{status || "Unknown"}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    return source === "SYSTEM"
      ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">System</span>
      : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Admin</span>;
  };

  return (
    <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
      <TableCell className="px-5 py-4 sm:py-3 text-sm text-gray-500 dark:text-gray-400">
        {rowNumber}
      </TableCell>
      <TableCell className="px-5 py-4 sm:py-3">
        <span className="font-medium text-gray-900 dark:text-white block truncate max-w-[220px]" title={campaign.campaignName}>
          {campaign.campaignName}
        </span>
      </TableCell>
      <TableCell className="px-5 py-4 sm:py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
        {campaign.templateCode || <span className="text-gray-300">—</span>}
      </TableCell>
      <TableCell className="px-5 py-4 sm:py-3">
        {getSourceBadge(campaign.sourceType)}
      </TableCell>
      <TableCell className="px-5 py-4 sm:py-3 text-sm text-gray-500 dark:text-gray-400">
        {campaign.targetType}
      </TableCell>
      <TableCell className="px-5 py-4 sm:py-3">
        {getStatusBadge(campaign.status)}
      </TableCell>
      <TableCell className="px-5 py-4 sm:py-3 text-sm text-gray-500 dark:text-gray-400">
        {campaign.scheduledAt
          ? formatDisplayDate(campaign.scheduledAt)
          : <span className="text-gray-300">—</span>}
      </TableCell>
      <TableCell className="px-5 py-4 sm:py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          {/* Submit button (for Draft) */}
          {onSubmit && campaign.status === "Draft" && (
            <button
              title="Submit for Review"
              onClick={onSubmit}
              className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}



          {onReschedule && campaign.status === "Scheduled" && (
            <button
              title="Reschedule"
              onClick={onReschedule}
              className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-purple-500 hover:bg-purple-50 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {/* Schedule button (for Approved) */}
          {onSchedule && campaign.status === "Approved" && (
            <button
              title="Schedule Campaign"
              onClick={onSchedule}
              className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-purple-500 hover:bg-purple-50 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          {onReview &&
            campaign.status === "PendingApproval" &&
            roleName?.toLowerCase() === "admin" && (
              <button
                type="button"
                title="Review campaign"
                onClick={onReview}
                className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors dark:hover:bg-amber-900/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </button>
            )}

          <button
            type="button"
            title="View Details"
            disabled={detailId == null}
            onClick={() => {
              if (detailId != null) router.push(campaignDetailPath(detailId));
            }}
            className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-md transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <EyeIcon className="w-5 h-5" />
          </button>

          {/* Edit is allowed for Draft and Rejected */}
          {onEdit && (campaign.status === "Draft" || campaign.status === "Rejected") && (
            <button
              title="Edit Campaign"
              onClick={onEdit}
              className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          )}

          {/* Cancel is allowed for all states up to Scheduled */}
          {onCancel && ["Draft", "Approved", "Scheduled"].includes(campaign.status) && (
            <button
              title="Cancel Campaign"
              onClick={onCancel}
              className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-error-500 hover:bg-error-50 rounded-md transition-colors"
            >
              <TrashBinIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
