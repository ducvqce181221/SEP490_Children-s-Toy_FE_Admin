"use client";

import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/common/Pagination";
import OrderToolbar from "./OrderToolbar";
import { OrderRow } from "./OrderRow";
import { useOrders } from "../hooks/useOrders";

export default function OrderTable() {
  const {
    orders,
    isLoading,
    error,
    keyword,
    statusId,
    assignedToMe,
    workTab,
    fromDate,
    toDate,
    pageNumber,
    pageSize,
    totalPages,
    totalCount,
    roleName,
    defaultStatusIds,
    handleKeywordChange,
    handleSearchSubmit,
    handleStatusChange,
    handleAssignedToMeChange,
    handleWorkTabChange,
    handleFromDateChange,
    handleToDateChange,
    handlePageSizeChange,
    setPageNumber,
    reloadOrders,
  } = useOrders();

  const router = useRouter();

  const pageRangeText = useMemo(() => {
    if (totalCount === 0) {
      return "No data";
    }

    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);

    return `Showing ${start} - ${end} / ${totalCount} orders`;
  }, [pageNumber, pageSize, totalCount]);

  // ── Detail handlers
  const handleOpenDetail = useCallback((id: number) => {
    router.push(`/admin/orders/${id}`);
  }, [router]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <OrderToolbar
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        onSearchSubmit={handleSearchSubmit}
        statusId={statusId}
        onStatusChange={handleStatusChange}
        assignedToMe={assignedToMe}
        onAssignedToMeChange={handleAssignedToMeChange}
        fromDate={fromDate}
        onFromDateChange={handleFromDateChange}
        toDate={toDate}
        onToDateChange={handleToDateChange}
        roleName={roleName}
        defaultStatusIds={defaultStatusIds}
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
        <div className="min-w-[1100px]">
          <Table>
          <TableHeader className="border-y border-gray-100 bg-gray-50/50 dark:border-white/[0.05] dark:bg-white/[0.02]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                #
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6">
                Order / Status
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Customer
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Assigned
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Date
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading data...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, index) => (
                <OrderRow
                  key={order.orderId}
                  order={order}
                  rowNumber={(pageNumber - 1) * pageSize + index + 1}
                  onOpenDetail={handleOpenDetail}
                />
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center dark:border-white/[0.05]">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{pageRangeText}</span>
          <label htmlFor="order-page-size" className="font-medium">
            Rows
          </label>
          <select
            id="order-page-size"
            className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
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
}
