"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReviewToolbar } from "./ReviewToolbar";
import Pagination from "@/components/common/Pagination";
import { useReviews } from "../hooks/useReviews";
import { ReviewRow } from "./ReviewRow";
import { ReviewDetailModal } from "./ReviewDetailModal";
import { Review, ReviewQuery } from "../types/review";

export const ReviewTable = () => {
  const {
    reviews,
    isLoading,
    error,
    totalCount,
    query,
    updateQuery,
  } = useReviews();

  const [viewReview, setViewReview] = useState<Review | null>(null);

  const handleSearch = (searchTerm: string) => updateQuery({ searchTerm, pageNumber: 1 });
  const handleFilters = (filters: Partial<ReviewQuery>) => updateQuery({ ...filters, pageNumber: 1 });
  const handleItemsPerPage = (pageSize: number) => updateQuery({ pageSize, pageNumber: 1 });
  const setCurrentPage = (pageNumber: number) => updateQuery({ pageNumber });

  const totalPages = Math.ceil(totalCount / (query.pageSize || 10));

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <ReviewToolbar 
        searchQuery={query.searchTerm || ""}
        onSearchChange={handleSearch}
        filters={query}
        onFilterChange={handleFilters}
      />

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[1102px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  #
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Product
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Customer
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Rating & Comment
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Media/Replies
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    Loading reviews...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-error-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <ReviewRow 
                    key={review.reviewId}
                    rowNumber={((query.pageNumber || 1) - 1) * (query.pageSize || 10) + index + 1}
                    review={review}
                    onView={() => setViewReview(review)}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    No reviews found matching your criteria.
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
              Showing {Math.min(((query.pageNumber || 1) - 1) * (query.pageSize || 10) + 1, totalCount)} - {Math.min((query.pageNumber || 1) * (query.pageSize || 10), totalCount)} / {totalCount} reviews
            </span>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select 
                value={query.pageSize || 10} 
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
            currentPage={query.pageNumber || 1}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {viewReview && (
        <ReviewDetailModal 
          isOpen={!!viewReview}
          reviewId={viewReview.reviewId}
          onClose={() => setViewReview(null)}
        />
      )}
    </div>
  );
};
