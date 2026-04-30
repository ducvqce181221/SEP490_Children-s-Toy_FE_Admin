import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { CategoryListItem } from "../types/category";
import { PencilIcon } from "@/icons";
import { format } from "date-fns";
import Badge from "@/components/ui/badge/Badge";

interface CategoryRowProps {
  category: CategoryListItem;
  rowNumber: number;
  onEdit: (category: CategoryListItem) => void;
}

export const CategoryRow = React.memo(
  ({ category, rowNumber, onEdit }: CategoryRowProps) => {
    const formattedDate = format(new Date(category.createdAt), "dd/MM/yyyy HH:mm");

    return (
      <TableRow>
        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
          {rowNumber}
        </TableCell>
        <TableCell className="px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-gray-800 dark:text-white/90">
              {category.categoryName}
            </span>
          </div>
        </TableCell>
        <TableCell className="px-5 py-4 sm:px-6">
          <Badge size="sm" color="light">
            {category.superCategoryName}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {formattedDate}
        </TableCell>
        <TableCell className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onEdit(category)}
              aria-label={`Sửa danh mục ${category.categoryName}`}
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
              title="Sửa danh mục"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  },
);

CategoryRow.displayName = "CategoryRow";
