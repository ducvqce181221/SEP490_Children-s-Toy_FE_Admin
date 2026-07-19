"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { useRefundDetail } from "../hooks/useRefundDetail";
import { formatDisplayDate } from "@/utils/date-utils";
import { formatCurrency } from "@/utils/format-utils";

interface RefundDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  refundId: number;
}

export const RefundDetailModal: React.FC<RefundDetailModalProps> = ({
  isOpen,
  onClose,
  refundId,
}) => {
  const { refundDetail: refund, isLoading, error } = useRefundDetail(isOpen ? refundId : null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RefundRequested":
      case "Requested":
        return <Badge size="sm" color="warning">Requested</Badge>;
      case "RefundApproved":
      case "Approved":
        return <Badge size="sm" color="success">Approved</Badge>;
      case "RefundPickupCreated":
      case "PickupCreated":
        return <Badge size="sm" color="info">Pickup Created</Badge>;
      case "RefundShipping":
      case "Shipping":
        return <Badge size="sm" color="info">Shipping</Badge>;
      case "RefundReceived":
      case "Received":
        return <Badge size="sm" color="info">Received</Badge>;
      case "RefundInspectionPending":
      case "InspectionPending":
        return <Badge size="sm" color="warning">Inspecting</Badge>;
      case "RefundCompleted":
      case "Completed":
        return <Badge size="sm" color="success">Completed</Badge>;
      case "RefundCancelled":
      case "Cancelled":
        return <Badge size="sm" color="light">Cancelled</Badge>;
      case "RefundRejected":
      case "Rejected":
        return <Badge size="sm" color="error">Rejected</Badge>;
      case "RefundDamage":
        return <Badge size="sm" color="error">Damaged</Badge>;
      case "RefundReturnShipmentCreated":
        return <Badge size="sm" color="info">Return Created</Badge>;
      case "RefundReturningToCustomer":
        return <Badge size="sm" color="info">Returning</Badge>;
      case "RefundReturnedToCustomer":
        return <Badge size="sm" color="success">Returned (Rejected)</Badge>;
      case "RefundReturnToCustomerFailed":
        return <Badge size="sm" color="error">Return Failed</Badge>;
      default:
        return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[900px] w-[90vw] p-0 overflow-hidden max-h-[90vh]">
      <div className="flex flex-col h-[90vh] max-h-[inherit]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/[0.05] bg-white dark:bg-gray-900 z-10 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Refund Details</h2>
          <p className="text-xs text-gray-500">ID: #{refundId}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
               <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error || !refund ? (
            <div className="flex justify-center items-center h-40 text-error-500">{error || "Refund not found"}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Information */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-1">Refund Information</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500">Order: {refund.orderCode}</span>
                      {getStatusBadge(refund.refundStatus)}
                      {refund.isSystemReturn && (
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          ⚙ System Return
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4 dark:bg-gray-700/50 rounded-lg p-3 bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold shrink-0">
                      {refund.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">{refund.customerName}</div>
                      <div className="text-xs text-gray-500 truncate">{refund.customerEmail}</div>
                    </div>
                  </div>
                  <div className="space-y-2 border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <span className="text-gray-500">Phone Number</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{refund.customerPhone || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <span className="text-gray-500 shrink-0">Address</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-right ml-4">{refund.customerAddress || "—"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Requested Amount</div>
                      <div className="font-semibold text-brand-600">{formatCurrency(refund.approvedAmount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Order Status</div>
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {refund.orderStatus}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Created Date</div>
                      <div className="text-gray-700 dark:text-gray-300">{formatDisplayDate(refund.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Payment Status</div>
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        {refund.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evidence Images */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Attached Evidence ({refund.images ? refund.images.length : 0})</h4>
                  {(!refund.images || refund.images.length === 0) ? (
                    <div className="text-center py-6 text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-700/20 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                      No images attached.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {refund.images.map((imgUrl, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt={`Evidence ${index + 1}`} className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Reason & Requester */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Refund Reason</h4>
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1">Category</div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{refund.refundReasonContent || "Not specified"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Customer Note</div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg italic min-h-[100px] whitespace-pre-wrap break-words break-all">
                      {refund.reasonDetails || "No additional details provided."}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">Process Info</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Requested By</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{refund.requestedByName || "System"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Request Date</span>
                      <span className="text-gray-700 dark:text-gray-400">{formatDisplayDate(refund.createdAt)}</span>
                    </div>
                    {refund.updatedAt && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Last Updated</span>
                        <span className="text-gray-700 dark:text-gray-400">{formatDisplayDate(refund.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-white/[0.05] flex justify-end bg-white dark:bg-gray-900 z-10 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};
