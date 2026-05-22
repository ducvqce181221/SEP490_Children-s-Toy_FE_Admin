"use client";

import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { SuperCategoryListItem } from "../types/super-category";
import { PencilIcon } from "@/icons";
import { format } from "date-fns";

interface SuperCategoryRowProps {
  superCategory: SuperCategoryListItem;
  rowNumber: number;
  onEdit: (superCategory: SuperCategoryListItem) => void;
}

const statusClassNameByValue: Record<SuperCategoryListItem["status"], string> = {
  Active: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  Inactive: "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400",
};

export const SuperCategoryRow = React.memo(
  ({ superCategory, rowNumber, onEdit }: SuperCategoryRowProps) => {
    const formattedDate = format(new Date(superCategory.createdAt), "dd/MM/yyyy HH:mm");
    const isInactive = superCategory.status === "Inactive";

    return (
      <TableRow className={isInactive ? "opacity-50" : undefined}>
        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
          {rowNumber}
        </TableCell>
        <TableCell className="px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-gray-800 dark:text-white/90">
              {superCategory.superCategoryName}
            </span>
          </div>
        </TableCell>
        <TableCell className="px-5 py-4">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClassNameByValue[superCategory.status]}`}
          >
            {superCategory.status}
          </span>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {formattedDate}
        </TableCell>
        <TableCell className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onEdit(superCategory)}
              aria-label={`Edit super category ${superCategory.superCategoryName}`}
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
              title="Edit super category"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  },
);

SuperCategoryRow.displayName = "SuperCategoryRow";
