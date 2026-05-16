"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VoucherToolbar } from "./VoucherToolbar";
import { VoucherFormModal } from "./VoucherFormModal";
import Pagination from "@/components/common/Pagination";
import { useVouchers } from "../hooks/useVouchers";
import { useVoucherMutations } from "../hooks/useVoucherMutations";
import { VoucherRow } from "./VoucherRow";
import { VoucherFormData, Voucher } from "../types/voucher";
import { useAuthContext } from "@/context/AuthContext";
import { VoucherRejectModal } from "./VoucherRejectModal";
import { useState, useCallback } from "react";

export const VoucherTable = () => {
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
    editVoucher,
    setEditVoucher,
    viewVoucher,
    setViewVoucher,
    deleteVoucher,
    setDeleteVoucher,
    data,
    isLoading,
    error,
    refetch
  } = useVouchers();

  const { account } = useAuthContext();
  const [rejectVoucherItem, setRejectVoucherItem] = useState<Voucher | null>(null);

  const { createVoucher, updateVoucher, deleteVoucher: apiDeleteVoucher, approveVoucher, rejectVoucher, isSubmitting } = useVoucherMutations(() => {
    // on success reload list
    refetch();
    setIsModalOpen(false);
    setEditVoucher(null);
    setViewVoucher(null);
    setDeleteVoucher(null);
    setRejectVoucherItem(null);
  });

  const handleSave = useCallback(async (formData: VoucherFormData) => {
    if (editVoucher) {
      await updateVoucher(editVoucher.voucherId, formData);
    } else {
      await createVoucher(formData);
    }
  }, [editVoucher, updateVoucher, createVoucher]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditVoucher(null);
    setViewVoucher(null);
  }, [setIsModalOpen, setEditVoucher, setViewVoucher]);

  const handleDeleteConfirm = async () => {
    if (deleteVoucher) {
      await apiDeleteVoucher(deleteVoucher.voucherId);
    }
  };

  const handleApprove = async (voucher: Voucher) => {
    await approveVoucher(voucher.voucherId);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (rejectVoucherItem) {
      await rejectVoucher(rejectVoucherItem.voucherId, reason);
    }
  };

  const handleInactive = async (voucher: Voucher) => {
    await updateVoucher(voucher.voucherId, { status: "Inactive" });
  };

  const paginatedData = data?.items || [];
  const totalPages = data?.totalPages || 0;
  const totalItems = data?.totalCount || 0;

  const currentModalMode = viewVoucher ? "detail" : editVoucher ? "edit" : "create";
  const currentVoucherId = viewVoucher?.voucherId || editVoucher?.voucherId || null;
  const isFormModalOpen = isModalOpen || !!editVoucher || !!viewVoucher;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <VoucherToolbar 
        onAddClick={() => setIsModalOpen(true)}
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
                  Voucher Info
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Discount
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Usage
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
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-error-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((voucher, index) => (
                  <VoucherRow 
                    key={voucher.voucherId}
                    rowNumber={(currentPage - 1) * itemsPerPage + index + 1}
                    voucher={voucher}
                    isDeleting={deleteVoucher?.voucherId === voucher.voucherId}
                    onView={() => setViewVoucher(voucher)}
                    onEdit={() => setEditVoucher(voucher)}
                    onDeleteClick={() => setDeleteVoucher(voucher)}
                    onDeleteCancel={() => setDeleteVoucher(null)}
                    onDeleteConfirm={handleDeleteConfirm}
                    onApprove={() => handleApprove(voucher)}
                    onReject={() => setRejectVoucherItem(voucher)}
                    onInactive={() => handleInactive(voucher)}
                    roleName={account?.roleName}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    No vouchers found matching your criteria.
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
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} vouchers
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

      <VoucherFormModal 
        key={currentVoucherId || "create"}
        isOpen={isFormModalOpen} 
        mode={currentModalMode}
        voucherId={currentVoucherId}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onClose={handleCloseModal} 
      />

      <VoucherRejectModal
        isOpen={!!rejectVoucherItem}
        onClose={() => setRejectVoucherItem(null)}
        onConfirm={handleRejectConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
