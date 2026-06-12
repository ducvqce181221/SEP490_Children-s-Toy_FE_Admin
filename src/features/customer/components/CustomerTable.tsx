"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Pagination from "@/components/common/Pagination";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LockIcon } from "@/icons";
import { useCustomerMutations } from "../hooks/useCustomerMutations";
import { useCustomers } from "../hooks/useCustomers";
import { UpdateCustomerRequest } from "../types/customer";
import CustomerDetailModal from "./CustomerDetailModal";
import CustomerEditModal from "./CustomerEditModal";
import { CustomerRow } from "./CustomerRow";
import CustomerToolbar from "./CustomerToolbar";

const headerCellClassName =
  "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";

const pageSizeOptions = [5, 10, 20, 50];

const footerSelectClassName =
  "h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

const CustomerTable = () => {
  const {
    customers,
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
    reloadCustomers,
  } = useCustomers();

  const {
    updateCustomer,
    blockCustomerForDeliveryAbuse,
    updatingCustomerId,
    blockingCustomerId,
  } = useCustomerMutations(reloadCustomers);

  const [selectedDetailCustomerId, setSelectedDetailCustomerId] = useState<number | null>(
    null,
  );
  const [selectedEditCustomerId, setSelectedEditCustomerId] = useState<number | null>(null);
  const [selectedBlockCustomerId, setSelectedBlockCustomerId] = useState<number | null>(null);

  const selectedBlockCustomer = useMemo(
    () => customers.find((customer) => customer.accountId === selectedBlockCustomerId) ?? null,
    [customers, selectedBlockCustomerId],
  );

  const pageRangeText = useMemo(() => {
    if (totalCount === 0) {
      return "No data available";
    }

    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);

    return `Showing ${start} - ${end} / ${totalCount} customers`;
  }, [pageNumber, pageSize, totalCount]);

  const hasCustomers = customers.length > 0;
  const showInitialLoading = isLoading && !hasCustomers;
  const showRefreshing = isLoading && hasCustomers;

  const handleUpdateCustomer = async (
    customerId: number,
    payload: UpdateCustomerRequest,
  ) => {
    const result = await updateCustomer(customerId, payload);

    if (result.success) {
      toast.success(result.message);
      setSelectedEditCustomerId(null);
      return result;
    }

    if (!result.validationErrors) {
      toast.error(result.message);
    }

    return result;
  };

  const handleConfirmBlock = async () => {
    if (!selectedBlockCustomer) {
      return;
    }

    const result = await blockCustomerForDeliveryAbuse(selectedBlockCustomer.accountId, {
      note: "Admin manually locked the account after reviewing repeated unpaid COD delivery failures.",
    });

    if (result.success) {
      toast.success(result.message);
      setSelectedBlockCustomerId(null);
      return;
    }

    toast.error(result.message);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <CustomerToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortDesc={sortDesc}
        onSortDirectionChange={handleSortDirectionChange}
      />

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[1180px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={headerCellClassName}>
                  #
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Customer
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Status
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Delivery Abuse
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Risk Status
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
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading customer list...
                  </TableCell>
                </TableRow>
              )}

              {!showInitialLoading && error && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-error-600"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!showInitialLoading && !error && customers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No matching customers found.
                  </TableCell>
                </TableRow>
              )}

              {!error &&
                customers.length > 0 &&
                customers.map((customer, index) => (
                  <CustomerRow
                    key={customer.accountId}
                    customer={customer}
                    rowNumber={(pageNumber - 1) * pageSize + index + 1}
                    onOpenDetail={setSelectedDetailCustomerId}
                    onOpenEdit={setSelectedEditCustomerId}
                    onOpenBlock={setSelectedBlockCustomerId}
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
          <label htmlFor="customer-page-size" className="font-medium">
            Rows per page
          </label>
          <select
            id="customer-page-size"
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

      <CustomerDetailModal
        customerId={selectedDetailCustomerId}
        isOpen={selectedDetailCustomerId !== null}
        onClose={() => setSelectedDetailCustomerId(null)}
      />

      <CustomerEditModal
        customerId={selectedEditCustomerId}
        isOpen={selectedEditCustomerId !== null}
        isSubmitting={
          selectedEditCustomerId !== null &&
          updatingCustomerId === selectedEditCustomerId
        }
        onSubmit={handleUpdateCustomer}
        onClose={() => setSelectedEditCustomerId(null)}
      />

      <Modal
        isOpen={selectedBlockCustomer !== null}
        onClose={() => setSelectedBlockCustomerId(null)}
        className="max-w-[520px] p-6 lg:p-7"
      >
        <div className="flex items-start gap-4 pr-10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-error-50 text-error-500 dark:bg-error-500/10 dark:text-error-400">
            <LockIcon />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lock customer account?
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              This will deactivate the customer account, record the delivery-abuse case,
              and send the customer an email notification.
            </p>
          </div>
        </div>

        {selectedBlockCustomer && (
          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="font-medium text-gray-900 dark:text-white">
              {selectedBlockCustomer.accountName}
            </p>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {selectedBlockCustomer.email}
            </p>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Suspicious COD failed orders:{" "}
              <span className="font-semibold text-error-600">
                {selectedBlockCustomer.suspiciousDeliveryFailOrderCount}
              </span>
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setSelectedBlockCustomerId(null)}
            disabled={blockingCustomerId !== null}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-error-500 hover:bg-error-600 disabled:bg-error-300"
            onClick={handleConfirmBlock}
            disabled={blockingCustomerId !== null}
            startIcon={<LockIcon />}
          >
            {blockingCustomerId !== null ? "Locking..." : "Lock Account"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerTable;
