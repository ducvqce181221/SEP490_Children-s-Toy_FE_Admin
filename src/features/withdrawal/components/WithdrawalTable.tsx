"use client";

import React, { useMemo, useState } from "react";
import Pagination from "@/components/common/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWithdrawals } from "../hooks/useWithdrawals";
import WithdrawalToolbar from "./WithdrawalToolbar";
import { WithdrawalRow } from "./WithdrawalRow";
import WithdrawalDetailModal from "./WithdrawalDetailModal";

const headerCellClassName =
  "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";

const pageSizeOptions = [5, 10, 20, 50];

const footerSelectClassName =
  "h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

const WithdrawalTable = () => {
  const {
    withdrawals,
    isLoading,
    error,
    keyword,
    status,
    dateFrom,
    dateTo,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    detail,
    isDetailLoading,
    detailError,
    selectedId,
    handleKeywordChange,
    handleSearchSubmit,
    handleStatusChange,
    handleFromDateChange,
    handleToDateChange,
    handlePageSizeChange,
    clearFilters,
    setPageNumber,
    openDetailModal,
    closeDetailModal,
  } = useWithdrawals();

  const pageRangeText = useMemo(() => {
    if (totalCount === 0) {
      return "No data available";
    }

    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);

    return `Showing ${start} - ${end} of ${totalCount} requests`;
  }, [pageNumber, pageSize, totalCount]);

  const hasWithdrawals = withdrawals.length > 0;
  const showInitialLoading = isLoading && !hasWithdrawals;
  const showRefreshing = isLoading && hasWithdrawals;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <WithdrawalToolbar
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        onSearchSubmit={handleSearchSubmit}
        status={status}
        onStatusChange={handleStatusChange}
        dateFrom={dateFrom}
        onFromDateChange={handleFromDateChange}
        dateTo={dateTo}
        onToDateChange={handleToDateChange}
        clearFilters={clearFilters}
        totalCount={totalCount}
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
                  Request Code
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Customer Name
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Amount
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Bank & Account Details
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Status
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Created At
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
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                      <span>Loading withdrawal history...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!showInitialLoading && error && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-error-600 font-medium"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!showInitialLoading && !error && withdrawals.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="px-5 py-16 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No matching withdrawal requests found.
                  </TableCell>
                </TableRow>
              )}

              {!error &&
                withdrawals.length > 0 &&
                withdrawals.map((withdrawal, index) => (
                  <WithdrawalRow
                    key={withdrawal.withdrawalId}
                    withdrawal={withdrawal}
                    rowNumber={(pageNumber - 1) * pageSize + index + 1}
                    onViewDetails={openDetailModal}
                  />
                ))}
            </TableBody>
          </Table>

          {showRefreshing && (
            <div className="border-t border-gray-100 px-5 py-2 text-right text-xs text-gray-400 dark:border-white/[0.05] dark:text-gray-500">
              Refreshing data...
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center dark:border-white/[0.05]">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{pageRangeText}</span>
          <label htmlFor="withdrawal-page-size" className="font-medium">
            Rows per page
          </label>
          <select
            id="withdrawal-page-size"
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

      {/* Details Modal */}
      <WithdrawalDetailModal
        isOpen={selectedId !== null}
        onClose={closeDetailModal}
        detail={detail}
        isLoading={isDetailLoading}
        error={detailError}
      />
    </div>
  );
};

export default WithdrawalTable;
