"use client";

import React, { memo } from "react";
import { EyeIcon } from "@/icons/index";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDisplayDate } from "@/utils/date-utils";
import {
  ORDER_STATUS_ID,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABEL,
  formatGhnShippingLabel,
  isGhnReturnFlowStatus,
  type OrderListItem,
} from "../types/order";

interface OrderRowProps {
  order: OrderListItem;
  rowNumber: number;
  onOpenDetail: (orderId: number) => void;
}

const formatDateTime = (dateValue: string | null) => {
  if (!dateValue) return null;
  const res = formatDisplayDate(dateValue, "");
  return res === "" ? null : res;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

// ─── Order Status Badge ────────────────────────────────────────────────────────
function getStatusStyle(statusId: number) {
  switch (statusId) {
    case ORDER_STATUS_ID.PENDING:
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
    case ORDER_STATUS_ID.CONFIRMED:
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    case ORDER_STATUS_ID.PROCESSING:
      return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800";
    case ORDER_STATUS_ID.SHIPPED:
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
    case ORDER_STATUS_ID.DELIVERING:
      return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800";
    case ORDER_STATUS_ID.DELIVERED:
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    case ORDER_STATUS_ID.COMPLETED:
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
    case ORDER_STATUS_ID.RETURNING:
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
    case ORDER_STATUS_ID.RETURN_COMPLETED:
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
    case ORDER_STATUS_ID.REFUNDED:
      return "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800";
    case ORDER_STATUS_ID.CANCELLED:
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
    case ORDER_STATUS_ID.DELIVERY_FAILED:
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
    case ORDER_STATUS_ID.WAITING_RETURN:
    case ORDER_STATUS_ID.RETURN_FAILED:
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
    case ORDER_STATUS_ID.LOST:
    case ORDER_STATUS_ID.DAMAGED:
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

function getPaymentStyle(paymentStatus: string) {
  switch (paymentStatus) {
    case PAYMENT_STATUS.PAID:
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    case PAYMENT_STATUS.FAILED:
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
    case PAYMENT_STATUS.REFUNDED:
      return "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800";
    case PAYMENT_STATUS.PARTIALLY_REFUNDED:
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
    case PAYMENT_STATUS.PENDING:
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
  }
}

const OrderRowComponent: React.FC<OrderRowProps> = ({ order, rowNumber, onOpenDetail }) => {
  const confirmedAt = formatDateTime(order.confirmedAt);
  const shippedAt = formatDateTime(order.shippedAt);

  return (
    <TableRow className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
        {rowNumber}
      </TableCell>

      {/* Đơn hàng: code + 2 status badges */}
      <TableCell className="px-5 py-4 text-start sm:px-6">
        <p className="text-theme-sm font-semibold text-brand-600 dark:text-brand-400">
          #{order.orderCode}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex max-w-[150px] items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusStyle(order.statusId)}`}
            title={order.fulfillmentLabel ?? ORDER_STATUS_LABEL[order.statusId] ?? order.statusName}
          >
            <span className="truncate">
              {order.fulfillmentLabel ?? ORDER_STATUS_LABEL[order.statusId] ?? order.statusName}
            </span>
          </span>
          {order.ghnShippingStatus && isGhnReturnFlowStatus(order.ghnShippingStatus) && (
            <span 
              className="inline-flex max-w-[150px] items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-800 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
              title={formatGhnShippingLabel(order.ghnShippingStatus)}
            >
              <span className="truncate">GHN: {formatGhnShippingLabel(order.ghnShippingStatus)}</span>
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${getPaymentStyle(order.paymentStatus)}`}
          >
            {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
          </span>
        </div>
      </TableCell>

      {/* Khách hàng */}
      <TableCell className="px-5 py-4 text-start">
        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90 truncate max-w-[150px]" title={order.customerName}>
          {order.customerName}
        </p>
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">{order.customerPhone}</p>
      </TableCell>

      {/* Tiền + phương thức */}
      <TableCell className="px-5 py-4 text-start">
        <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
          {formatCurrency(order.totalAmount)}
        </p>
        <p className="text-theme-xs uppercase text-gray-500 dark:text-gray-400 truncate max-w-[120px]" title={order.paymentMethod}>
          {order.paymentMethod}
        </p>
      </TableCell>

      {/* Nhân viên phụ trách */}
      <TableCell className="px-5 py-4 text-start">
        <div className="flex flex-col gap-1.5">
          {order.assignedToStaffName ? (
            <span 
              className="inline-flex w-max max-w-[160px] items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              title={order.assignedToStaffName}
            >
              <span className="font-semibold text-blue-500">S:</span> 
              <span className="truncate">{order.assignedToStaffName}</span>
            </span>
          ) : (
            <span className="inline-flex w-max items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs italic text-gray-400 border border-dashed border-gray-200 dark:bg-transparent dark:border-gray-700">
              Staff: Unassigned
            </span>
          )}

          {order.assignedToMerchName ? (
            <span 
              className="inline-flex w-max max-w-[160px] items-center gap-1.5 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              title={order.assignedToMerchName}
            >
              <span className="font-semibold text-purple-500">M:</span> 
              <span className="truncate">{order.assignedToMerchName}</span>
            </span>
          ) : (
            <span className="inline-flex w-max items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs italic text-gray-400 border border-dashed border-gray-200 dark:bg-transparent dark:border-gray-700">
              Merch: Unassigned
            </span>
          )}
        </div>
      </TableCell>

      {/* Timestamps */}
      <TableCell className="px-5 py-4 text-start">
        <p className="text-theme-xs text-gray-600 dark:text-gray-300">
          {formatDateTime(order.orderDate) ?? "—"}
        </p>
        {confirmedAt && (
          <p className="mt-0.5 text-theme-xs text-gray-400 dark:text-gray-500">
            ✓ {confirmedAt}
          </p>
        )}
        {shippedAt && (
          <p className="mt-0.5 text-theme-xs text-gray-400 dark:text-gray-500">
            ↑ {shippedAt}
          </p>
        )}
      </TableCell>

      {/* Action */}
      <TableCell className="px-5 py-4 text-center">
        <button
          type="button"
          onClick={() => onOpenDetail(order.orderId)}
          className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-700 dark:hover:bg-brand-900/20"
          title="View details"
        >
          <EyeIcon />
        </button>
      </TableCell>
    </TableRow>
  );
};

export const OrderRow = memo(OrderRowComponent);
