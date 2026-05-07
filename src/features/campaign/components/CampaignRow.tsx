import React from "react";
import { CampaignListItem } from "../types/campaign";
import { TableCell, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { EyeIcon, PencilIcon, TrashBinIcon } from "@/icons/index";

interface CampaignRowProps {
  rowNumber: number;
  campaign: CampaignListItem;
  onView: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export const CampaignRow: React.FC<CampaignRowProps> = ({
  rowNumber,
  campaign,
  onView,
  onEdit,
  onCancel,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return <Badge color="warning">Draft</Badge>;
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
          ? new Date(campaign.scheduledAt).toLocaleString("en-US")
          : <span className="text-gray-300">—</span>}
      </TableCell>
      <TableCell className="px-5 py-4 sm:py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            title="View Details"
            onClick={onView}
            className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-md transition-colors"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          {onEdit && (campaign.status === "Draft" || campaign.status === "Scheduled") && (
            <button
              title="Edit Campaign"
              onClick={onEdit}
              className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          )}
          {onCancel && (campaign.status === "Draft" || campaign.status === "Scheduled") && (
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
