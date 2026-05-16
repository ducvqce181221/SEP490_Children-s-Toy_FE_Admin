import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { Template } from "../types/template";
import { PencilIcon, EyeIcon } from "@/icons/index";
import { format } from "date-fns";

interface TemplateRowProps {
  template: Template;
  rowNumber: number;
  onView: () => void;
  onEdit: () => void;
}

export const TemplateRow = React.memo(function TemplateRow({
  template,
  rowNumber,
  onView,
  onEdit,
}: TemplateRowProps) {
  const isSystem = template.usageScope?.toUpperCase() === "SYSTEM";

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? <Badge size="sm" color="success">Active</Badge>
      : <Badge size="sm" color="error">Inactive</Badge>;
  };

  const formattedCreatedAt = template.createdAt
    ? format(new Date(template.createdAt), "dd/MM/yyyy HH:mm")
    : "-";

  return (
    <TableRow>
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {rowNumber}
      </TableCell>
      <TableCell className="px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 dark:text-white/90">
              {template.templateCode}
            </span>
            {isSystem && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
                SYSTEM
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {template.titleTemplate}
          </span>
        </div>
      </TableCell>

      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 max-w-[200px] truncate">
        {template.messageTemplate}
      </TableCell>

      <TableCell className="px-4 py-3 text-start">
        {getStatusBadge(template.isActive)}
      </TableCell>

      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {formattedCreatedAt}
      </TableCell>

      <TableCell className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onView}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            title="View template details"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <button
            onClick={isSystem ? undefined : onEdit}
            disabled={isSystem}
            className={`rounded-lg border p-2 transition-colors ${
              isSystem
                ? "border-gray-200 text-gray-300 cursor-not-allowed opacity-40 dark:border-gray-700 dark:text-gray-600"
                : "border-gray-300 text-gray-500 hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            }`}
            title={isSystem ? "System templates cannot be edited" : "Edit template"}
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
});
