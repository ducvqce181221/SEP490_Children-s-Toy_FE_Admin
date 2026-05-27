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
import { formatCurrency } from "@/utils/format-utils";
import { useAuthContext } from "@/context/AuthContext";

interface RefundEditViewProps {
  refundId: number;
  isViewOnly?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDt = (v: string | null | undefined) => formatDisplayDate(v, "—");

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
    case "RefundInspectionPending": return <Badge size="sm" color="warning">Inspection Pending</Badge>;
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

type TabKey = "overview" | "history";

export const RefundEditView: React.FC<RefundEditViewProps> = ({ refundId, isViewOnly = false }) => {
  const router = useRouter();
  const { account } = useAuthContext();
  const { refundDetail: refund, isLoading, error, refetch } = useRefundDetail(refundId);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const { isSubmitting, updateStatus } = useRefundMutations(() => {
    setIsStatusModalOpen(false);
    refetch();
  });

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push("/admin/refunds");
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
  
  const isCurrentStatusInspectionPending = refund.refundStatus === "RefundInspectionPending";

  const canChangeStatus =
    !isViewOnly &&
    refund.refundStatus !== "RefundCompleted" &&
    refund.refundStatus !== "RefundCancelled" &&
    refund.refundStatus !== "RefundRejected" &&
    (
      isAdmin ||
      (isMerchandise && isCurrentStatusInspectionPending) ||
      (isStaff && !isCurrentStatusInspectionPending)
    );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "history", label: `Refund History (${refund.statusHistory?.length ?? 0})` },
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
        {tabs.map((t) => (
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
                              <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Refund Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800/50 dark:bg-transparent">
                            {refund.details.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400 font-bold border border-slate-100">
                                      📦
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">{item.productName}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-right text-sm text-gray-600 dark:text-gray-300">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-5 py-4 text-center text-sm font-medium text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                <td className="px-5 py-4 text-right text-sm font-semibold text-brand-500">{formatCurrency(item.refundAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6 flex flex-col items-end gap-2 text-sm">
                        <div className="mt-2 flex w-80 justify-between items-center rounded-xl px-4 py-3">
                          <span className="font-bold text-[#ff6a00]">Total Refund Amount</span>
                          <span className="text-lg font-black text-[#ff6a00]">{formatCurrency(refund.approvedAmount)}</span>
                        </div>
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
                  <div className="flex items-center gap-4 dark:bg-gray-700/30 rounded-xl p-3 bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-[#ff6a00] font-bold text-lg">
                      {refund.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 dark:text-white/90 truncate">{refund.customerName}</div>
                      <div className="text-xs text-gray-500 truncate">{refund.customerPhone}</div>
                      <div className="text-xs text-gray-500 truncate">{refund.customerEmail}</div>
                    </div>
                  </div>
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
                  <InfoRow label="Tracking Code (Courier)" value={
                    refund.shippingOrderCode ? (
                      <span className="font-mono font-bold text-[#ff6a00] tracking-wider">{refund.shippingOrderCode}</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Pickup order not created</span>
                    )
                  } />
                  <InfoRow label="Inspection Report" value={
                    refund.adminNote ? (
                      <span className="italic text-slate-600 bg-white/60 p-2.5 rounded border border-slate-100 block text-xs whitespace-pre-wrap">
                        {refund.adminNote}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">No warehouse inspection notes</span>
                    )
                  } />
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
                            {h.statusName}
                          </span>
                          <span className="text-sm text-gray-400 dark:text-gray-500">{fmtDt(h.createdAt)}</span>
                        </div>
                        <p className={`mt-1 text-sm ${isSystem ? "italic text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"}`}>
                          Performed by: {isSystem ? "⚙ System (auto)" : h.changedByName}
                        </p>
                        {h.note && (
                          <p className="mt-3 border-l-2 border-gray-200 pl-3 text-sm italic text-gray-600 dark:border-gray-700 dark:text-gray-300">
                            "{h.note}"
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
      </div>

      {/* Actions Footer */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          {!canChangeStatus && !isLoading && (
            <span className="self-center text-sm text-gray-400 dark:text-gray-500 mr-2">
              No actions available
            </span>
          )}
          {canChangeStatus && (
            <Button variant="primary" onClick={() => setIsStatusModalOpen(true)}>
              Change Status
            </Button>
          )}
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
