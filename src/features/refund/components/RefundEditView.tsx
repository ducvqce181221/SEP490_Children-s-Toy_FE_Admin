"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { useRefundDetail } from "../hooks/useRefundDetail";
import { formatDisplayDate } from "@/utils/date-utils";
import { useRefundMutations } from "../hooks/useRefundMutations";
import { RefundStatusModal, getNextStatus } from "./RefundStatusModal";
import { formatCurrency } from "@/utils/format-utils";
import { useAuthContext } from "@/context/AuthContext";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import { OrderAssignModal } from "@/features/order/components/OrderActionModals";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import TextArea from "@/components/form/input/TextArea";

interface RefundEditViewProps {
  refundId: number;
  isViewOnly?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDt = (v: string | null | undefined) => formatDisplayDate(v, "—");

function cleanStatusName(status: string) {
  switch (status) {
    case "RefundRequested": return "Requested";
    case "RefundApproved": return "Approved";
    case "RefundPickupCreated": return "Pickup Created";
    case "RefundShipping": return "Shipping";
    case "RefundReceived": return "Received";
    case "RefundInspectionPending": return "Inspection Pending";
    case "RefundCompleted": return "Completed";
    case "RefundCancelled": return "Cancelled";
    case "RefundRejected": return "Rejected";
    case "RefundDamage": return "Damaged";
    case "RefundReturnShipmentCreated": return "Return Shipment Created";
    case "RefundReturningToCustomer": return "Returning to Customer";
    case "RefundReturnedToCustomer": return "Returned to Customer (Rejected)";
    case "RefundReturnToCustomerFailed": return "Return to Customer Failed";
    default:
      if (status && status.startsWith("Refund")) {
        return status.substring(6);
      }
      return status;
  }
}

// ─── Inline badge components ───────────────────────────────────────────────────
function getStatusBadge(status: string) {
  switch (status) {
    case "RefundApproved": return <Badge size="sm" color="success">Approved</Badge>;
    case "RefundCompleted": return <Badge size="sm" color="success">Completed</Badge>;
    case "RefundRequested": return <Badge size="sm" color="warning">Requested</Badge>;
    case "RefundRejected": return <Badge size="sm" color="error">Rejected</Badge>;
    case "RefundCancelled": return <Badge size="sm" color="light">Cancelled</Badge>;
    case "RefundPickupCreated": return <Badge size="sm" color="primary">Pickup Created</Badge>;
    case "RefundShipping": return <Badge size="sm" color="primary">Shipping</Badge>;
    case "RefundReceived": return <Badge size="sm" color="primary">Received</Badge>;
    case "RefundInspectionPending": return <Badge size="sm" color="warning">Inspecting</Badge>;
    case "RefundDamage": return <Badge size="sm" color="error">Damaged</Badge>;
    case "RefundReturnShipmentCreated": return <Badge size="sm" color="primary">Return Created</Badge>;
    case "RefundReturningToCustomer": return <Badge size="sm" color="primary">Returning</Badge>;
    case "RefundReturnedToCustomer": return <Badge size="sm" color="success">Returned (Rejected)</Badge>;
    case "RefundReturnToCustomerFailed": return <Badge size="sm" color="error">Return Failed</Badge>;
    default: return <Badge size="sm" color="light">{status}</Badge>;
  }
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    FAILED: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    REFUNDED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    PARTIALLY_REFUNDED: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  };
  const key = status?.toUpperCase() || "PENDING";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[key] ?? styles.PENDING}`}>
      {key === "PARTIALLY_REFUNDED" ? "Partially Refunded" : key === "REFUNDED" ? "Refunded" : key}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-900/50">
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h4>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col border-b border-gray-100 py-2.5 last:border-0 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-400 sm:shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-white/90 sm:text-right">{value}</span>
    </div>
  );
}

type TabKey = "overview" | "history" | "shipping-history";

const rejectRefundSchema = z.object({
  rejectReason: z.string().min(1, "Please enter rejection reason").max(500, "Reason must not exceed 500 characters"),
});

type RejectRefundFormData = z.infer<typeof rejectRefundSchema>;

// ─── Rejection Modal Component ────────────────────────────────────────────────
interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onReject: (reason: string) => void;
}

export const RefundRejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  isSubmitting,
  onReject,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectRefundFormData>({
    resolver: zodResolver(rejectRefundSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset({ rejectReason: "" });
    }
  }, [isOpen, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-5 lg:p-8 animate-fade-in">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Reject Refund Request</h2>
        <p className="mt-2 text-sm text-error-500 dark:text-error-400">
          Are you sure you want to reject this refund request? This action cannot be undone.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => onReject(data.rejectReason))}>
        <div className="mb-6">
          <Label htmlFor="reject-reason">Reason for Rejection (Required)</Label>
          <TextArea
            id="reject-reason"
            className="mt-2"
            {...register("rejectReason")}
            rows={3}
            placeholder="Enter reason for rejection..."
            error={!!errors.rejectReason}
            hint={errors.rejectReason?.message}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="!bg-error-600 hover:!bg-error-700">
            {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const RefundEditView: React.FC<RefundEditViewProps> = ({ refundId, isViewOnly = false }) => {
  const router = useRouter();
  const { account } = useAuthContext();
  const { refundDetail: refund, isLoading, error, refetch } = useRefundDetail(refundId);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const { isSubmitting, updateStatus, reassign, isReassigning } = useRefundMutations(() => {
    setIsStatusModalOpen(false);
    setIsRejectModalOpen(false);
    setIsAssignModalOpen(false);
    refetch();
  });

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push("/admin/refunds");
    }
  };

  const handleReject = async (reason: string) => {
    await updateStatus(refundId, {
      status: "RefundRejected",
      rejectReason: reason,
    });
  };

  const handleAssign = async (data: any) => {
    const result = await reassign(refundId, {
      roleId: data.roleId,
      newScheduleId: data.targetScheduleId,
      notes: data.note || undefined,
    });
    if (result.success) {
      setIsAssignModalOpen(false);
      refetch();
    }
  };

  if (isLoading && !refund) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !refund) {
    return (
      <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="text-error-500 mb-4">{error || "Refund request not found"}</div>
        <Button variant="outline" onClick={handleBack}>
          Back to List
        </Button>
      </div>
    );
  }

  if (!refund) return null;

  const role = account?.roleName;
  const isStaff = role === "Staff";
  const isMerchandise = role === "Merchandise";
  const isAdmin = role === "Admin";

  const isShippingStage = refund.refundStatus === "RefundShipping";
  const isReceivedStage = refund.refundStatus === "RefundReceived";
  const isInspectionStage = refund.refundStatus === "RefundInspectionPending";
  const isMerchandiseStage = isShippingStage || isReceivedStage;

  // System Return — per-stage role gates
  const isSystemApprovedStage  = !!refund.isSystemReturn && refund.refundStatus === "RefundApproved";
  const isSystemReceivedStage  = !!refund.isSystemReturn && refund.refundStatus === "RefundReceived";
  const isSystemInspectionStage = !!refund.isSystemReturn && refund.refundStatus === "RefundInspectionPending";
  const isSystemRequestedStage = !!refund.isSystemReturn && refund.refundStatus === "RefundRequested";

  /** System refund mis-rejected: Admin may Reopen (Rejected → Approved → Complete). */
  const canReopenSystemRejected =
    refund.refundStatus === "RefundRejected" &&
    !!refund.isSystemReturn &&
    isAdmin;

  const canChangeStatus =
    !isViewOnly &&
    refund.refundStatus !== "RefundCompleted" &&
    refund.refundStatus !== "RefundCancelled" &&
    (canReopenSystemRejected ||
      (refund.refundStatus !== "RefundRejected" &&
        (isAdmin ||
          // Customer return: Merch handles shipping → received stages
          (!refund.isSystemReturn && (isShippingStage || isReceivedStage) && isMerchandise) ||
          (!refund.isSystemReturn && isInspectionStage && isStaff) ||
          (!refund.isSystemReturn && !isShippingStage && !isReceivedStage && !isInspectionStage && isStaff) ||
          // System return: Merch inspects at Received (or legacy Requested/Approved)
          ((isSystemReceivedStage || isSystemApprovedStage || isSystemRequestedStage) && isMerchandise) ||
          // System return: Staff completes wallet refund after inspection
          (isSystemInspectionStage && isStaff) ||
          (refund.refundStatus === "RefundDamage" && isStaff))));

  const canReject =
    !isViewOnly &&
    refund.refundStatus !== "RefundCompleted" &&
    refund.refundStatus !== "RefundCancelled" &&
    refund.refundStatus !== "RefundRejected" &&
    !refund.isSystemReturn &&
    (isAdmin || isStaff);

  const canAssign =
    isAdmin &&
    refund.refundStatus !== "RefundCompleted" &&
    refund.refundStatus !== "RefundCancelled" &&
    refund.refundStatus !== "RefundRejected";

  const nextStatus = getNextStatus(refund.refundStatus, refund.isSystemReturn);

  const getChangeStatusButtonLabel = (status: string | null) => {
    if (!status) return "Change Status";
    if (refund.isSystemReturn) {
      switch (status) {
        case "RefundApproved":
        case "RefundReceived":
        case "RefundInspectionPending":
          return "Submit Inspection Results";
        case "RefundCompleted":
          return "Confirm Wallet Refund";
        default: return "Change Status";
      }
    }
    switch (status) {
      case "RefundApproved": return refund.refundStatus === "RefundRejected" ? "Reopen & Approve" : "Approve Refund";
      case "RefundPickupCreated": return "Create Waybill (GHN)";
      case "RefundShipping": return "Ship Return Package";
      case "RefundReceived": return "Receive Return Package";
      case "RefundInspectionPending": return "Send to Quality Inspection";
      case "RefundCompleted": return "Complete Refund";
      default: return "Change Status";
    }
  };

  const changeStatusButtonLabel = getChangeStatusButtonLabel(nextStatus);

  const latestShippingStatus = refund.shippingHistory?.[0]?.newStatus?.toLowerCase() ?? "";
  const isCarrierDelivered = latestShippingStatus === "delivered" || latestShippingStatus === "returned";

  const hasShippingHistory = (refund.shippingHistory?.length ?? 0) > 0;
  const showShippingTab = !!refund.shippingOrderCode || hasShippingHistory;

  const tabs: { key: TabKey; label: string; show: boolean }[] = [
    { key: "overview", label: "Overview", show: true },
    { key: "history", label: `Refund History (${refund.statusHistory?.length ?? 0})`, show: true },
    { key: "shipping-history", label: `Shipping History (${refund.shippingHistory?.length ?? 0})`, show: showShippingTab },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-8">
      <PageBreadcrumb
        pageTitle={isViewOnly ? "Refund Details" : "Edit Refund"}
        breadcrumbs={[
          { label: "Refund Management", href: "/admin/refunds" },
          { label: "Details" }
        ]}
      />

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              #{refund.refundCode || refund.refundId}
            </h2>
            {getStatusBadge(refund.refundStatus)}
            <PaymentBadge status={refund.paymentStatus} />
            {refund.isSystemReturn && (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                ⚙ System Return
              </span>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
            <span>Linked Order:</span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">#{refund.orderCode}</span>
            <span className="ml-2 text-gray-400">·</span>
            <span>Assigned:</span>
            {refund.assignedToStaffName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <span className="font-semibold text-blue-500">S:</span> {refund.assignedToStaffName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs italic text-gray-400 border border-dashed border-gray-200 dark:bg-transparent dark:border-gray-700">
                Staff: Unassigned
              </span>
            )}
            {refund.assignedToMerchName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                <span className="font-semibold text-purple-500">M:</span> {refund.assignedToMerchName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs italic text-gray-400 border border-dashed border-gray-200 dark:bg-transparent dark:border-gray-700">
                Merch: Unassigned
              </span>
            )}
            <span className="ml-2 text-gray-400">·</span>
            <span>Created at {fmtDt(refund.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === t.key
              ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {/* ── TAB: Overview ────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column: Returned Products (lg:col-span-2) */}
              <div className="lg:col-span-2 space-y-6">
                <Section title="Returned Items">
                  {refund.details && refund.details.length > 0 ? (
                    <>
                      <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Product</th>
                              <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Unit Price</th>
                              <th className="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Qty</th>
                              {refund.isSystemReturn && (
                                <th className="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wide text-blue-500 dark:text-blue-400">Restock Qty</th>
                              )}
                              <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Refund Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800/50 dark:bg-transparent">
                            {refund.details.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-slate-100">
                                      {item.productImage ? (
                                        <img
                                          src={item.productImage}
                                          alt={item.productName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-gray-400 text-lg">📦</span>
                                      )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">{item.productName}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-right text-sm text-gray-600 dark:text-gray-300">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-5 py-4 text-center text-sm font-medium text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                {refund.isSystemReturn && (
                                  <td className="px-5 py-4 text-center">
                                    {item.restorableQuantity != null ? (
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        item.restorableQuantity === 0
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                          : item.restorableQuantity < item.quantity
                                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                      }`}>
                                        {item.restorableQuantity}/{item.quantity}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">Not inspected</span>
                                    )}
                                  </td>
                                )}
                                <td className="px-5 py-4 text-right text-sm font-semibold text-brand-500">{formatCurrency(item.refundAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6 space-y-2 text-sm">
                        {/* -----------------------------------------------------------
                         * STATUS-AWARE FINANCIAL SUMMARY
                         * - Pre-Approve (RefundRequested / Rejected / Cancelled):
                         *   FinalRefundAmount = 0 (DB default, NOT yet computed).
                         *   → Always show ApprovedAmount as the expected refund.
                         * - Post-Approve:
                         *   FinalRefundAmount has been explicitly set by the service.
                         *   → Show breakdown + actual final amount.
                         * ----------------------------------------------------------- */}
                        {(() => {
                          const PRE_APPROVE_STATUSES = ["RefundRequested", "RefundRejected", "RefundCancelled"];
                          const isPreApproval = PRE_APPROVE_STATUSES.includes(refund.refundStatus);

                          // Pre-approval: FinalRefundAmount = 0 is just DB default, show ApprovedAmount
                          if (isPreApproval) {
                            return (
                              <div className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-gray-700 dark:bg-gray-800/40 overflow-hidden">
                                <div className="px-4 py-2 border-b border-slate-100 dark:border-gray-700">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Financial Summary</span>
                                </div>
                                <div className="px-4 py-3 space-y-2">
                                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 dark:border-gray-700">
                                    <span className="font-bold text-[#ff6a00]">Approved Amount</span>
                                    <span className="text-lg font-black text-[#ff6a00]">
                                      {formatCurrency(refund.approvedAmount)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 italic">
                                    Return shipping fee will be determined upon approval.
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          // System Return: show breakdown with shipping choice
                          if (refund.isSystemReturn) {
                            const productAmount = (refund.totalAmount ?? refund.approvedAmount) - (refund.customerShippingPaid ?? 0);
                            const isCompleted = refund.refundStatus === "RefundCompleted";
                            return (
                              <div className="rounded-xl border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10 overflow-hidden">
                                <div className="px-4 py-2 border-b border-green-100 dark:border-green-800">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">GHN Refund Summary</span>
                                </div>
                                <div className="px-4 py-3 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Product amount (after voucher)</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90">{formatCurrency(productAmount)}</span>
                                  </div>
                                  {(refund.customerShippingPaid ?? 0) > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Shipping fee paid by customer</span>
                                      <span className="font-medium text-gray-800 dark:text-white/90">{formatCurrency(refund.customerShippingPaid ?? 0)}</span>
                                    </div>
                                  )}
                                  {(refund.voucherDiscountAmount ?? 0) > 0 && (
                                    <div className="flex justify-between text-gray-400">
                                      <span>Voucher discount (not refunded)</span>
                                      <span className="line-through">{formatCurrency(refund.voucherDiscountAmount ?? 0)}</span>
                                    </div>
                                  )}
                                  {isCompleted && refund.includeShippingInRefund != null && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Refund shipping fee</span>
                                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${refund.includeShippingInRefund ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                        {refund.includeShippingInRefund ? "Yes" : "No"}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t border-dashed border-green-200 pt-2 dark:border-green-800">
                                    <span className="font-bold text-[#ff6a00]">Wallet refund</span>
                                    <span className="text-lg font-black text-[#ff6a00]">
                                      {formatCurrency(refund.finalRefundAmount && refund.finalRefundAmount > 0
                                        ? refund.finalRefundAmount
                                        : refund.approvedAmount)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // Customer return: existing breakdown
                          const effectiveFinal =
                            (refund.finalRefundAmount != null && refund.finalRefundAmount > 0)
                              ? refund.finalRefundAmount
                              : refund.returnShippingFeeBy === "Customer"
                                ? refund.finalRefundAmount ?? 0
                                : refund.approvedAmount;

                          const hasDeduction = (refund.returnShippingFee ?? 0) > 0 && refund.returnShippingFeeBy === "Customer";
                          const isGenuineZero = refund.returnShippingFeeBy === "Customer" && refund.finalRefundAmount === 0;

                          return (
                            <>
                              <div className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-gray-700 dark:bg-gray-800/40 overflow-hidden">
                                <div className="px-4 py-2 border-b border-slate-100 dark:border-gray-700">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Financial Summary</span>
                                </div>
                                <div className="px-4 py-3 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Approved amount</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90">{formatCurrency(refund.approvedAmount)}</span>
                                  </div>
                                  {hasDeduction && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">
                                        Return shipping fee
                                        <span className="ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                          Customer pays
                                        </span>
                                      </span>
                                      <span className="font-medium text-amber-600">-{formatCurrency(refund.returnShippingFee ?? 0)}</span>
                                    </div>
                                  )}
                                  {!hasDeduction && refund.returnShippingFeeBy === "Store" && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Return shipping fee</span>
                                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                        Store bears cost
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 dark:border-gray-700">
                                    <span className="font-bold text-[#ff6a00]">Final Refund Amount</span>
                                    <span className="text-lg font-black text-[#ff6a00]">
                                      {formatCurrency(effectiveFinal)}
                                    </span>
                                  </div>
                                </div>
                                {refund.returnShippingFeeNote && (
                                  <div className="border-t border-slate-100 px-4 py-2 dark:border-gray-700">
                                    <p className="text-[11px] text-gray-400">
                                      Override reason: <span className="italic text-gray-500">{refund.returnShippingFeeNote}</span>
                                    </p>
                                  </div>
                                )}
                              </div>

                              {isGenuineZero && (
                                <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                                  <span className="text-amber-500">⚠</span>
                                  <p className="text-xs text-amber-700 dark:text-amber-300">
                                    Return shipping fee equals or exceeds approved amount.
                                    Customer will receive <strong>0</strong>.
                                  </p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No returned items details found.</p>
                  )}
                </Section>

                {/* Evidence Photos */}
                <Section title={`Attached Evidence (${refund.images ? refund.images.length : 0})`}>
                  {(!refund.images || refund.images.length === 0) ? (
                    <div className="text-center py-8 text-sm text-gray-400 italic bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      No evidence photos attached.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {refund.images.map((imgUrl, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group cursor-zoom-in shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt={`Evidence ${index + 1}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              </div>

              {/* Right Column: Customer Info & Refund Meta (lg:col-span-1) */}
              <div className="lg:col-span-1 space-y-6">
                <Section title="Customer Info">
                  <div className="flex items-center gap-4 dark:bg-gray-700/30 rounded-xl p-3 bg-gray-50 mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-[#ff6a00] font-bold text-lg shrink-0">
                      {refund.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 dark:text-white/90 truncate">{refund.customerName}</div>
                      <div className="text-xs text-gray-500 truncate">{refund.customerEmail}</div>
                    </div>
                  </div>
                  <InfoRow label="Phone Number" value={refund.customerPhone || "—"} />
                  <InfoRow label="Address" value={refund.customerAddress || "—"} />
                </Section>

                <Section title="Refund Details">
                  <InfoRow label="Reason Category" value={refund.refundReasonContent || "Not specified"} />
                  <InfoRow label="Customer Note" value={
                    <span className="italic text-gray-500 bg-white/50 p-2 rounded block text-sm border border-slate-100 max-w-[240px] whitespace-pre-wrap">
                      {refund.reasonDetails || "No additional comments"}
                    </span>
                  } />
                  <InfoRow label="Requested On" value={fmtDt(refund.createdAt)} />
                  <InfoRow label="Requested By" value={refund.requestedByName || "System"} />
                </Section>

                <Section title="Shipping & Quality Check">
                  <InfoRow label="Tracking Code" value={
                    refund.shippingOrderCode ? (
                      <span className="font-mono font-bold text-[#ff6a00] tracking-wider">{refund.shippingOrderCode}</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Pickup order not created</span>
                    )
                  } />
                  <InfoRow label="Return Tracking Code" value={
                    refund.returnShippingOrderCode ? (
                      <span className="font-mono font-bold text-[#ff6a00] tracking-wider">{refund.returnShippingOrderCode}</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">—</span>
                    )
                  } />
                  <InfoRow label="Quality Inspection Status" value={
                    refund.inspectionPassed === true ? (
                      <Badge size="sm" color="success">Passed</Badge>
                    ) : refund.inspectionPassed === false ? (
                      <Badge size="sm" color="error">Failed</Badge>
                    ) : (
                      <Badge size="sm" color="warning">Pending</Badge>
                    )
                  } />
                  <InfoRow label="Inspection Note" value={
                    refund.inspectionNote ? (
                      <span className="italic text-slate-600 bg-white/60 p-2.5 rounded border border-slate-100 block text-xs whitespace-pre-wrap">
                        {refund.inspectionNote}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">—</span>
                    )
                  } />
                  <InfoRow label="Admin General Note" value={
                    refund.adminNote ? (
                      <span className="italic text-slate-600 bg-white/60 p-2.5 rounded border border-slate-100 block text-xs whitespace-pre-wrap">
                        {refund.adminNote}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">No shop admin notes</span>
                    )
                  } />
                  {/* Damage Responsibility badge */}
                  {refund.damageResponsibility && (
                    <InfoRow
                      label="Damage Responsibility"
                      value={
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${refund.damageResponsibility === "Carrier"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          }`}>
                          {refund.damageResponsibility === "Carrier" ? "🚚 Carrier fault" : "👤 Customer fault"}
                        </span>
                      }
                    />
                  )}
                </Section>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Refund History ────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="p-2">
            {!refund.statusHistory || refund.statusHistory.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No status history logs yet.</p>
            ) : (
              <div className="relative pl-8">
                {refund.statusHistory?.map((h, idx) => {
                  const isSystem = !h.changedByName;
                  const isLast = idx === (refund.statusHistory?.length ?? 0) - 1;
                  return (
                    <div key={idx} className="relative pb-8">
                      {!isLast && (
                        <span className="absolute left-[-15px] top-4 h-full w-0.5 bg-gray-200 dark:bg-gray-800" />
                      )}
                      <span
                        className={`absolute left-[-21px] top-1.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${isSystem
                          ? "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                          : "border-brand-500 bg-brand-500"
                          }`}
                      />
                      <div className={`rounded-xl border p-4 ${isSystem ? "border-dashed border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-transparent" : "border-gray-100 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900/50"}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-base font-semibold text-gray-800 dark:text-white/90">
                            {cleanStatusName(h.statusName)}
                          </span>
                          <span className="text-sm text-gray-400 dark:text-gray-500">{fmtDt(h.createdAt)}</span>
                        </div>
                        <p className={`mt-1 text-sm ${isSystem ? "italic text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"}`}>
                          By: {isSystem ? "⚙ System (auto)" : h.changedByName}
                        </p>
                        {h.note && (
                          <p className="mt-3 border-l-2 border-gray-200 pl-3 text-sm italic text-gray-600 dark:border-gray-700 dark:text-gray-300">
                            &ldquo;{h.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Shipping History ────────────────────────────────── */}
        {activeTab === "shipping-history" && (
          <div>
            {!refund.shippingHistory || refund.shippingHistory.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No updates from carrier yet.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">From</th>
                      <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">To</th>
                      <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Source</th>
                      <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {refund.shippingHistory.map((sh, idx) => (
                      <tr key={idx} className="bg-white hover:bg-gray-50/50 dark:bg-transparent dark:hover:bg-white/[0.01]">
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {sh.previousStatus}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
                            {sh.newStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs uppercase text-gray-400 dark:text-gray-500">
                          {sh.source}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {fmtDt(sh.processedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          {canReject && (
            <Button
              variant="outline"
              onClick={() => setIsRejectModalOpen(true)}
              className="!border-error-400 !text-error-500 hover:!bg-error-50 dark:hover:!bg-error-900/20"
            >
              Reject
            </Button>
          )}
          {canAssign && (
            <Button variant="outline" onClick={() => setIsAssignModalOpen(true)}>
              Reassign
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {!canChangeStatus && !isLoading && (
            <span className="self-center text-sm text-gray-400 dark:text-gray-500 mr-2">
              {refund.refundStatus === "RefundRejected" &&
                refund.isSystemReturn &&
                !isAdmin
                ? "System refund was rejected — contact Admin to reopen (Approve → Complete)."
                : "No actions available"}
            </span>
          )}
          {canChangeStatus && nextStatus && (
            <div className="flex items-center gap-3">
              {refund.refundStatus === "RefundShipping" && !isCarrierDelivered && (
                <span className="text-xs text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/30">
                  Waiting for carrier delivery confirmation
                </span>
              )}
              <Button
                variant="primary"
                onClick={() => setIsStatusModalOpen(true)}
                disabled={refund.refundStatus === "RefundShipping" && !isCarrierDelivered}
              >
                {changeStatusButtonLabel}
              </Button>
            </div>
          )}
        </div>
      </div>

      <RefundStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        currentStatus={refund.refundStatus}
        isSubmitting={isSubmitting}
        onSave={(data) => updateStatus(refund.refundId, data)}
        isSystemReturn={refund.isSystemReturn}
        suggestedFeeBy={refund.refundReasonResponsibleParty ?? "Store"}
        approvedAmount={refund.approvedAmount}
        currentDamageResponsibility={refund.damageResponsibility}
        refundDetails={refund.details?.map((d) => ({
          productId: d.productId,
          productName: d.productName,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          refundAmount: d.refundAmount,
          restorableQuantity: d.restorableQuantity,
        }))}
        customerShippingPaid={refund.customerShippingPaid ?? 0}
        totalAmount={refund.totalAmount ?? refund.approvedAmount}
      />

      <RefundRejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        isSubmitting={isSubmitting}
        onReject={handleReject}
      />

      <OrderAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        isSubmitting={isReassigning}
        onAssign={handleAssign}
        targetRoleId={isMerchandiseStage ? 4 : 3}
        title="Reassign Refund"
        description={`Admin reassigns the ${isMerchandiseStage ? "Merchandise" : "Staff"} slot for this refund request using an on-duty schedule.`}
      />
    </div>
  );
};

