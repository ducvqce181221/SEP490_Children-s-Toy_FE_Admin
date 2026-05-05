import React, { useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { PromotionListDto } from "../types/promotion";
import { TrashBinIcon, PencilIcon, EyeIcon } from "@/icons/index";
import { format } from "date-fns";
import { Popover } from "@/components/ui/popover/Popover";
import Link from "next/link";

interface PromotionRowProps {
  promotion: PromotionListDto;
  rowNumber: number;
  isDeleting?: boolean;
  onDeleteClick: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}

export const PromotionRow = React.memo(function PromotionRow({
  promotion,
  isDeleting,
  onDeleteClick,
  onDeleteCancel,
  onDeleteConfirm,
}: PromotionRowProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge size="sm" color="success">Active</Badge>;
      case "upcoming":
        return <Badge size="sm" color="warning">Upcoming</Badge>;
      case "expired":
        return <Badge size="sm" color="light">Expired</Badge>;
      default:
        return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  const formattedStartDate = format(new Date(promotion.startDate), "dd/MM/yyyy HH:mm");
  const formattedEndDate = format(new Date(promotion.endDate), "dd/MM/yyyy HH:mm");

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
              title="Xem chi tiết khuyến mãi"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
          </Link>
          <Link href={`/admin/promotions/${promotion.promotionId}/edit`}>
            <button 
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
              title="Chỉnh sửa khuyến mãi"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </Link>
          <button 
            ref={deleteBtnRef}
            onClick={onDeleteClick}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-error-400 hover:text-error-500 dark:border-gray-700 dark:text-gray-300"
            title="Xóa khuyến mãi"
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
          <div className="w-[250px]">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">Confirmation</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
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
