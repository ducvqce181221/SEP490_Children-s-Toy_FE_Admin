import React, { useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Voucher } from "../types/voucher";
import { TrashBinIcon, PencilIcon, EyeIcon } from "@/icons/index";
import { formatDisplayDate } from "@/utils/date-utils";
import { Popover } from "@/components/ui/popover/Popover";

interface VoucherRowProps {
  voucher: Voucher;
  rowNumber: number;
  isDeleting?: boolean;
  onView: () => void;
  onEdit: () => void;
  onDeleteClick: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}

export const VoucherRow = React.memo(function VoucherRow({
  voucher,
  rowNumber,
  isDeleting,
  onView,
  onEdit,
  onDeleteClick,
  onDeleteCancel,
  onDeleteConfirm,
}: VoucherRowProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge size="sm" color="success">Active</Badge>;
      case "inactive":
        return <Badge size="sm" color="error">Inactive</Badge>;
      case "scheduled":
        return <Badge size="sm" color="warning">Scheduled</Badge>;
      case "expired":
        return <Badge size="sm" color="light">Expired</Badge>;
      default:
        return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  const getDiscountDisplay = () => {
    if (voucher.discountType === "PERCENTAGE") {
      return `${voucher.discountValue}%`;
    }
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(voucher.discountValue);
  };

  const formattedStartDate = formatDisplayDate(voucher.startDate);
  const formattedEndDate = formatDisplayDate(voucher.endDate);

  const deleteBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <TableRow>
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {rowNumber}
      </TableCell>
      <TableCell className="px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-800 dark:text-white/90">
            {voucher.voucherCode}
          </span>
          <span className="text-sm text-gray-500">
            {voucher.voucherName}
          </span>
        </div>
      </TableCell>
      
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {getDiscountDisplay()}
      </TableCell>

      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {voucher.usedQuantity} / {voucher.totalQuantity ?? "∞"}
      </TableCell>

      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        <div className="flex flex-col gap-1">
          <span className="text-xs">From: {formattedStartDate}</span>
          <span className="text-xs">To: {formattedEndDate}</span>
        </div>
      </TableCell>
      
      <TableCell className="px-4 py-3 text-start">
        {getStatusBadge(voucher.status)}
      </TableCell>
      
      <TableCell className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={onView}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            title="View voucher details"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={onEdit}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            title="Edit voucher"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button 
            ref={deleteBtnRef}
            onClick={onDeleteClick}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-error-400 hover:text-error-500 dark:border-gray-700 dark:text-gray-300"
            title="Delete voucher"
          >
            <TrashBinIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Popover */}
        <Popover
          isOpen={!!isDeleting}
          onClose={onDeleteCancel}
          triggerRef={deleteBtnRef}
          position="top-end"
          className="p-4"
        >
          <div className="w-[200px]">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">Confirm Delete</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Are you sure you want to delete voucher <span className="font-bold text-gray-700 dark:text-gray-200">{voucher.voucherCode}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onDeleteCancel}
                className="h-8 text-xs px-3"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={onDeleteConfirm}
                className="h-8 text-xs px-3 bg-error-500 hover:bg-error-600 border-error-500"
              >
                Delete
              </Button>
            </div>
          </div>
        </Popover>
      </TableCell>
    </TableRow>
  );
});
