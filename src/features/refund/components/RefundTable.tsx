"use client";

import React, { useState } from "react";
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
import { RefundDetailModal } from "./RefundDetailModal";
import { Refund, RefundFilter } from "../types/refund";

export const RefundTable = () => {
  const {
    refunds,
    isLoading,
    error,
    totalCount,
    query,
    updateQuery,
  } = useRefunds();
  
  const [viewRefund, setViewRefund] = useState<Refund | null>(null);

  const handleSearch = (searchTerm: string) => {
    const orderId = searchTerm ? parseInt(searchTerm) : undefined;
    updateQuery({ orderId: isNaN(orderId as number) ? undefined : orderId, page: 1 });
  };
  
  const handleFilters = (filters: Partial<RefundFilter>) => updateQuery({ ...filters, page: 1 });
  const handleItemsPerPage = (pageSize: number) => updateQuery({ pageSize, page: 1 });
  const setCurrentPage = (page: number) => updateQuery({ page });

  const totalPages = Math.ceil(totalCount / (query.pageSize || 10));

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <RefundToolbar 
        orderIdQuery={query.orderId?.toString() || ""}
        onOrderIdChange={handleSearch}
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
                  Order
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Customer
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Amount & Date
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Request By
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
                    Loading refunds...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-error-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : refunds.length > 0 ? (
                refunds.map((refund, index) => (
                  <RefundRow 
                    key={refund.refundId}
                    rowNumber={((query.page || 1) - 1) * (query.pageSize || 10) + index + 1}
                    refund={refund}
                    onView={() => setViewRefund(refund)}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    No refunds found matching your criteria.
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
              Showing {Math.min(((query.page || 1) - 1) * (query.pageSize || 10) + 1, totalCount)} - {Math.min((query.page || 1) * (query.pageSize || 10), totalCount)} / {totalCount} refunds
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
            currentPage={query.page || 1}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {viewRefund && (
        <RefundDetailModal 
          isOpen={!!viewRefund}
          refundId={viewRefund.refundId}
          onClose={() => setViewRefund(null)}
        />
      )}
    </div>
  );
};
