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

function getOrderStatusStyle(orderStatus: string) {
  switch (orderStatus.toLowerCase()) {
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    case "processing":
      return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800";
    case "shipped":
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
    case "delivering":
      return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

function getPaymentStyle(paymentStatus: string) {
  switch (paymentStatus.toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    case "failed":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
    case "refunded":
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    case "pending":
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
  }
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
    <TableRow className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
        {rowNumber}
      </TableCell>

      <TableCell className="px-5 py-4 text-start sm:px-6">
        <div className="flex flex-col gap-0.5">
          <p className="text-theme-sm font-semibold text-brand-600 dark:text-brand-400">
            #{refund.orderCode}
          </p>
          {refund.refundCode && (
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              Ref: {refund.refundCode}
            </p>
          )}
          {refund.isSystemReturn && (
            <span className="mt-1 inline-flex w-max items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              ⚙ System Return
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getOrderStatusStyle(refund.orderStatus)}`}
          >
            {refund.orderStatus}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${getPaymentStyle(refund.paymentStatus)}`}
          >
            {refund.paymentStatus}
          </span>
        </div>
      </TableCell>

      <TableCell className="px-5 py-4 text-start">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{refund.customerName}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{refund.customerPhone}</span>
        </div>
      </TableCell>

      <TableCell className="px-5 py-4 text-start">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-brand-500 font-semibold">{formatCurrency(refund.approvedAmount)}</span>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>
      </TableCell>

      <TableCell className="px-5 py-4 text-start">
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

      <TableCell className="px-5 py-4 text-start">
        {getStatusBadge(refund.refundStatus)}
      </TableCell>

      <TableCell className="px-5 py-4 text-center">
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
