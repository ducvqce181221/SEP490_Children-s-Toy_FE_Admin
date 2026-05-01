"use client";

import React, { useState } from "react";
import Pagination from "@/components/common/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategoryMutations } from "../hooks/useCategoryMutations";
import { useCategories } from "../hooks/useCategories";
import {
  CategoryListItem,
  CategoryMutationResult,
} from "../types/category";
import { CategoryFormData } from "../types/category.schema";
import CategoryFormModal from "./CategoryFormModal";
import { CategoryRow } from "./CategoryRow";
import CategoryToolbar from "./CategoryToolbar";

const CategoryTable = () => {
  const {
    categories,
    isLoading,
    error,
    searchTerm,
    sortBy,
    sortDesc,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    handleSearchChange,
    handleSortByChange,
    handleSortDirectionChange,
    handlePageSizeChange,
    setPageNumber,
    reloadData,
  } = useCategories();

  const { createCategory, updateCategory, isSubmitting } =
    useCategoryMutations(reloadData);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryListItem | null>(null);

  const hasData = categories.length > 0;
  const showInitialLoading = isLoading && !hasData;
  const isEditMode = editingCategory !== null;

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (category: CategoryListItem) => {
    setEditingCategory(category);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (
    payload: CategoryFormData,
    id: number | null,
  ): Promise<CategoryMutationResult> => {
    if (id !== null) {
      const result = await updateCategory(id, payload);

      if (result.success) {
        handleCloseFormModal();
        return result;
      }

      return result;
    }

    const result = await createCategory(payload);

    if (result.success) {
      handleCloseFormModal();
      return result;
    }

    return result;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <CategoryToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortDesc={sortDesc}
        onSortDirectionChange={handleSortDirectionChange}
        onAddClick={handleOpenCreateModal}
      />

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[760px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  No.
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Category Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Super Category
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
              {showInitialLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-10 text-center text-error-500"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : categories.length > 0 ? (
                categories.map((category, index) => (
                  <CategoryRow
                    key={category.categoryId}
                    category={category}
                    rowNumber={(pageNumber - 1) * pageSize + index + 1}
                    onEdit={handleOpenEditModal}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No categories found.
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
              Showing {Math.min((pageNumber - 1) * pageSize + 1, totalCount)} - {Math.min(pageNumber * pageSize, totalCount)} / {totalCount} categories
            </span>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
            currentPage={pageNumber}
            totalPages={totalPages}
            onPageChange={setPageNumber}
          />
        </div>
      )}

      {isFormModalOpen && (
        <CategoryFormModal
          isOpen={isFormModalOpen}
          mode={isEditMode ? "edit" : "create"}
          category={editingCategory}
          isSubmitting={isSubmitting}
          onClose={handleCloseFormModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default CategoryTable;
