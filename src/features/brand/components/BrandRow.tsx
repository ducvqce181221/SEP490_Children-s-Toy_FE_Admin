"use client";

import React, { memo } from "react";
import { EyeIcon, PencilIcon } from "@/icons/index";
import { TableCell, TableRow } from "@/components/ui/table";
import { BrandListItem } from "../types/brand";

interface BrandRowProps {
  brand: BrandListItem;
  rowNumber: number;
  onViewDetails: (brand: BrandListItem) => void;
  onEdit: (brand: BrandListItem) => void;
}

const formatDateTime = (dateValue: string | null) => {
  if (!dateValue) {
    return "--";
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
};

const statusClassNameByValue: Record<BrandListItem["status"], string> = {
  Active:
    "border border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300",
  Inactive:
    "border border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300",
};

const BrandRowComponent: React.FC<BrandRowProps> = ({
  brand,
  rowNumber,
  onViewDetails,
  onEdit,
}) => {
  return (
    <TableRow>
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {rowNumber}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
        {brand.brandName}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClassNameByValue[brand.status]}`}
        >
          {brand.status}
        </span>
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {formatDateTime(brand.createdAt)}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {formatDateTime(brand.updatedAt)}
      </TableCell>

      <TableCell className="px-5 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(brand)}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            aria-label={`View brand ${brand.brandName} details`}
          >
            <EyeIcon />
          </button>
          <button
            type="button"
            onClick={() => onEdit(brand)}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            aria-label={`Edit brand ${brand.brandName}`}
          >
            <PencilIcon />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const BrandRow = memo(BrandRowComponent);
