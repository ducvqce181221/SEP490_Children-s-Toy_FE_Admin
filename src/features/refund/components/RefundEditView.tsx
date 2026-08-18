"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
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

function cleanHistoryNote(note?: string | null): string {
  if (!note) return "";
  let result = note;
  result = result.replace(/^Tự động cập nhật từ (?:GHN )?webhook vận chuyển:?\s*/i, "Automatically updated from shipping webhook: ");
  result = result.replace(/^Tự động cập nhật từ GHN webhook:?\s*/i, "Automatically updated from GHN webhook: ");
  result = result.replace(/GHN lấy hàng thất bại \(([^)]+)\): (.*)\. Đơn hàng được reset về Processing để chuẩn bị giao lại\./i, "GHN pickup failed ($1): $2. Order reset to Processing for redelivery.");
  result = result.replace(/Vận đơn giao lại cho khách bị hủy: shop không bàn giao hàng cho đơn vị vận chuyển\./i, "Return delivery to customer cancelled: shop did not hand over items to courier.");
  result = result.replace(/Đơn thu hồi hàng hoàn bị hủy: khách không bàn giao hàng cho đơn vị vận chuyển hoặc đơn bị hủy\. Yêu cầu hoàn tiền đã bị hủy\./i, "Return pickup shipment cancelled: customer did not hand over package or shipment was cancelled. Refund request cancelled.");
  result = result.replace(/Hàng hóa giao trả lại cho khách bị hư hỏng\/thất lạc trong quá trình vận chuyển \(lỗi do ĐVVC GHN\)\./i, "Returned items to customer were damaged/lost in transit by courier.");
  result = result.replace(/Giao hàng trả lại cho khách thất bại \(khách không nhận hàng \/ phát hàng không thành công\)\. Phí vận chuyển không được hoàn do lỗi từ phía khách hàng\./i, "Delivery of rejected items back to customer failed (customer was unreachable or refused package). Return shipping fee is non-refundable.");
  result = result.replace(/Phí vận chuyển ([0-9,.]+)₫ đã được hoàn trả vào ví của khách hàng\./i, "Return shipping fee of $1 VND was refunded to customer wallet.");
  return result;
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
      <span className="text-sm font-medium text-gray-800 dark:text-white/90 sm:text-right break-words break-all max-w-full overflow-hidden">{value}</span>
    </div>
  );
}

type TabKey = "overview" | "history" | "shipping-history";

