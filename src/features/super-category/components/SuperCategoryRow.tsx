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

export const SuperCategoryRow = React.memo(
  ({ superCategory, rowNumber, onEdit }: SuperCategoryRowProps) => {
    const formattedDate = format(new Date(superCategory.createdAt), "dd/MM/yyyy HH:mm");

    return (
      <TableRow>
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
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {formattedDate}
        </TableCell>
        <TableCell className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onEdit(superCategory)}
              aria-label={`Sửa danh mục ${superCategory.superCategoryName}`}
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
              title="Sửa danh mục lớn"
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
