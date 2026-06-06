import React, { useRef, useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { PromotionListDto } from "../types/promotion";
import { TrashBinIcon, PencilIcon, EyeIcon } from "@/icons/index";
import { formatDisplayDate } from "@/utils/date-utils";
import { Popover } from "@/components/ui/popover/Popover";
import Link from "next/link";

interface PromotionRowProps {
  promotion: PromotionListDto;
  rowNumber: number;
  isDeleting?: boolean;
  onDeleteClick: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  onInactive?: () => void;
}

export const PromotionRow = React.memo(function PromotionRow({
  promotion,
  isDeleting,
  onDeleteClick,
  onDeleteCancel,
  onDeleteConfirm,
  onInactive,
}: PromotionRowProps) {
  const [isInactiveOpen, setIsInactiveOpen] = useState(false);
  const inactiveBtnRef = useRef<HTMLButtonElement>(null);
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge size="sm" color="success">Active</Badge>;
      case "scheduled":
      case "upcoming":
        return <Badge size="sm" color="warning">Scheduled</Badge>;
      case "inactive":
        return <Badge size="sm" color="error">Inactive</Badge>;
      case "expired":
        return <Badge size="sm" color="light">Expired</Badge>;
      default:
        return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  const formattedStartDate = formatDisplayDate(promotion.startDate);
  const formattedEndDate = formatDisplayDate(promotion.endDate);

  const deleteBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <TableRow>
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {promotion.promotionId}
      </TableCell>
      <TableCell className="px-5 py-4 sm:px-6">
        <span className="font-medium text-gray-800 dark:text-white/90">
          {promotion.promotionName}
        </span>
      </TableCell>
      
      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {promotion.promotionType}
      </TableCell>

      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        <div className="flex flex-col gap-1">
          <span className="text-xs">From: {formattedStartDate}</span>
          <span className="text-xs">To: {formattedEndDate}</span>
        </div>
      </TableCell>

      <TableCell className="px-4 py-3 text-start">
        {getStatusBadge(promotion.status)}
      </TableCell>
      
      <TableCell className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <Link href={`/admin/promotions/${promotion.promotionId}`}>
            <button 
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
              title="View promotion details"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
          </Link>
          
          {promotion.status.toLowerCase() !== "expired" && (
            <Link href={`/admin/promotions/${promotion.promotionId}/edit`}>
              <button 
                className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
                title="Edit promotion"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </Link>
          )}

          {promotion.status.toLowerCase() === "active" && (
            <button 
              ref={inactiveBtnRef}
              onClick={() => setIsInactiveOpen(true)}
              className="rounded-lg border border-gray-300 p-2 text-rose-500 transition-colors hover:border-rose-400 hover:text-rose-600 dark:border-gray-700"
              title="Stop/Inactive promotion"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
              </svg>
            </button>
          )}

          {promotion.status.toLowerCase() !== "active" && (
            <button 
              ref={deleteBtnRef}
              onClick={onDeleteClick}
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-error-400 hover:text-error-500 dark:border-gray-700 dark:text-gray-300"
              title="Delete promotion"
            >
              <TrashBinIcon className="w-5 h-5" />
            </button>
          )}
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
            <h4 className="text-sm font-semibold dark:text-white/90 mb-1 text-rose-600 text-start">Deactivate Promotion</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-start">
              Are you sure you want to stop promotion <span className="font-bold">{promotion.promotionName}</span>? It will become Inactive and cannot be edited.
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
          <div className="w-[250px]">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1 text-start">Confirmation</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-start">
              Are you sure you want to delete this promotion: <span className="font-bold text-gray-700 dark:text-gray-200">{promotion.promotionName}</span>?
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
