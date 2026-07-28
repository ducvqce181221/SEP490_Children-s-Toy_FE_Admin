"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TemplateToolbar } from "./TemplateToolbar";
import { TemplateFormModal } from "./TemplateFormModal";
import Pagination from "@/components/common/Pagination";
import { useTemplates } from "../hooks/useTemplates";
import { useTemplateMutations } from "../hooks/useTemplateMutations";
import { TemplateRow } from "./TemplateRow";
import { TemplateFormData, Template, UpdateTemplateData } from "../types/template";
import { useAuthContext } from "@/context/AuthContext";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";

export const TemplateTable = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    searchQuery,
    filters,
    handleSearch,      
    handleFilters,     
    handleItemsPerPage,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    editTemplate,
    setEditTemplate,
    viewTemplate,
    setViewTemplate,
    data,
    isLoading,
    error,
    refetch
  } = useTemplates();

  const { account } = useAuthContext();
  const isAdmin = account?.roleName === "Admin";

  const [confirmDeleteState, setConfirmDeleteState] = React.useState<{ isOpen: boolean; template: Template | null }>({ isOpen: false, template: null });
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const { createTemplate, saveTemplate, isSubmitting } = useTemplateMutations(() => {
    // on success reload list
    refetch();
    setIsModalOpen(false);
    setEditTemplate(null);
    setViewTemplate(null);
    setConfirmDeleteState({ isOpen: false, template: null });
  });

  const handleDeleteClick = (template: Template) => {
    setConfirmDeleteState({ isOpen: true, template });
  };

  const handleConfirmDelete = async () => {
    const template = confirmDeleteState.template;
    if (!template) return;

    setDeletingId(template.templateId);
    const success = await saveTemplate(template.templateId, { isDeleted: true });
    if (success) {
      setConfirmDeleteState({ isOpen: false, template: null });
    }
    setDeletingId(null);
  };

  const handleSave = async (formData: TemplateFormData) => {
    if (editTemplate) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { templateCode: _code, ...updateData }: { templateCode: string } & UpdateTemplateData = formData;
      await saveTemplate(editTemplate.templateId, updateData);
    } else {
      await createTemplate(formData);
    }
  };

  const paginatedData = data?.items || [];
  const totalPages = data?.totalPages || 0;
  const totalItems = data?.totalCount || 0;

  const currentModalMode = viewTemplate ? "detail" : editTemplate ? "edit" : "create";
  const currentTemplateData = viewTemplate || editTemplate || null;
  const isFormModalOpen = isModalOpen || !!editTemplate || !!viewTemplate;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <TemplateToolbar 
        onAddClick={() => setIsModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        filters={filters}
        onFilterChange={handleFilters}
      />

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  #
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Template Info
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Message
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Created At
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-10 text-center text-error-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((template, index) => (
                  <TemplateRow 
                    key={template.templateId}
                    rowNumber={(currentPage - 1) * itemsPerPage + index + 1}
                    template={template}
                    onView={() => setViewTemplate(template)}
                    onEdit={() => setEditTemplate(template)}
                    onDelete={() => handleDeleteClick(template)}
                    isAdmin={isAdmin}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No templates found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-5 py-4 border-t border-gray-100 dark:border-white/[0.05] gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} templates
            </span>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => handleItemsPerPage(Number(e.target.value))}
                className="py-1 px-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <TemplateFormModal 
        key={currentTemplateData ? `${currentTemplateData.templateId}-${currentModalMode}` : "create"}
        isOpen={isFormModalOpen} 
        mode={currentModalMode}
        templateData={currentTemplateData}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onClose={() => {
          setIsModalOpen(false);
          setEditTemplate(null);
          setViewTemplate(null);
        }} 
      />

      <ConfirmModal
        isOpen={confirmDeleteState.isOpen}
        onClose={() => setConfirmDeleteState({ isOpen: false, template: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Template"
        message={`Are you sure you want to delete template "${confirmDeleteState.template?.templateCode}"? This action is permanent and cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deletingId !== null}
      />
    </div>
  );
};
