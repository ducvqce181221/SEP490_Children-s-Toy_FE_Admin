import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Voucher } from "../types/voucher";
import { TrashBinIcon, PencilIcon } from "@/icons/index";
import { format } from "date-fns";

interface VoucherRowProps {
  voucher: Voucher;
  isDeleting?: boolean;
  onEdit: () => void;
  onDeleteClick: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}

export const VoucherRow = React.memo(function VoucherRow({
  voucher,
  isDeleting,
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

  const formattedStartDate = format(new Date(voucher.startDate), "dd/MM/yyyy HH:mm");
  const formattedEndDate = format(new Date(voucher.endDate), "dd/MM/yyyy HH:mm");

  return (
    <TableRow>
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
          <span className="text-xs">Từ: {formattedStartDate}</span>
          <span className="text-xs">Đến: {formattedEndDate}</span>
        </div>
      </TableCell>
      
      <TableCell className="px-4 py-3 text-start">
        {getStatusBadge(voucher.status)}
      </TableCell>
      
      <TableCell className="px-4 py-3 text-center">
        {isDeleting ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-red-500">Are you sure?</span>
            <Button variant="outline" size="sm" onClick={onDeleteCancel}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={onDeleteConfirm} className="bg-error-500 hover:bg-error-600 border-error-500">Delete</Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <button 
              onClick={onEdit}
              className="p-2 text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              title="Edit voucher"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={onDeleteClick}
              className="p-2 text-gray-500 transition-colors hover:text-error-500 dark:text-gray-400 dark:hover:text-error-500"
              title="Delete voucher"
            >
              <TrashBinIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
});