const rejectRefundSchema = z.object({
  rejectReason: z.string().min(1, "Please enter rejection reason").max(400, "Reason must not exceed 400 characters"),
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
    watch,
    formState: { errors },
  } = useForm<RejectRefundFormData>({
    resolver: zodResolver(rejectRefundSchema),
    mode: "onChange",
  });

  const rejectReasonWatch = watch("rejectReason");

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
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="reject-reason" className="mb-0">
              Reason for Rejection <span className="text-error-500">*</span>
            </Label>
            <span className={`text-xs font-medium ${(rejectReasonWatch || "").length > 350 ? "text-error-500 font-bold" : "text-gray-500 dark:text-gray-400"}`}>
              {(rejectReasonWatch || "").length}/400
            </span>
          </div>
          <TextArea
            id="reject-reason"
            className="mt-1.5"
            {...register("rejectReason")}
            rows={3}
            maxLength={400}
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
  const [selectedDeliveryImage, setSelectedDeliveryImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (selectedDeliveryImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedDeliveryImage]);

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
  // Customer return: Merchandise handles Shipping → Received
  const isMerchandiseStage = isShippingStage || isReceivedStage;

  // System Return — per-stage role gates
  const isSystemApprovedStage = !!refund.isSystemReturn && refund.refundStatus === "RefundApproved";
  const isSystemReceivedStage = !!refund.isSystemReturn && refund.refundStatus === "RefundReceived";
  const isSystemInspectionStage = !!refund.isSystemReturn && refund.refundStatus === "RefundInspectionPending";
  const isSystemRequestedStage = !!refund.isSystemReturn && refund.refundStatus === "RefundRequested";

  /** System refund mis-rejected: Admin may Reopen (Rejected → Approved → Complete). */
  const canReopenSystemRejected =
    refund.refundStatus === "RefundRejected" &&
    !!refund.isSystemReturn &&
    isAdmin;

  const isTerminalStatus = [
    "RefundCompleted",
    "RefundCancelled",
    "RefundRejected",
    "RefundReturnedToCustomer",
    "RefundReturnToCustomerFailed",
  ].includes(refund.refundStatus);

  const canChangeStatus =
    !isViewOnly &&
    refund.refundStatus !== "RefundCompleted" &&
    refund.refundStatus !== "RefundCancelled" &&
    refund.refundStatus !== "RefundReturnedToCustomer" &&
    refund.refundStatus !== "RefundReturnToCustomerFailed" &&
    (canReopenSystemRejected ||
      (refund.refundStatus !== "RefundRejected" &&
        (isAdmin ||
          // Customer return: Merch handles shipping → received
          (!refund.isSystemReturn && (isShippingStage || isReceivedStage) && isMerchandise) ||
          (!refund.isSystemReturn && isInspectionStage && isStaff) ||
          (!refund.isSystemReturn && !isShippingStage && !isReceivedStage && !isInspectionStage && isStaff) ||
          // System return: Merch inspects at Received (or legacy Requested/Approved)
          ((isSystemReceivedStage || isSystemApprovedStage || isSystemRequestedStage) && isMerchandise) ||
          // System return: Staff completes wallet refund after inspection
          (isSystemInspectionStage && isStaff) ||
          (refund.refundStatus === "RefundDamage" && isStaff))));

  const hasShippingOrder = !!refund.shippingOrderCode || !!refund.returnShippingOrderCode;

  const canReject =
    !isViewOnly &&
    !isTerminalStatus &&
    !refund.isSystemReturn &&
    !hasShippingOrder &&
    (refund.refundStatus === "RefundRequested" || refund.refundStatus === "RefundApproved") &&
    (isAdmin || isStaff);

  const canAssign =
    isAdmin &&
    !isTerminalStatus;

  const nextStatus = getNextStatus(refund.refundStatus, refund.isSystemReturn, refund.refundType);

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

  const isInspectionDone = [
    "RefundInspectionPending",
    "RefundCompleted",
    "RefundDamage",
    "RefundReturnShipmentCreated",
    "RefundReturningToCustomer",
    "RefundReturnedToCustomer",
    "RefundReturnToCustomerFailed"
  ].includes(refund.refundStatus);

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
                <Section title={refund.refundType === "RefundOnly" ? "Refund Items" : "Returned Items"}>
                  {refund.details && refund.details.length > 0 ? (
                    <>
                      <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Product</th>
                              <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Unit Price</th>
                              <th className="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Qty</th>
                              {refund.refundType !== "RefundOnly" && (refund.isSystemReturn || refund.details?.some(d => d.restorableQuantity != null || d.failedCustomerQty != null || d.failedCarrierQty != null)) && (
                                <th className="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Inspection Result</th>
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
                                {refund.refundType !== "RefundOnly" && (refund.isSystemReturn || refund.details?.some(d => d.restorableQuantity != null || d.failedCustomerQty != null || d.failedCarrierQty != null)) && (
                                  <td className="px-5 py-4 text-center">
                                    {!isInspectionDone || (item.restorableQuantity == null && item.failedCustomerQty == null && item.failedCarrierQty == null) ? (
                                      <span className="text-xs text-gray-400 italic">Pending inspection</span>
                                    ) : (
                                      <div className="flex flex-col items-center gap-1.5">
                                        {(item.restorableQuantity ?? 0) > 0 && (
                                          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-300">
                                            Passed: {item.restorableQuantity}
                                          </span>
                                        )}
                                        {(item.failedCustomerQty ?? 0) > 0 && (
                                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                                            Failed (Cust): {item.failedCustomerQty}
                                          </span>
                                        )}
                                        {(item.failedCarrierQty ?? 0) > 0 && (
                                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                                            Failed (Carrier): {item.failedCarrierQty}
                                          </span>
                                        )}
                                      </div>
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
                         * STATUS-AWARE & TYPE-AWARE FINANCIAL SUMMARY
                         * ----------------------------------------------------------- */}
                        {(() => {
                          // 1. RefundOnly (Prepaid Cancelled Order - No Return)
                          if (refund.refundType === "RefundOnly") {
                            const itemsSubtotal = (refund.details && refund.details.length > 0)
                              ? refund.details.reduce((sum, d) => sum + d.refundAmount, 0)
                              : (refund.subTotal ?? 0);
                            const originalShipping = refund.shippingFee ?? 0;
                            const voucherDiscount = refund.voucherDiscountAmount ?? 0;
                            const finalAmount = (refund.finalRefundAmount && refund.finalRefundAmount > 0)
                              ? refund.finalRefundAmount
                              : refund.approvedAmount;

                            return (
                              <div className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-gray-700 dark:bg-gray-800/40 overflow-hidden">
                                <div className="px-4 py-2 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order Cancellation Refund Summary</span>
                                </div>
                                <div className="px-4 py-3 space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Order Items Subtotal</span>
                                    <span className="font-semibold text-gray-800 dark:text-white/80">{formatCurrency(itemsSubtotal)}</span>
                                  </div>
                                  {originalShipping > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Shipping Fee (Refunded)</span>
                                      <span className="font-semibold text-gray-800 dark:text-white/80">{formatCurrency(originalShipping)}</span>
                                    </div>
                                  )}
                                  {voucherDiscount > 0 && (
                                    <div className="flex justify-between text-gray-400">
                                      <span>Voucher Discount</span>
                                      <span>-{formatCurrency(voucherDiscount)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 dark:border-gray-700">
                                    <span className="font-bold text-[#ff6a00]">Total Refund to Wallet</span>
                                    <span className="text-lg font-black text-[#ff6a00]">
                                      {formatCurrency(finalAmount)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 italic">
                                    100% of the customer's paid amount (including initial shipping) is refunded because the order was cancelled prior to dispatch.
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          // 2. ReturnOnly (COD Delivery Failure / Return - No Refund)
                          if (refund.refundType === "ReturnOnly") {
                            return (
                              <div className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-gray-700 dark:bg-gray-800/40 overflow-hidden">
                                <div className="px-4 py-2 border-b border-slate-100 dark:border-gray-700">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Return Only Summary</span>
                                </div>
                                <div className="px-4 py-3 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="font-bold text-slate-500">Refund Amount</span>
                                    <span className="text-lg font-black text-slate-800 dark:text-white/95">
                                      {formatCurrency(0)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 italic">
                                    This is an unpaid order (COD) return. Quality inspection is performed to verify physical stock status, but no refund is processed.
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          // 3. System Return: GHN delivery failure
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

                          // 4. Standard Customer Return (ReturnAndRefund)
                          const hasCustomerFault = (refund.details ?? []).some(d => (d.failedCustomerQty ?? 0) > 0);
                          const isCustomerFee = refund.returnShippingFeeBy?.toLowerCase() === "customer";
                          const returnShipFee = refund.returnShippingFee ?? 0;
                          const effectiveFinal = (refund.finalRefundAmount && refund.finalRefundAmount > 0)
                            ? refund.finalRefundAmount
                            : refund.approvedAmount;

                          if (!isInspectionDone) {
                            const itemsAmount = refund.approvedAmount - (refund.shippingFee ?? 0);
                            const expectedFinal = isCustomerFee
                              ? Math.max(0, refund.approvedAmount - returnShipFee)
                              : refund.approvedAmount;

                            return (
                              <div className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-gray-700 dark:bg-gray-800/40 overflow-hidden">
                                <div className="px-4 py-2 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Expected Refund Summary</span>
                                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${isCustomerFee
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                                    : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                    }`}>
                                    {isCustomerFee ? "Customer bears shipping" : "Store bears shipping"}
                                  </span>
                                </div>
                                <div className="px-4 py-3 space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Expected Approved Items Subtotal</span>
                                    <span className="font-semibold text-gray-800 dark:text-white/80">{formatCurrency(itemsAmount)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Expected Shipping Fee Refund</span>
                                    <span className="font-semibold text-gray-800 dark:text-white/80">
                                      {isCustomerFee ? formatCurrency(0) : formatCurrency(refund.shippingFee ?? 0)}
                                    </span>
                                  </div>
                                  {isCustomerFee && returnShipFee > 0 && (
                                    <div className="flex justify-between text-amber-600">
                                      <span>Return Pickup Fee</span>
                                      <span className="font-semibold">-{formatCurrency(returnShipFee)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 dark:border-gray-700">
                                    <span className="font-bold text-[#ff6a00]">Total Expected Refund</span>
                                    <span className="text-lg font-black text-[#ff6a00]">
                                      {formatCurrency(expectedFinal)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 italic">
                                    Quality inspection results will determine the final refund.
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <>
                              <div className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-gray-700 dark:bg-gray-800/40 overflow-hidden">
                                <div className="px-4 py-2 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Financial Summary</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${isCustomerFee
                                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                                      : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                      }`}>
                                      {isCustomerFee ? "Customer bears shipping" : "Store bears shipping"}
                                    </span>
                                    {hasCustomerFault && (
                                      <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${refund.returnToCustomerFeePaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700 animate-pulse"
                                        }`}>
                                        {refund.returnToCustomerFeePaid ? "Fee Settled" : "Fee Unpaid"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="px-4 py-3 space-y-2.5 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Approved Items Subtotal</span>
                                    <span className="font-semibold text-gray-800 dark:text-white/80">{formatCurrency(refund.itemApprovedSubTotal ?? 0)}</span>
                                  </div>

                                  {(refund.itemRejectedSubTotal ?? 0) > 0 && (
                                    <div className="flex justify-between text-red-600">
                                      <span>Rejected Items Subtotal (Cust fault)</span>
                                      <span className="font-semibold">-{formatCurrency(refund.itemRejectedSubTotal ?? 0)}</span>
                                    </div>
                                  )}

                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Original Shipping Fee Refund</span>
                                    <span className="font-semibold text-gray-800 dark:text-white/80">
                                      {(isCustomerFee || (refund.itemRejectedSubTotal ?? 0) > 0) ? formatCurrency(0) : formatCurrency(refund.shippingFee ?? 0)}
                                    </span>
                                  </div>

                                  {isCustomerFee && returnShipFee > 0 && (
                                    <div className="flex justify-between text-amber-600">
                                      <span>Return Pickup Fee</span>
                                      <span className="font-semibold">-{formatCurrency(returnShipFee)}</span>
                                    </div>
                                  )}

                                  {(refund.returnToCustomerFee ?? 0) > 0 && (
                                    <div className="flex justify-between border-t border-slate-150 pt-2 dark:border-gray-700">
                                      <span className="text-gray-500 flex items-center gap-1.5">
                                        Rejected Items Redelivery Fee
                                      </span>
                                      <span className="font-semibold text-amber-600">
                                        {formatCurrency(refund.returnToCustomerFee ?? 0)}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2.5 dark:border-gray-700">
                                    <span className="font-bold text-[#ff6a00]">Final Wallet Refund</span>
                                    <span className="text-lg font-black text-[#ff6a00]">
                                      {formatCurrency(effectiveFinal)}
                                    </span>
                                  </div>
                                </div>

                                {hasCustomerFault && (
                                  <div className="border-t border-slate-150 bg-white/40 px-4 py-2.5 text-xs space-y-1 dark:border-gray-700 dark:bg-gray-900/40">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Customer Choice:</span>
                                      <span className="font-bold text-gray-700 dark:text-gray-300">
                                        {refund.customerResponse === "AcceptReturn" ? "Accept Return & Paid" :
                                          refund.customerResponse === "Disposed" ? "Dispose Items" : "Awaiting payment/response..."}
                                      </span>
                                    </div>
                                    {refund.customerResponseDeadline && !refund.returnToCustomerFeePaid && (
                                      <div className="flex justify-between text-red-500 font-medium">
                                        <span>Payment Deadline (48h):</span>
                                        <span>{formatDisplayDate(refund.customerResponseDeadline)}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No products included in this refund request.</p>
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
                <Section title="Customer Information">
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
                  <div className="border-b border-gray-100 py-2.5 last:border-0 dark:border-gray-800 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Reason Category</span>
                      {refund.refundType === "RefundOnly" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                          Order Cancellation
                        </span>
                      ) : (() => {
                        const effectiveParty = refund.returnShippingFeeBy || refund.refundReasonResponsibleParty;
                        const isOverridden = refund.returnShippingFeeBy && 
                          refund.refundReasonResponsibleParty && 
                          refund.returnShippingFeeBy.toLowerCase() !== refund.refundReasonResponsibleParty.toLowerCase();

                        if (isOverridden) {
                          return (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              effectiveParty?.toLowerCase() === "customer"
                                ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700"
                                : "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700"
                            }`}>
                              Overridden: {effectiveParty?.toLowerCase() === "customer" ? "Cust Fault" : "Store Fault"}
                            </span>
                          );
                        }

                        if (effectiveParty?.toLowerCase() === "customer") {
                          return (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700">
                              Customer Fault
                            </span>
                          );
                        }

                        if (effectiveParty?.toLowerCase() === "store") {
                          return (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700">
                              Store Fault
                            </span>
                          );
                        }

                        return null;
                      })()}
                    </div>
                    <div className="font-medium text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg text-sm border border-slate-100 dark:border-gray-700 w-full break-words break-all leading-relaxed">
                      {refund.refundType === "RefundOnly"
                        ? "Order cancelled before dispatch"
                        : (refund.refundReasonContent || "Not specified")}
                    </div>
                    {/* Cảnh báo trừ phí ship CHỈ hiển thị khi quyết định thực tế là Khách chịu phí */}
                    {refund.refundType === "ReturnAndRefund" && (refund.returnShippingFeeBy || refund.refundReasonResponsibleParty)?.toLowerCase() === "customer" && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 italic bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-800/60 leading-relaxed mt-0.5">
                        Reason is the customer's fault (e.g. changed mind, wrong order). The initial shipping fee is non-refundable, and any return shipping fee will be deducted from the refund.
                      </p>
                    )}
                  </div>
                  <div className="border-b border-gray-100 py-2.5 last:border-0 dark:border-gray-800 flex flex-col gap-1.5">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Customer Note</span>
                    <div className="italic text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg text-sm border border-slate-100 dark:border-gray-700 w-full whitespace-pre-wrap break-words break-all leading-relaxed">
                      {refund.reasonDetails || "No additional comments"}
                    </div>
                  </div>
                  <InfoRow
                    label="Refund Type"
                    value={
                      refund.refundType === "RefundOnly" ? (
                        <Badge color="info">Refund Only</Badge>
                      ) : refund.refundType === "ReturnAndRefund" ? (
                        <Badge color="primary">Return & Refund</Badge>
                      ) : refund.refundType === "ReturnOnly" ? (
                        <Badge color="warning">Return Only (COD Failed)</Badge>
                      ) : (
                        <Badge color="light">{refund.refundType || "—"}</Badge>
                      )
                    }
                  />
                  <InfoRow label="Requested On" value={fmtDt(refund.createdAt)} />
                  <InfoRow label="Requested By" value={refund.requestedByName || "System"} />
                  {refund.refundType === "ReturnAndRefund" && refund.returnShippingFeeBy && (
                    <InfoRow
                      label="Return Shipping Paid By"
                      value={
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${refund.returnShippingFeeBy === "Customer"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            }`}>
                            {refund.returnShippingFeeBy === "Customer" ? "Customer bears shipping" : "Store bears shipping"}
                          </span>
                          {refund.returnShippingFeeNote && (
                            <span className="text-[11px] text-gray-500 italic max-w-[200px] text-right truncate" title={refund.returnShippingFeeNote}>
                              Note: {refund.returnShippingFeeNote}
                            </span>
                          )}
                        </div>
                      }
                    />
                  )}
                  {refund.refundType === "RefundOnly" && refund.adminNote && (
                    <div className="border-b border-gray-100 py-2.5 last:border-0 dark:border-gray-800 flex flex-col gap-1.5">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Admin Note</span>
                      <div className="italic text-slate-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg text-xs border border-slate-100 dark:border-gray-700 w-full whitespace-pre-wrap break-words break-all leading-relaxed">
                        {refund.adminNote}
                      </div>
                    </div>
                  )}
                </Section>

                {refund.refundType !== "RefundOnly" && (
                  <Section title="Shipping & Quality Check">
                    <InfoRow label="Tracking Code" value={
                      <div className="flex flex-col items-end gap-1 w-full">
                        {refund.shippingOrderCode ? (
                          <span className="font-mono font-bold text-[#ff6a00] tracking-wider">{refund.shippingOrderCode}</span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Pickup order not created</span>
                        )}
                        {refund.returnDeliveryImageUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedDeliveryImage(refund.returnDeliveryImageUrl!)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            View return image
                          </button>
                        )}
                      </div>
                    } />
                    <InfoRow label="Return Tracking Code" value={
                      <div className="flex flex-col items-end gap-1 w-full">
                        {refund.returnShippingOrderCode ? (
                          <span className="font-mono font-bold text-[#ff6a00] tracking-wider">{refund.returnShippingOrderCode}</span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">—</span>
                        )}
                        {refund.returnToCustomerImageUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedDeliveryImage(refund.returnToCustomerImageUrl!)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            View delivery image
                          </button>
                        )}
                      </div>
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
                    <div className="border-b border-gray-100 py-2.5 last:border-0 dark:border-gray-800 flex flex-col gap-1.5">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Inspection Note</span>
                      {refund.inspectionNote ? (
                        <div className="italic text-slate-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg text-xs border border-slate-100 dark:border-gray-700 w-full whitespace-pre-wrap break-words break-all leading-relaxed">
                          {refund.inspectionNote}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">—</span>
                      )}
                    </div>
                    <div className="border-b border-gray-100 py-2.5 last:border-0 dark:border-gray-800 flex flex-col gap-1.5">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Admin General Note</span>
                      {refund.adminNote ? (
                        <div className="italic text-slate-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg text-xs border border-slate-100 dark:border-gray-700 w-full whitespace-pre-wrap break-words break-all leading-relaxed">
                          {refund.adminNote}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">No shop admin notes</span>
                      )}
                    </div>
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
                )}
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
                          <p className="mt-3 border-l-2 border-gray-200 pl-3 text-sm italic text-gray-600 dark:border-gray-700 dark:text-gray-300 break-words break-all whitespace-pre-wrap">
                            &ldquo;{cleanHistoryNote(h.note)}&rdquo;
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
        refundType={refund.refundType}
        suggestedFeeBy={refund.refundReasonResponsibleParty ?? "Store"}
        approvedAmount={refund.approvedAmount}
        currentDamageResponsibility={refund.damageResponsibility}
        currentInspectionPassed={refund.inspectionPassed}
        returnToCustomerFeePaid={refund.returnToCustomerFeePaid}
        refundDetails={refund.details?.map((d) => ({
          productId: d.productId,
          productName: d.productName,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          refundAmount: d.refundAmount,
          restorableQuantity: d.restorableQuantity,
          failedCustomerQty: d.failedCustomerQty,
          failedCarrierQty: d.failedCarrierQty,
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

      {mounted && selectedDeliveryImage && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedDeliveryImage(null)}
          />
          <div
            className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-5 text-left align-middle shadow-2xl transition-all animate-in fade-in zoom-in duration-200 border border-gray-200/80 dark:border-gray-800 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-base">
                <span>Delivery Confirmation Image</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeliveryImage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-auto flex items-center justify-center max-h-[75vh] py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedDeliveryImage}
                alt="Refund delivery confirmation"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-xs"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

