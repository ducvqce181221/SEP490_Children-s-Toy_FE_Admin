"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Pagination from "@/components/common/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBrandMutations } from "../hooks/useBrandMutations";
import { useBrands } from "../hooks/useBrands";
import {
  BrandFormRequest,
  BrandListItem,
  BrandMutationResult,
} from "../types/brand";
import BrandFormModal from "./BrandFormModal";
import BrandDetailModal from "./BrandDetailModal";
import { BrandRow } from "./BrandRow";
import BrandToolbar from "./BrandToolbar";

const headerCellClassName =
  "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";

const pageSizeOptions = [5, 10, 20, 50];

const footerSelectClassName =
  "h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

const BrandTable = () => {
  const {
    brands,
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
    reloadBrands,
  } = useBrands();

  const { createBrand, updateBrand, isCreating, updatingBrandId } =
    useBrandMutations(reloadBrands);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandListItem | null>(null);
  const [viewingBrand, setViewingBrand] = useState<BrandListItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const pageRangeText = useMemo(() => {
    if (totalCount === 0) {
      return "No data available";
    }

    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);

    return `Showing ${start} - ${end} / ${totalCount} brands`;
  }, [pageNumber, pageSize, totalCount]);

  const hasBrands = brands.length > 0;
  const showInitialLoading = isLoading && !hasBrands;
  const showRefreshing = isLoading && hasBrands;
  const isEditMode = editingBrand !== null;
  const isSubmitting = isEditMode
    ? updatingBrandId === editingBrand?.brandId
    : isCreating;

  const handleOpenCreateModal = () => {
    setEditingBrand(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (brand: BrandListItem) => {
    setEditingBrand(brand);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (brand: BrandListItem) => {
    setViewingBrand(brand);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setViewingBrand(null);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingBrand(null);
  };

  const handleSubmitBrand = async (
    payload: BrandFormRequest,
    brandId: number | null,
  ): Promise<BrandMutationResult> => {
    if (brandId !== null) {
      const result = await updateBrand(brandId, payload);

      if (result.success) {
        toast.success(result.message);
        handleCloseFormModal();
        return result;
      }

      if (!result.validationErrors) {
        toast.error(result.message);
      }

      return result;
    }

    const result = await createBrand(payload);

    if (result.success) {
      toast.success(result.message);
      handleCloseFormModal();
      return result;
    }

    if (!result.validationErrors) {
      toast.error(result.message);
    }

    return result;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <BrandToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortDesc={sortDesc}
        onSortDirectionChange={handleSortDirectionChange}
        onAddClick={handleOpenCreateModal}
      />

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[1100px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={headerCellClassName}>
                  #
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Brand Name
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Status
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Created At
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Updated At
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {showInitialLoading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading brand list...
                  </TableCell>
                </TableRow>
              )}

              {!showInitialLoading && error && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-error-600"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!showInitialLoading && !error && brands.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No matching brands found.
                  </TableCell>
                </TableRow>
              )}

              {!error &&
                brands.length > 0 &&
                brands.map((brand, index) => (
                  <BrandRow
                    key={brand.brandId}
                    brand={brand}
                    rowNumber={(pageNumber - 1) * pageSize + index + 1}
                    onViewDetails={handleOpenDetailModal}
                    onEdit={handleOpenEditModal}
                  />
                ))}
            </TableBody>
          </Table>

          {showRefreshing && (
            <div className="border-t border-gray-100 px-5 py-2 text-right text-xs text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
              Updating table...
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center dark:border-white/[0.05]">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{pageRangeText}</span>
          <label htmlFor="brand-page-size" className="font-medium">
            Rows per page
          </label>
          <select
            id="brand-page-size"
            className={footerSelectClassName}
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {totalPages > 0 && (
          <Pagination
            currentPage={pageNumber}
            totalPages={totalPages}
            onPageChange={setPageNumber}
          />
        )}
      </div>

      <BrandFormModal
        isOpen={isFormModalOpen}
        mode={isEditMode ? "edit" : "create"}
        brand={editingBrand}
        isSubmitting={isSubmitting}
        onClose={handleCloseFormModal}
        onSubmit={handleSubmitBrand}
      />

      {isDetailModalOpen && viewingBrand && (
        <BrandDetailModal
          isOpen={isDetailModalOpen}
          brand={viewingBrand}
          onClose={handleCloseDetailModal}
        />
      )}
    </div>
  );
};

export default BrandTable;
