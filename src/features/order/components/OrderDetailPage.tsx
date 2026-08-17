"use client";

import { AxiosError } from "axios";
import Image from "next/image";
import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { useAuthContext } from "@/context/AuthContext";
import { formatDisplayDate } from "@/utils/date-utils";
import { orderApi } from "../services/order-api";
import { useOrderMutations } from "../hooks/useOrderMutations";
import {
  type ApiErrorResponse,
  type OrderDetail,
  ORDER_STATUS,
  ORDER_STATUS_ID,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABEL,
  isPaidCancelledAnomaly,
  ROLE_NAME,
  formatGhnShippingLabel,
  isGhnReturnFlowStatus,
} from "../types/order";
import {
  AssignOrderFormData,
  CancelOrderFormData,
  ShipOrderFormData,
  ConfirmOrderFormData,
  ProcessOrderFormData,
} from "../types/order.schema";
import {
  OrderAssignModal,
  OrderCancelModal,
  OrderConfirmModal,
  OrderProcessModal,
  OrderShipModal,
} from "./OrderActionModals";

interface OrderDetailPageProps {
  orderId: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDt = (v: string | null | undefined) => formatDisplayDate(v, "—");

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

// ─── Inline badge components ───────────────────────────────────────────────────
function OrderStatusBadge({ statusId, statusName }: { statusId: number; statusName: string }) {
  const styles: Record<number, string> = {
    [ORDER_STATUS_ID.PENDING]: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    [ORDER_STATUS_ID.CONFIRMED]: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    [ORDER_STATUS_ID.PROCESSING]: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
    [ORDER_STATUS_ID.SHIPPED]: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    [ORDER_STATUS_ID.DELIVERING]: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
    [ORDER_STATUS_ID.RETURNING]: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    [ORDER_STATUS_ID.RETURN_COMPLETED]: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    [ORDER_STATUS_ID.DELIVERED]: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    [ORDER_STATUS_ID.COMPLETED]: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    [ORDER_STATUS_ID.CANCELLED]: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  };
  const cls = styles[statusId] ?? "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${cls}`}>
      {ORDER_STATUS_LABEL[statusId] ?? statusName}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    FAILED: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    REFUNDED: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.PENDING}`}>
      {PAYMENT_STATUS_LABEL[status] ?? status}
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
      <span className="text-sm font-medium text-gray-800 dark:text-white/90 sm:text-right break-words max-w-full sm:max-w-[70%]">{value}</span>
    </div>
  );
}

type TabKey = "overview" | "history" | "shipping-history";

export default function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const router = useRouter();
  const { account } = useAuthContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDeliveryImage, setSelectedDeliveryImage] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const handleBack = () => {


    if (window.history.length > 2) {
      router.back();
    } else {
      router.push("/admin/orders");
    }
  };

  const loadOrder = useCallback(async (isCancelled?: () => boolean) => {
    if (!isCancelled?.()) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const res = await orderApi.getOrderById(orderId);
      if (!isCancelled?.()) setOrder(res);
    } catch (err) {
      if (!isCancelled?.()) {
        const ae = err as AxiosError<ApiErrorResponse>;
        setError(ae.response?.data?.message ?? "Could not load order details.");
      }
    } finally {
      if (!isCancelled?.()) setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadOrder(() => cancelled);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOrder]);

  const {
    confirmOrder,
    processOrder,
    shipOrder,
    cancelOrder,
    assignOrder,
    confirmingId,
    processingId,
    shippingId,
    cancellingId,
    assigningId,
  } = useOrderMutations(() => {
    void loadOrder();
  });

  // ── Actions handlers
  const handleConfirm = async (data: ConfirmOrderFormData) => {
    const result = await confirmOrder(orderId, { note: data.note });
    if (result.success) {
      toast.success(result.message);
      setIsConfirmModalOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleProcess = async (data: ProcessOrderFormData) => {
    const result = await processOrder(orderId, { note: data.note });
    if (result.success) {
      toast.success(result.message);
      setIsProcessModalOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleShip = async (data: ShipOrderFormData) => {
    const result = await shipOrder(orderId, {
      provider: data.provider,
      serviceType: data.serviceType || undefined,
      note: data.note || undefined,
    });
    if (result.success) {
      toast.success(result.message);
      setIsShipModalOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleCancel = async (data: CancelOrderFormData) => {
    const result = await cancelOrder(orderId, { reason: data.reason });
    if (result.success) {
      toast.success(result.message);
      setIsCancelModalOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleAssign = async (data: AssignOrderFormData) => {
    const result = await assignOrder(orderId, {
      roleId: data.roleId,
      newScheduleId: data.targetScheduleId,
      notes: data.note || undefined,
    });
    if (result.success) {
      toast.success(result.message);
      setIsAssignModalOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const role = account?.roleName;
  const isAdmin = role === ROLE_NAME.ADMIN;
  const isAssignedToMe = isAdmin || (order?.isAssignedToCurrentUser ?? false);
  const isViewOnlyDetail =
    !isAdmin && !!order && !order.isAssignedToCurrentUser;

  const canConfirm =
    order?.statusName === ORDER_STATUS.PENDING &&
    isAssignedToMe &&
    (role === ROLE_NAME.STAFF || isAdmin);

  const canProcess =
    order?.statusName === ORDER_STATUS.CONFIRMED &&
    isAssignedToMe &&
    (role === ROLE_NAME.MERCHANDISE || isAdmin);

  const canShip =
    order?.statusName === ORDER_STATUS.PROCESSING &&
    isAssignedToMe &&
    (role === ROLE_NAME.MERCHANDISE || isAdmin);

  const ghnStatus = order?.ghnShippingStatus ?? order?.shipping?.status ?? null;

  const isTerminalStatus =
    order?.statusName === ORDER_STATUS.CANCELLED ||
    order?.statusName === ORDER_STATUS.REFUNDED ||
    order?.statusName === ORDER_STATUS.COMPLETED ||
    order?.statusName === ORDER_STATUS.DELIVERED; // Đã giao tới tay khách — không thể hủy

  // GHN đang trên đường giao (đã rời kho) — không cho phép hủy
  const isGhnOutForDelivery =
    ghnStatus === "delivering" ||
    ghnStatus === "money_collect_delivering" ||
    ghnStatus === "delivered";

  const canCancel =
    isAdmin
      ? !isTerminalStatus && !isGhnOutForDelivery && !!order
      : isAssignedToMe &&
      (order?.statusName === ORDER_STATUS.PENDING ||
        order?.statusName === ORDER_STATUS.CONFIRMED) &&
      role === ROLE_NAME.STAFF;

  const canAssign =
    isAdmin &&
    !!order &&
    order.statusName !== ORDER_STATUS.COMPLETED &&
    order.statusName !== ORDER_STATUS.CANCELLED;

  const isReturnFlow =
    order?.statusId === ORDER_STATUS_ID.RETURNING ||
    order?.statusId === ORDER_STATUS_ID.RETURN_COMPLETED ||
    isGhnReturnFlowStatus(ghnStatus);
  const hasShippingHistory = (order?.shippingHistory?.length ?? 0) > 0;
  const showShippingTab = !!order?.shipping || hasShippingHistory || isReturnFlow;
  const hasActions =
    !isViewOnlyDetail &&
    (canConfirm || canProcess || canShip || canCancel || canAssign);

  const tabs: { key: TabKey; label: string; show: boolean }[] = [
    { key: "overview", label: "Overview", show: true },
    { key: "history", label: `Order History (${order?.statusHistory?.length ?? 0})`, show: true },
    { key: "shipping-history", label: `Shipping History (${order?.shippingHistory?.length ?? 0})`, show: showShippingTab },
  ];

  if (isLoading && !order) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
        {error}
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-8">
      {isViewOnlyDetail && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          View-only — this order was already handled or is no longer assigned to you this shift. You cannot perform actions on it.
        </div>
      )}
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              #{order.orderCode}
            </h2>
            <OrderStatusBadge statusId={order.statusId} statusName={order.statusName} />
            {order.statusName !== ORDER_STATUS.CANCELLED && order.fulfillmentLabel && order.fulfillmentLabel !== (ORDER_STATUS_LABEL[order.statusId] ?? order.statusName) && (
              <span className="text-sm text-gray-500 dark:text-gray-400" title="Fulfillment">
                {order.fulfillmentLabel}
              </span>
            )}
            <PaymentBadge status={order.paymentStatus} />
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
            <span>Assigned:</span>
            {order.assignedToStaffName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <span className="font-semibold text-blue-500">S:</span> {order.assignedToStaffName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs italic text-gray-400 border border-dashed border-gray-200 dark:bg-transparent dark:border-gray-700">
                Staff: Unassigned
              </span>
            )}
            {order.assignedToMerchName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                <span className="font-semibold text-purple-500">M:</span> {order.assignedToMerchName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs italic text-gray-400 border border-dashed border-gray-200 dark:bg-transparent dark:border-gray-700">
                Merch: Unassigned
              </span>
            )}
            <span className="ml-2 text-gray-400">·</span>
            <span>Placed at {fmtDt(order.orderDate)}</span>
          </div>
        </div>
        {order.statusName === ORDER_STATUS.CANCELLED && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/50 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Cancelled by: {order.cancelledByName ?? "System"} at {fmtDt(order.cancelledAt)}
            </p>
            {order.cancelReason && (
              <p
                className="mt-1 text-sm text-red-600 dark:text-red-400 break-all line-clamp-3"
                title={order.cancelReason}
              >
                Reason: {order.cancelReason}
              </p>
            )}
          </div>
        )}
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

      {/* Content area */}
      <div className="min-h-[400px]">
        {/* ── TAB: Tổng quan ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Section title="Shipping Info">
                <InfoRow label="Recipient" value={order.shippingName} />
                <InfoRow label="Phone Number" value={order.shippingPhone} />
                <InfoRow
                  label="Address"
                  value={`${order.shippingAddress}, ${order.shippingWardName}, ${order.shippingDistrictName}, ${order.shippingProvinceName}`}
                />
              </Section>

              <Section title="Payment Info">
                <InfoRow label="Method" value={<span className="uppercase">{order.paymentMethod}</span>} />
                <InfoRow
                  label="Status"
                  value={<PaymentBadge status={order.paymentStatus} />}
                />
                <InfoRow
                  label="Paid at"
                  value={order.paymentStatus === PAYMENT_STATUS.PAID ? fmtDt(order.paidAt) : "—"}
                />
              </Section>
            </div>

            <Section title="Order Timeline">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Placed", value: fmtDt(order.orderDate) },
                  { label: "Confirmed", value: fmtDt(order.confirmedAt) },
                  { label: "Shipped", value: fmtDt(order.shippedAt) },
                  { label: "Completed", value: fmtDt(order.completedAt ?? order.deliveredAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="mt-1.5 text-sm font-medium text-gray-800 dark:text-white/90">{value}</p>
                  </div>
                ))}
              </div>
            </Section>

            {(order.shipping || ghnStatus) && (
              <Section title="Shipping info">
                <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                  <div>
                    <InfoRow label="Carrier" value={order.shipping?.provider ?? "GHN"} />
                    <InfoRow label="Tracking No." value={order.shipping?.providerOrderCode ?? "—"} />
                    <InfoRow label="Tracking" value={order.shipping?.trackingNumber ?? "—"} />
                    <InfoRow label="Est. Delivery" value={fmtDt(order.shipping?.estimatedDelivery) || "—"} />
                  </div>
                  <div>
                    <InfoRow
                      label="GHN status"
                      value={
                        <span className={`rounded-full px-2.5 py-1 text-xs ${isGhnReturnFlowStatus(ghnStatus)
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                          : "bg-gray-100 dark:bg-gray-800"
                          }`}>
                          {formatGhnShippingLabel(ghnStatus) || "—"}
                        </span>
                      }
                    />

                    <InfoRow
                      label="Status"
                      value={
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs dark:bg-gray-800">
                          {formatGhnShippingLabel(order.shipping?.status) || "—"}
                        </span>
                      }
                    />
                    <InfoRow
                      label="Shipping Fee"
                      value={
                        order.shipping?.shippingFee != null ? (
                          <span className="font-semibold text-brand-600 dark:text-brand-400">
                            {fmtCurrency(order.shipping.shippingFee)}
                          </span>
                        ) : "—"
                      }
                    />
                    <InfoRow
                      label="Delivered At"
                      value={
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {order.deliveredAt && <span>{fmtDt(order.deliveredAt)}</span>}
                          {order.deliveryImageUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedDeliveryImage(order.deliveryImageUrl!)}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                            >
                              View delivery image
                            </button>
                          )}
                          {!order.deliveredAt && !order.deliveryImageUrl && "—"}
                        </div>
                      }
                    />
                  </div>
                </div>
                {order.shipping?.lastErrorMessage && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
                    Provider Error: {order.shipping.lastErrorMessage}
                  </div>
                )}
              </Section>
            )}


            <Section title="Order Items">

              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Product</th>
                      <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Unit Price</th>
                      <th className="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Qty</th>
                      <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Discount</th>
                      <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800/50 dark:bg-transparent">
                    {order.items.map((item) => (
                      <tr key={item.orderDetailId} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                              {item.productImage ? (
                                <Image src={item.productImage} alt={item.productName} width={48} height={48} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-gray-400">?</div>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-white/90 line-clamp-2" title={item.productName}>{item.productName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right text-sm text-gray-600 dark:text-gray-300">{fmtCurrency(item.unitPrice)}</td>
                        <td className="px-5 py-4 text-center text-sm font-medium text-gray-600 dark:text-gray-300">{item.quantity}</td>
                        <td className="px-5 py-4 text-right text-sm text-red-500 dark:text-red-400">
                          {item.discountAmount > 0 ? `-${fmtCurrency(item.discountAmount)}` : "—"}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-semibold text-gray-800 dark:text-white/90">
                          {fmtCurrency(item.lineTotal ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col items-end gap-2 text-sm">
                <div className="flex w-80 justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">{fmtCurrency(order.subTotal)}</span>
                </div>
                {order.voucherDiscountAmount > 0 && (
                  <div className="flex w-80 justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Voucher Discount</span>
                    <span className="font-medium text-red-500 dark:text-red-400">-{fmtCurrency(order.voucherDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex w-80 justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Est. Shipping Fee</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">{fmtCurrency(order.estimatedShippingFee)}</span>
                </div>
                {order.actualShippingFee !== null && (
                  <div className="flex w-80 justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Actual Shipping Fee</span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">{fmtCurrency(order.actualShippingFee)}</span>
                  </div>
                )}
                <div className="mt-2 flex w-80 justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/50">
                  <span className="font-semibold text-gray-800 dark:text-white/90">Total Amount</span>
                  <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{fmtCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* ── TAB: Lịch sử trạng thái đơn ────────────────────────── */}
        {activeTab === "history" && (
          <div className="p-2">
            {order.statusHistory.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No status history yet.</p>
            ) : (
              <div className="relative pl-8">
                {order.statusHistory.map((h, idx) => {
                  const isSystem = !h.changedByName;
                  const isLast = idx === order.statusHistory.length - 1;
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
                          By: {isSystem ? "⚙ System (auto)" : h.changedByName}
                        </p>
                        {h.note && (
                          <p
                            className="mt-3 border-l-2 border-gray-200 pl-3 text-sm italic text-gray-600 dark:border-gray-700 dark:text-gray-300 break-all line-clamp-3"
                            title={h.note}
                          >
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

        {/* ── TAB: Lịch sử vận chuyển (webhook/polling) ─────────── */}
        {activeTab === "shipping-history" && (
          <div>
            {!order.shippingHistory || order.shippingHistory.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No updates from carrier yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
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
                    {order.shippingHistory.map((sh, idx) => (
                      <tr key={idx} className="bg-white hover:bg-gray-50/50 dark:bg-transparent dark:hover:bg-white/[0.01]">
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatGhnShippingLabel(sh.previousStatus) || sh.previousStatus}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
                            {formatGhnShippingLabel(sh.newStatus) || sh.newStatus}
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

      {/* ── Actions footer ─────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setIsCancelModalOpen(true)}
              className="!border-error-400 !text-error-500 hover:!bg-error-50 dark:hover:!bg-error-900/20"
            >
              Cancel Order
            </Button>
          )}
          {canAssign && (
            <Button variant="outline" onClick={() => setIsAssignModalOpen(true)}>
              Reassign
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {!hasActions && !isLoading && (
            <span className="self-center text-sm text-gray-400 dark:text-gray-500 mr-2">
              No actions available
            </span>
          )}
          {canConfirm && (
            <Button variant="primary" onClick={() => setIsConfirmModalOpen(true)}>
              Confirm Order
            </Button>
          )}
          {canProcess && (
            <Button variant="primary" onClick={() => setIsProcessModalOpen(true)}>
              Start Processing
            </Button>
          )}
          {canShip && (
            <Button variant="primary" onClick={() => setIsShipModalOpen(true)}>
              Create Waybill
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <OrderConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        isSubmitting={!!confirmingId}
        onConfirm={handleConfirm}
      />

      <OrderProcessModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        isSubmitting={!!processingId}
        onProcess={handleProcess}
      />

      <OrderShipModal
        isOpen={isShipModalOpen}
        onClose={() => setIsShipModalOpen(false)}
        isSubmitting={!!shippingId}
        onShip={handleShip}
      />

      <OrderCancelModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        isSubmitting={!!cancellingId}
        onCancel={handleCancel}
      />

      <OrderAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        isSubmitting={!!assigningId}
        onAssign={handleAssign}
        currentStatusName={order.statusName}
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
                <span>Delivery Image</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeliveryImage(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto flex items-center justify-center max-h-[75vh] py-2">
              <img
                src={selectedDeliveryImage}
                alt="Delivery Proof Full"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-xs"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

