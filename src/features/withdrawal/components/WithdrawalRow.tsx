"use client";

import React, { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { EyeIcon } from "@/icons/index";
import Badge from "@/components/ui/badge/Badge";
import { AdminWithdrawalListItem, WithdrawalStatus } from "../types/withdrawal";
import { formatCurrency } from "@/utils/format-utils";
import { formatDisplayDate } from "@/utils/date-utils";

interface WithdrawalRowProps {
  withdrawal: AdminWithdrawalListItem;
  rowNumber: number;
  onViewDetails: (id: number) => void;
}

const WithdrawalRowComponent: React.FC<WithdrawalRowProps> = ({
  withdrawal,
  rowNumber,
  onViewDetails,
}) => {
  const renderStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge color="warning" variant="light">PENDING</Badge>;
      case "PROCESSING":
        return <Badge color="info" variant="light">PROCESSING</Badge>;
      case "SUCCESS":
        return <Badge color="success" variant="light">SUCCESS</Badge>;
      case "FAILED":
        return <Badge color="error" variant="light">FAILED</Badge>;
      case "CANCELLED":
        return <Badge color="light" variant="light">CANCELLED</Badge>;
      default:
        return <Badge color="primary" variant="light">{status}</Badge>;
    }
  };

  return (
    <TableRow 
      onClick={() => onViewDetails(withdrawal.withdrawalId)}
      className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
    >
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {rowNumber}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
        {withdrawal.referenceId}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
        {withdrawal.customerName}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm font-semibold text-brand-500">
        {formatCurrency(withdrawal.amount)}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        <div className="font-medium text-gray-800 dark:text-white/90">
          {withdrawal.toBankName}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {withdrawal.toAccountNumber} ({withdrawal.toAccountName})
        </div>
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm">
        {renderStatusBadge(withdrawal.status)}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {formatDisplayDate(withdrawal.createdAt)}
      </TableCell>

      <TableCell className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => onViewDetails(withdrawal.withdrawalId)}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500"
            aria-label={`View details of request ${withdrawal.referenceId}`}
          >
            <EyeIcon className="size-5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const WithdrawalRow = memo(WithdrawalRowComponent);
