"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { useRefundDetail } from "../hooks/useRefundDetail";
import { formatDisplayDate } from "@/utils/date-utils";
import { useRefundMutations } from "../hooks/useRefundMutations";
import { RefundStatusModal } from "./RefundStatusModal";
import { ChevronLeftIcon } from "@/icons/index";
import { formatCurrency } from "@/utils/format-utils";

interface RefundEditViewProps {
  refundId: number;
}

export const RefundEditView: React.FC<RefundEditViewProps> = ({ refundId }) => {
  const router = useRouter();
  const { refundDetail: refund, isLoading, error, refetch } = useRefundDetail(refundId);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const { isSubmitting, updateStatus } = useRefundMutations(() => {
    setIsStatusModalOpen(false);
    refetch();
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved": return <Badge size="sm" color="success">Approved</Badge>;
      case "Completed": return <Badge size="sm" color="success">Completed</Badge>;
      case "Requested": return <Badge size="sm" color="warning">Requested</Badge>;
      case "Rejected": return <Badge size="sm" color="error">Rejected</Badge>;
      case "Cancelled": return <Badge size="sm" color="light">Cancelled</Badge>;
      default: return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !refund) {
    return (
      <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="text-error-500 mb-4">{error || "Refund not found"}</div>
        <Button variant="outline" onClick={() => router.push("/admin/refunds")}>
          Back to List
        </Button>
      </div>
    );
  }

  const canChangeStatus = refund.refundStatus === "Requested" || refund.refundStatus === "Approved";

  return (
    <div className="pb-10">
      <PageBreadcrumb
        pageTitle="Edit Refund"
        breadcrumbs={[
          { label: "Refund Management", href: "/admin/refunds" },
          { label: "Details" }
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/refunds")}
          className="gap-2"
        >
          <ChevronLeftIcon className="w-5 h-5" /> Back to List
        </Button>
        {canChangeStatus && (
          <Button variant="primary" size="sm" onClick={() => setIsStatusModalOpen(true)}>
            Change Status
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* L/R Split */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="font-bold text-gray-800 dark:text-white/90 text-xl">Refund Information</h3>
              <div className="flex items-center gap-3">
                {getStatusBadge(refund.refundStatus)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-500">Order Code</div>
                <div className="flex flex-col items-start gap-1 flex-wrap">
                  <div className="font-medium text-gray-800 dark:text-gray-200">{refund.orderCode}</div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {refund.orderStatus}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${refund.paymentStatus === "PAID"
                        ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800"
                      }`}>
                      {refund.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
              <div /> {/* Empty cell to skip Order ID */}
              <div>
                <div className="text-sm text-gray-500">Requested Amount</div>
                <div className="font-semibold text-brand-500">{formatCurrency(refund.approvedAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Date Created</div>
                <div className="font-medium text-gray-800 dark:text-gray-200">{formatDisplayDate(refund.createdAt)}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="text-sm text-gray-500 mb-1.5">Customer Information</div>
              <div className="flex items-center gap-4 dark:bg-gray-700/30 rounded-xl p-3 bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg">
                  {refund.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 dark:text-white/90">{refund.customerName}</div>
                  <div className="text-sm text-gray-500">{refund.customerPhone}</div>
                  <div className="text-sm text-gray-500">{refund.customerEmail}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section moved to Left Column */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h4 className="font-bold text-gray-800 dark:text-white/90 mb-4 flex items-center gap-2">
              Attached Evidence <Badge size="sm" color="light">{refund.images ? refund.images.length : 0}</Badge>
            </h4>

            {(!refund.images || refund.images.length === 0) ? (
              <div className="text-center py-10 text-sm text-gray-400 italic bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                No images attached.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {refund.images.map((imgUrl, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Evidence ${index + 1}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Refund Reason moved to Right Column */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h4 className="font-bold text-gray-800 dark:text-white/90 mb-4">Refund Reason</h4>
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Category</div>
              <div className="font-medium text-gray-800 dark:text-gray-200">{refund.refundReasonContent || "Not specified"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1.5">Customer Note</div>
              <div className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl min-h-[100px] whitespace-pre-wrap italic">
                {refund.reasonDetails || "No additional details provided."}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="text-sm text-gray-500 mb-1">Requested By</div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">{refund.requestedByName || "System"}</span>
                <span className="text-xs text-gray-400">({formatDisplayDate(refund.createdAt)})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RefundStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        currentStatus={refund.refundStatus}
        isSubmitting={isSubmitting}
        onSave={(data) => updateStatus(refund.refundId, data)}
      />
    </div>
  );
};
