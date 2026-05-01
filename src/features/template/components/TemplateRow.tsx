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
  
  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge size="sm" color="success">Active</Badge> 
      : <Badge size="sm" color="error">Inactive</Badge>;
  };

  const formattedCreatedAt = template.createdAt ? format(new Date(template.createdAt), "dd/MM/yyyy HH:mm") : "-";

  return (
    <TableRow>
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {rowNumber}
      </TableCell>
      <TableCell className="px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-800 dark:text-white/90">
            {template.templateCode}
          </span>
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
            onClick={onEdit}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            title="Edit template"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
});
