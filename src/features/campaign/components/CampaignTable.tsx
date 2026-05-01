"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignToolbar } from "./CampaignToolbar";
import { CampaignFormModal } from "./CampaignFormModal";
import Pagination from "@/components/common/Pagination";
import { useCampaigns } from "../hooks/useCampaigns";
import { useCampaignMutations } from "../hooks/useCampaignMutations";
import { CampaignRow } from "./CampaignRow";
import { CampaignFormData } from "../types/campaign";

export const CampaignTable = () => {
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
    viewCampaignId,
    setViewCampaignId,
    editCampaignId,
    setEditCampaignId,
    data,
    isLoading,
    error,
    refetch,
  } = useCampaigns();

  const { createCampaign, updateCampaign, cancelCampaign, isSubmitting } = useCampaignMutations(() => {
    refetch();
    setIsModalOpen(false);
    setViewCampaignId(null);
    setEditCampaignId(null);
  });

  const handleSave = async (formData: CampaignFormData) => {
    if (currentModalMode === "edit" && currentCampaignId) {
      await updateCampaign(currentCampaignId, formData);
    } else {
      await createCampaign(formData);
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy chiến dịch này không? Hành động này không thể hoàn tác.")) {
      await cancelCampaign(id);
    }
  };

  const paginatedData = data?.items || [];
  const totalItems = data?.totalCount || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const isFormModalOpen = isModalOpen || viewCampaignId !== null || editCampaignId !== null;
  const currentModalMode = viewCampaignId ? "detail" : editCampaignId ? "edit" : "create";
  const currentCampaignId = viewCampaignId || editCampaignId;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <CampaignToolbar
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
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">#</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Campaign Name</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Template</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Source</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Target</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Scheduled At</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Actions</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-5 py-10 text-center text-gray-500">
                    Loading campaigns...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-5 py-10 text-center text-error-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((campaign, index) => (
                  <CampaignRow
                    key={campaign.campaignId}
                    rowNumber={(currentPage - 1) * itemsPerPage + index + 1}
                    campaign={campaign}
                    onView={() => setViewCampaignId(campaign.campaignId)}
                    onEdit={() => setEditCampaignId(campaign.campaignId)}
                    onCancel={() => handleCancel(campaign.campaignId)}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="px-5 py-10 text-center text-gray-500">
                    No campaigns found matching your criteria.
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
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} campaigns
            </span>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPage(Number(e.target.value))}
                className="py-1 px-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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

      <CampaignFormModal
        key={currentCampaignId ?? "create"}
        isOpen={isFormModalOpen}
        mode={currentModalMode}
        campaignId={currentCampaignId}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onClose={() => {
          setIsModalOpen(false);
          setViewCampaignId(null);
          setEditCampaignId(null);
        }}
      />
    </div>
  );
};
