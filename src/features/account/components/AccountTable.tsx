"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import AccountToolbar from "./AccountToolbar";
import AccountFormModal from "./AccountFormModal";
import Pagination from "../../../components/tables/Pagination";
import { useAccounts } from "../hooks/useAccounts";
import { AccountRow } from "./AccountRow";

export default function AccountTable() {
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
    editAccount,
    setEditAccount,
    deleteAccount,
    setDeleteAccount,
    filteredData,
    paginatedData,
    totalPages,
  } = useAccounts();

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <AccountToolbar 
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
                  User
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Role
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Join Date
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
              {paginatedData.length > 0 ? (
                paginatedData.map((account) => (
                  <AccountRow 
                    key={account.id}
                    account={account}
                    isDeleting={deleteAccount?.id === account.id}
                    onEdit={() => setEditAccount(account)}
                    onDeleteClick={() => setDeleteAccount(account)}
                    onDeleteCancel={() => setDeleteAccount(null)}
                    onDeleteConfirm={() => {
                      // Implementation for actual deletion goes here
                      setDeleteAccount(null);
                    }}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-10 text-center text-gray-500">
                    No accounts found matching your criteria.
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
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
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

      <AccountFormModal 
        key={editAccount?.id || "create"}
        isOpen={isModalOpen || !!editAccount} 
        initialData={editAccount}
        onClose={() => {
          setIsModalOpen(false);
          setEditAccount(null);
        }} 
      />
    </div>
  );
}
