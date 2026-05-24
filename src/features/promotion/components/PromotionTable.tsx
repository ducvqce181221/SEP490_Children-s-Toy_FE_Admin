"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PromotionToolbar } from "./PromotionToolbar";
import Pagination from "@/components/common/Pagination";
import { usePromotions } from "../hooks/usePromotions";
import { usePromotionMutations } from "../hooks/usePromotionMutations";
import { PromotionRow } from "./PromotionRow";
import { PromotionListDto } from "../types/promotion";

export const PromotionTable = () => {
  const {
    searchQuery,
    filters,
    handleSearch,      
    handleFilters,     
    handleItemsPerPage,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    deletePromotion,
    setDeletePromotion,
    data,
    isLoading,
    error,
    refetch
  } = usePromotions();

  const { updatePromotion, deletePromotion: apiDeletePromotion } = usePromotionMutations(() => {
    // on success reload list
    refetch();
    setDeletePromotion(null);
  });

  const handleDeleteConfirm = async () => {
    if (deletePromotion) {
      await apiDeletePromotion(deletePromotion.promotionId);
    }
  };

  const handleInactive = async (promotion: PromotionListDto) => {
    await updatePromotion(promotion.promotionId, { status: "Inactive" });
  };

  const paginatedData = data?.items || [];
  const totalPages = data?.totalPages || 0;
  const totalItems = data?.totalCount || 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <PromotionToolbar 
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        filters={filters}
        onFilterChange={handleFilters}
      />

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[1102px]">
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
                  Promotion Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Type
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Duration
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
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
                paginatedData.map((promotion, index) => (
                  <PromotionRow 
                    key={promotion.promotionId}
                    rowNumber={(currentPage - 1) * itemsPerPage + index + 1}
                    promotion={promotion}
                    isDeleting={deletePromotion?.promotionId === promotion.promotionId}
                    onDeleteClick={() => setDeletePromotion(promotion)}
                    onDeleteCancel={() => setDeletePromotion(null)}
                    onDeleteConfirm={handleDeleteConfirm}
                    onInactive={() => handleInactive(promotion)}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No promotion found.
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
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} promotions
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
    </div>
  );
};
