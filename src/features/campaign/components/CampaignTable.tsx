"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import { useAuthContext } from "@/context/AuthContext";
import { CampaignReviewModal } from "./CampaignReviewModal";
import { campaignSchedulePath } from "../utils/campaign-navigation";

export const CampaignTable = () => {
  const router = useRouter();
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
    editCampaignId,
    setEditCampaignId,
    data,
    isLoading,
    error,
    refetch,
  } = useCampaigns();

  const { account } = useAuthContext();

  const [cancelId, setCancelId] = useState<number | null>(null);
  const [submitId, setSubmitId] = useState<number | null>(null);
  const [reviewId, setReviewId] = useState<number | null>(null);

  const { createCampaign, updateCampaign, cancelCampaign, submitCampaign, reviewCampaign, isSubmitting } = useCampaignMutations(() => {
    refetch();
    setIsModalOpen(false);
    setEditCampaignId(null);
    setSubmitId(null);
    setReviewId(null);
  });

  const isFormModalOpen = isModalOpen || editCampaignId !== null;
  const currentModalMode = editCampaignId ? "edit" : "create";
  const currentCampaignId = editCampaignId;

  const handleSave = async (formData: CampaignFormData) => {
    if (currentModalMode === "edit" && currentCampaignId) {
      await updateCampaign(currentCampaignId, formData);
    } else {
      await createCampaign(formData);
    }
  };

  const handleCancelClick = (id: number) => {
    setCancelId(id);
  };

  const handleConfirmCancel = async () => {
    if (cancelId) {
      await cancelCampaign(cancelId);
      setCancelId(null);
    }
  };

  const handleConfirmSubmit = async () => {
    if (submitId) {
      await submitCampaign(submitId);
      setSubmitId(null);
    }
  };

  const handleApprove = async () => {
    if (reviewId) {
      await reviewCampaign(reviewId, { action: "Approved" });
    }
  };

  const handleReject = async (reason: string) => {
    if (reviewId) {
      await reviewCampaign(reviewId, { action: "Rejected", reviewNote: reason });
    }
  };

  const paginatedData = data?.items || [];
  const totalItems = data?.totalCount || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

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
                    roleName={account?.roleName}
                    onEdit={() => setEditCampaignId(campaign.campaignId)}
                    onCancel={() => handleCancelClick(campaign.campaignId)}
                    onSubmit={() => setSubmitId(campaign.campaignId)}
                    onReview={() => setReviewId(campaign.campaignId)}
                    onSchedule={() => router.push(campaignSchedulePath(campaign.campaignId, "schedule"))}
                    onReschedule={
                      campaign.status === "Scheduled" &&
                      (campaign.maxRescheduleCount == null ||
                        (campaign.rescheduleCount ?? 0) < campaign.maxRescheduleCount)
                        ? () => router.push(campaignSchedulePath(campaign.campaignId, "reschedule"))
                        : undefined
                    }
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
          setEditCampaignId(null);
        }}
      />

      <ConfirmModal
        isOpen={cancelId !== null}
        onClose={() => setCancelId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Campaign"
        message="Are you sure you want to cancel this campaign? This action cannot be undone."
        confirmText="Cancel Campaign"
        isDestructive={true}
        isLoading={isSubmitting}
      />

      <ConfirmModal
        isOpen={submitId !== null}
        onClose={() => setSubmitId(null)}
        onConfirm={handleConfirmSubmit}
        title="Submit for Approval"
        message="Are you sure you want to submit this campaign for Admin approval? Once submitted, you will not be able to edit it until it has been reviewed."
        confirmText="Submit"
        isDestructive={false}
        isLoading={isSubmitting}
      />

      <CampaignReviewModal
        isOpen={reviewId !== null}
        onClose={() => setReviewId(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
