import React, { useRef, useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Voucher } from "../types/voucher";
import { TrashBinIcon, PencilIcon, EyeIcon, InfoIcon } from "@/icons/index";
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
  onApprove?: () => void;
  onReject?: () => void;
  onInactive?: () => void;
  roleName?: string;
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
  onApprove,
  onReject,
  onInactive,
  roleName,
}: VoucherRowProps) {
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [isInactiveOpen, setIsInactiveOpen] = useState(false);
  const reasonBtnRef = useRef<HTMLButtonElement>(null);
  const inactiveBtnRef = useRef<HTMLButtonElement>(null);

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
      case "pending":
        return <Badge size="sm" color="warning">Pending</Badge>;
      case "rejected":
        return (
          <div className="flex items-center gap-1">
            <Badge size="sm" color="error">Rejected</Badge>
            {voucher.reason && roleName === "Staff" && (
              <>
                <button
                  ref={reasonBtnRef}
                  onClick={() => setIsReasonOpen(true)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title="Details"
                >
                  <InfoIcon className="w-6 h-6 text-error-500" />  
                </button>
                <Popover
                  isOpen={isReasonOpen}
                  onClose={() => setIsReasonOpen(false)}
                  triggerRef={reasonBtnRef}
                  position="top"
                  className="p-3"
                >
                  <div className="w-48 sm:w-64">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-2 flex items-center gap-2">
                      <InfoIcon className="w-6 h-6 text-error-500" />
                      Rejection Reason
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed break-words whitespace-normal">
                      {voucher.reason}
                    </p>
                  </div>
                </Popover>
              </>
            )}
          </div>
        );
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
          
          {roleName === "Admin" && voucher.status === "Pending" && (
            <>
              <button 
                onClick={onApprove}
                className="rounded-lg border border-gray-300 p-2 text-success-500 transition-colors hover:border-success-400 hover:text-success-600 dark:border-gray-700"
                title="Approve voucher"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </button>
              <button 
                onClick={onReject}
                className="rounded-lg border border-gray-300 p-2 text-error-500 transition-colors hover:border-error-400 hover:text-error-600 dark:border-gray-700"
                title="Reject voucher"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </>
          )}

          {voucher.status !== "Pending" && voucher.status !== "Active" && (
            <button 
              onClick={onEdit}
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
              title={voucher.status === "Rejected" && roleName === "Staff" ? "Edit & Resubmit" : "Edit voucher"}
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          )}

          {voucher.status === "Active" && (
            <button 
              ref={inactiveBtnRef}
              onClick={() => setIsInactiveOpen(true)}
              className="rounded-lg border border-gray-300 p-2 text-rose-500 transition-colors hover:border-rose-400 hover:text-rose-600 dark:border-gray-700"
              title="Stop/Inactive voucher"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
              </svg>
            </button>
          )}

          <button 
            ref={deleteBtnRef}
            onClick={onDeleteClick}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-error-400 hover:text-error-500 dark:border-gray-700 dark:text-gray-300"
            title="Delete voucher"
          >
            <TrashBinIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Inactive Confirmation Popover */}
        <Popover
          isOpen={isInactiveOpen}
          onClose={() => setIsInactiveOpen(false)}
          triggerRef={inactiveBtnRef}
          position="top-end"
          className="p-4"
        >
          <div className="w-[220px]">
            <h4 className="text-sm font-semibold dark:text-white/90 mb-1 text-rose-600">Deactivate Voucher</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Are you sure you want to stop voucher <span className="font-bold">{voucher.voucherCode}</span>? It will become Inactive and cannot be edited.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsInactiveOpen(false)}
                className="h-8 text-xs px-3"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => {
                  onInactive?.();
                  setIsInactiveOpen(false);
                }}
                className="h-8 text-xs px-3 bg-rose-500 hover:bg-rose-600 border-rose-500"
              >
                Confirm
              </Button>
            </div>
          </div>
        </Popover>

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
