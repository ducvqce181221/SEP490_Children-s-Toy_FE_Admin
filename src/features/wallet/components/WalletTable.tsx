"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Pagination from "@/components/common/Pagination";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { PencilIcon } from "@/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDisplayDate } from "@/utils/date-utils";
import { useWalletMutations } from "../hooks/useWalletMutations";
import { useWallets } from "../hooks/useWallets";
import { WalletListItem } from "../types/wallet";
import WalletToolbar from "./WalletToolbar";

const headerCellClassName =
  "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";

const pageSizeOptions = [5, 10, 20, 50];

const footerSelectClassName =
  "h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

const statusSelectClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

const statusBadgeClassName: Record<WalletListItem["status"], string> = {
  Active: "bg-success-50 text-success-700 ring-success-600/20 dark:bg-success-500/10 dark:text-success-400",
  Frozen: "bg-blue-light-50 text-blue-light-700 ring-blue-light-500/20 dark:bg-blue-light-500/10 dark:text-blue-light-400",
};

const WalletTable = () => {
  const {
    wallets,
    totalCount,
    totalPages,
    accountSearch,
    statusFilter,
    pageNumber,
    pageSize,
    isLoading,
    error,
    setPageNumber,
    handleAccountSearchChange,
    handleSearchSubmit,
    handleStatusFilterChange,
    handlePageSizeChange,
    reloadWallets,
  } = useWallets();

  const { updateWalletStatus, updatingWalletId } = useWalletMutations(reloadWallets);
  const [editingWallet, setEditingWallet] = useState<WalletListItem | null>(null);

  const hasWallets = wallets.length > 0;
  const showInitialLoading = isLoading && !hasWallets;
  const showRefreshing = isLoading && hasWallets;

  const pageRangeText = useMemo(() => {
    if (totalCount === 0) {
      return "No data available";
    }

    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);
    return `Showing ${start} - ${end} / ${totalCount} wallets`;
  }, [pageNumber, pageSize, totalCount]);

  const handleOpenEditModal = (wallet: WalletListItem) => {
    if (wallet.status !== "Frozen") {
      return;
    }

    setEditingWallet(wallet);
  };

  const handleCloseEditModal = () => {
    setEditingWallet(null);
  };

  const handleSaveStatus = async () => {
    if (!editingWallet || editingWallet.status === "Active") {
      return;
    }

    const result = await updateWalletStatus(editingWallet.walletId, {
      status: "Active",
    });

    if (result.success) {
      toast.success(result.message);
      handleCloseEditModal();
      return;
    }

    toast.error(result.message);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <WalletToolbar
        accountSearch={accountSearch}
        onAccountSearchChange={handleAccountSearchChange}
        onSearchSubmit={handleSearchSubmit}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
      />

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[1020px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={headerCellClassName}>#</TableCell>
                <TableCell isHeader className={headerCellClassName}>WalletId</TableCell>
                <TableCell isHeader className={headerCellClassName}>Account</TableCell>
                <TableCell isHeader className={headerCellClassName}>Unbanned By</TableCell>
                <TableCell isHeader className={headerCellClassName}>Status</TableCell>
                <TableCell isHeader className={headerCellClassName}>CreatedAt</TableCell>
                <TableCell isHeader className={headerCellClassName}>UpdatedAt</TableCell>
                <TableCell isHeader className={headerCellClassName}>Actions</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {showInitialLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading wallet list...
                  </TableCell>
                </TableRow>
              )}

              {!showInitialLoading && error && (
                <TableRow>
                  <TableCell colSpan={8} className="px-5 py-10 text-center text-sm text-error-600">
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!showInitialLoading && !error && wallets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No matching wallets found.
                  </TableCell>
                </TableRow>
              )}

              {!error && wallets.map((wallet, index) => {
                return (
                  <TableRow key={wallet.walletId}>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {(pageNumber - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                      {wallet.walletId}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {wallet.account}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {wallet.unbannedByName?.trim() || "-"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeClassName[wallet.status]}`}
                      >
                        {wallet.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {formatDisplayDate(wallet.createdAt)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {wallet.updatedAt ? formatDisplayDate(wallet.updatedAt) : "-"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(wallet)}
                        className={
                          wallet.status === "Frozen"
                            ? "rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
                            : "cursor-not-allowed rounded-lg border border-gray-200 p-2 text-gray-300 opacity-50 dark:border-gray-800 dark:text-gray-600"
                        }
                        aria-label={
                          wallet.status === "Frozen"
                            ? `Edit wallet ${wallet.walletId} status`
                            : `Wallet ${wallet.walletId} is already active`
                        }
                        title={
                          wallet.status === "Frozen"
                            ? "Edit wallet status"
                            : "Only frozen wallets can be edited"
                        }
                        disabled={wallet.status !== "Frozen"}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
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
          <label htmlFor="wallet-page-size" className="font-medium">Rows per page</label>
          <select
            id="wallet-page-size"
            className={footerSelectClassName}
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
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

      <Modal
        isOpen={editingWallet !== null}
        onClose={handleCloseEditModal}
        className="max-w-[420px] p-5 lg:p-6"
      >
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Edit Wallet Status
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Wallet #{editingWallet?.walletId}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Account
            </label>
            <input
              className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              value={editingWallet?.account ?? ""}
              readOnly
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Status
            </label>
            <input
              className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              value={editingWallet?.status ?? ""}
              readOnly
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Status
            </label>
            <select
              className={statusSelectClassName}
              value="Active"
              disabled={editingWallet === null || updatingWalletId === editingWallet.walletId}
            >
              <option value="Active">Active</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCloseEditModal}
            disabled={editingWallet !== null && updatingWalletId === editingWallet.walletId}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSaveStatus()}
            disabled={
              editingWallet === null
              || editingWallet.status === "Active"
              || updatingWalletId === editingWallet.walletId
            }
          >
            {editingWallet !== null && updatingWalletId === editingWallet.walletId
              ? "Saving..."
              : "Save"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default WalletTable;
