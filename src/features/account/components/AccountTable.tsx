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
import { useAccountMutations } from "../hooks/useAccountMutations";
import { useAccounts } from "../hooks/useAccounts";
import { CreateAccountRequest, CreateAccountResult } from "../types/account";
import AccountDetailModal from "./AccountDetailModal";
import AccountFormModal from "./AccountFormModal";
import { AccountRow } from "./AccountRow";
import AccountToolbar from "./AccountToolbar";

const headerCellClassName =
  "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";

const pageSizeOptions = [5, 10, 20, 50];

const footerSelectClassName =
  "h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

const AccountTable = () => {
  const {
    accounts,
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
    reloadAccounts,
  } = useAccounts();

  const {
    createAccount,
    updateAccountStatus,
    updateAccountPassword,
    isCreating,
    updatingAccountId,
    updatingPasswordAccountId,
  } =
    useAccountMutations(reloadAccounts);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetailAccountId, setSelectedDetailAccountId] = useState<number | null>(
    null,
  );
  const [selectedEditAccountId, setSelectedEditAccountId] = useState<number | null>(null);

  const pageRangeText = useMemo(() => {
    if (totalCount === 0) {
      return "No data available";
    }

    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);

    return `Showing ${start} - ${end} / ${totalCount} accounts`;
  }, [pageNumber, pageSize, totalCount]);

  const hasAccounts = accounts.length > 0;
  const showInitialLoading = isLoading && !hasAccounts;
  const showRefreshing = isLoading && hasAccounts;

  const handleCreateAccount = async (
    payload: CreateAccountRequest,
  ): Promise<CreateAccountResult> => {
    const result = await createAccount(payload);

    if (result.success) {
      toast.success(result.message);
      setIsCreateModalOpen(false);
      return result;
    }

    if (!result.validationErrors) {
      toast.error(result.message);
    }

    return result;
  };

  const handleUpdateAccountStatus = async (
    accountId: number,
    isActive: boolean,
  ): Promise<boolean> => {
    const result = await updateAccountStatus(accountId, isActive);

    if (result.success) {
      toast.success(result.message);
      return true;
    }

    toast.error(result.message);
    return false;
  };

  const handleUpdateAccountPassword = async (
    accountId: number,
    payload: { newPassword: string; confirmNewPassword: string },
  ): Promise<boolean> => {
    const result = await updateAccountPassword(accountId, payload);
    if (result.success) {
      toast.success(result.message);
      return true;
    }

    toast.error(result.message);
    return false;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <AccountToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortDesc={sortDesc}
        onSortDirectionChange={handleSortDirectionChange}
        onAddClick={() => setIsCreateModalOpen(true)}
      />

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[1200px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={headerCellClassName}>
                  #
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Account
                </TableCell>
                <TableCell isHeader className={headerCellClassName}>
                  Role
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
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading account list...
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

              {!showInitialLoading && !error && accounts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No matching accounts found.
                  </TableCell>
                </TableRow>
              )}

              {!error &&
                accounts.length > 0 &&
                accounts.map((account, index) => (
                  <AccountRow
                    key={account.accountId}
                    account={account}
                    rowNumber={(pageNumber - 1) * pageSize + index + 1}
                    onOpenDetail={setSelectedDetailAccountId}
                    onOpenEdit={setSelectedEditAccountId}
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
          <label htmlFor="account-page-size" className="font-medium">
            Rows per page
          </label>
          <select
            id="account-page-size"
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

      <AccountFormModal
        isOpen={isCreateModalOpen}
        isSubmitting={isCreating}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAccount}
      />

      <AccountDetailModal
        accountId={selectedDetailAccountId}
        isOpen={selectedDetailAccountId !== null}
        mode="detail"
        onClose={() => setSelectedDetailAccountId(null)}
      />

      <AccountDetailModal
        accountId={selectedEditAccountId}
        isOpen={selectedEditAccountId !== null}
        mode="edit"
        isSavingStatus={
          selectedEditAccountId !== null &&
          updatingAccountId === selectedEditAccountId
        }
        isSavingPassword={
          selectedEditAccountId !== null &&
          updatingPasswordAccountId === selectedEditAccountId
        }
        onUpdateStatus={handleUpdateAccountStatus}
        onUpdatePassword={handleUpdateAccountPassword}
        onClose={() => setSelectedEditAccountId(null)}
      />
    </div>
  );
};

export default AccountTable;
