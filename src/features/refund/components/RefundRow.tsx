"use client";
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { Refund } from "../types/refund";
import { PencilIcon, EyeIcon } from "@/icons/index";
import { formatDisplayDate } from "@/utils/date-utils";
import Link from "next/link";
import { formatCurrency } from "@/utils/format-utils";

interface RefundRowProps {
  refund: Refund;
  rowNumber: number;
}

export const RefundRow = React.memo(function RefundRow({
  refund,
  rowNumber,
}: RefundRowProps) {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RefundRequested":
      case "Requested":
        return <Badge size="sm" color="warning">Requested</Badge>;
      case "RefundApproved":
      case "Approved":
        return <Badge size="sm" color="success">Approved</Badge>;
      case "RefundPickupCreated":
      case "PickupCreated":
        return <Badge size="sm" color="info">Pickup Created</Badge>;
      case "RefundShipping":
      case "Shipping":
        return <Badge size="sm" color="info">Shipping</Badge>;
      case "RefundReceived":
      case "Received":
        return <Badge size="sm" color="info">Received</Badge>;
      case "RefundInspectionPending":
      case "InspectionPending":
        return <Badge size="sm" color="light">Inspection Pending</Badge>;
      case "RefundCompleted":
      case "Completed":
        return <Badge size="sm" color="success">Completed</Badge>;
      case "RefundCancelled":
      case "Cancelled":
        return <Badge size="sm" color="light">Cancelled</Badge>;
      case "RefundRejected":
      case "Rejected":
        return <Badge size="sm" color="error">Rejected</Badge>;
      default:
        return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  const formattedDate = formatDisplayDate(refund.createdAt);

  return (
    <TableRow>
      <TableCell className="px-5 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {rowNumber}
      </TableCell>

      <TableCell className="px-5 py-3 sm:px-6">
        <div className="flex flex-col gap-1.5 max-w-[200px]">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
              #{refund.orderCode}
            </span>
            {refund.refundCode && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Ref: {refund.refundCode}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {refund.orderStatus}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${refund.paymentStatus === "PAID"
              ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
              : refund.paymentStatus === "FAILED"
                ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800"
              }`}>
              {refund.paymentStatus}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell className="px-5 py-3 text-start">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{refund.customerName}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{refund.customerPhone}</span>
          {/* <span className="text-xs text-gray-500 truncate max-w-[150px]">{refund.customerEmail}</span> */}
        </div>
      </TableCell>

      <TableCell className="px-5 py-3 text-start">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-brand-500 font-semibold">{formatCurrency(refund.approvedAmount)}</span>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>
      </TableCell>

      <TableCell className="px-5 py-3 text-start">
        <div className="flex flex-col gap-1.5">
          {refund.assignedToStaffName ? (
            <span className="inline-flex w-max items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <span className="font-semibold text-blue-500">S:</span> {refund.assignedToStaffName}
            </span>
          ) : (
            <span className="inline-flex w-max items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs italic text-gray-400 border border-dashed border-gray-200 dark:bg-transparent dark:border-gray-700">
              Staff: Unassigned
            </span>
          )}

          {refund.assignedToMerchName ? (
            <span className="inline-flex w-max items-center gap-1.5 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              <span className="font-semibold text-purple-500">M:</span> {refund.assignedToMerchName}
            </span>
          ) : (
            <span className="inline-flex w-max items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs italic text-gray-400 border border-dashed border-gray-200 dark:bg-transparent dark:border-gray-700">
              Merch: Unassigned
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="px-5 py-3 text-start">
        {getStatusBadge(refund.refundStatus)}
      </TableCell>

      <TableCell className="px-5 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <Link href={`/admin/refunds/${refund.refundId}?view=true`}>
            <button
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
              title="View Details"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
          </Link>
          <Link href={`/admin/refunds/${refund.refundId}`}>
            <button
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
              title="Edit Refund"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </TableCell>
    </TableRow>
  );
});
