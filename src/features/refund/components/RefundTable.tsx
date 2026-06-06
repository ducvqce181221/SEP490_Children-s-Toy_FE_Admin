"use client";

import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefundToolbar } from "./RefundToolbar";
import Pagination from "@/components/common/Pagination";
import { useRefunds } from "../hooks/useRefunds";
import { RefundRow } from "./RefundRow";

export const RefundTable = () => {
  const {
    refunds,
    isLoading,
    error,
    keyword,
    refundStatus,
    workTab,
    fromDate,
    toDate,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    roleName,
    handleKeywordChange,
    handleSearchSubmit,
    handleStatusChange,
    handleWorkTabChange,
    handleFromDateChange,
    handleToDateChange,
    handlePageSizeChange,
    setPageNumber,
  } = useRefunds();

  const pageRangeText = useMemo(() => {
    if (totalCount === 0) {
      return "No data";
    }
    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);
    return `Showing ${start} - ${end} / ${totalCount} refunds`;
  }, [pageNumber, pageSize, totalCount]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <RefundToolbar
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        onSearchSubmit={handleSearchSubmit}
        refundStatus={refundStatus}
        onStatusChange={handleStatusChange}
        fromDate={fromDate}
        onFromDateChange={handleFromDateChange}
        toDate={toDate}
        onToDateChange={handleToDateChange}
        roleName={roleName}
        totalCount={totalCount}
        workTab={workTab}
        onWorkTabChange={handleWorkTabChange}
      />

      {/* ERROR */}
      {error && !isLoading && (
        <div className="mx-5 mb-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          <p>{error}</p>
        </div>
      )}

      {/* TABLE */}
      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[1102px]">
          <Table>
            <TableHeader className="border-y border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-white/[0.02]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  #
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-xs text-start font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6">
                  Order / Refund Code
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-xs text-start font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Customer
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-xs text-start font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Amount & Date
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-xs text-start font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Assigned
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-xs text-start font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading refunds...
                  </TableCell>
                </TableRow>
              ) : refunds.length > 0 ? (
                refunds.map((refund, index) => (
                  <RefundRow
                    key={refund.refundId}
                    rowNumber={(pageNumber - 1) * pageSize + index + 1}
                    refund={refund}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No refunds found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center dark:border-white/[0.05]">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{pageRangeText}</span>
          <label htmlFor="refund-page-size" className="font-medium">
            Rows
          </label>
          <select
            id="refund-page-size"
            className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((option) => (
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
    </div>
  );
};
