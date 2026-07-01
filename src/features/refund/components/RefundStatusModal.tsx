"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateRefundStatusData, UpdateRefundStatusSchema } from "../types/refund.schema";
import { formatCurrency } from "@/utils/format-utils";

interface RefundDetailItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  restorableQuantity?: number | null;
}

interface RefundStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  isSubmitting: boolean;
  onSave: (data: UpdateRefundStatusData) => void;
  isSystemReturn?: boolean;
  /** suggestion từ RefundReason.responsibleParty */
  suggestedFeeBy?: "Store" | "Customer";
  /** ApprovedAmount — để estimate FinalRefundAmount trong UI */
  approvedAmount?: number;
  /** Merchandise's proposal từ bước InspectionPending trước đó */
  currentDamageResponsibility?: "Customer" | "Carrier" | null;
  /** Danh sách sản phẩm trong refund — dùng cho RestockQuantitySection */
  refundDetails?: RefundDetailItem[];
  /** Tiền ship khách đã trả — dùng cho SystemReturnCompleteSection */
  customerShippingPaid?: number;
  /** TotalAmount đơn gốc */
  totalAmount?: number;
}

// Helper to determine the single next valid status transition
export const getNextStatus = (currentStatus: string, isSystemReturn: boolean = false): UpdateRefundStatusData["status"] | null => {
  switch (currentStatus) {
    case "RefundRequested":
      return isSystemReturn ? "RefundInspectionPending" : "RefundApproved";
    case "RefundRejected":
      if (isSystemReturn) return "RefundApproved";
      return null;
    case "RefundApproved":
      // System return (legacy): skip receive confirm — inspect directly
      // Customer return: create GHN pickup
      return isSystemReturn ? "RefundInspectionPending" : "RefundPickupCreated";
    case "RefundPickupCreated":
      return null; // Automatic flow via GHN webhook
    case "RefundShipping":
      return "RefundReceived"; // Manually confirmed by Merchandiser upon arrival
    case "RefundReceived":
      return "RefundInspectionPending";
    case "RefundInspectionPending":
      return "RefundCompleted";
    case "RefundDamage":
      return "RefundCompleted";
    default:
      return null;
  }
};

const getRefundStatusLabel = (status: string, isSystemReturn = false) => {
  switch (status) {
    case "RefundApproved":         return isSystemReturn ? "Approve Refund Request" : "Approve Refund Request";
    case "RefundPickupCreated":    return "Create Return Shipping Order";
    case "RefundShipping":         return "Ship Return Package";
    case "RefundReceived":         return isSystemReturn ? "Confirm Package Received at Shop" : "Receive Return Package";
    case "RefundInspectionPending":return isSystemReturn ? "Submit Inspection Results" : "Send to Quality Inspection";
    case "RefundCompleted":        return isSystemReturn ? "Confirm Wallet Refund" : "Complete Refund & Disburse";
    default: return status;
  }
};

// ─── Subcomponent: Return Shipping Fee Section (Approve — customer return) ────
function ReturnShippingFeeSection({
  suggestedFeeBy,
  approvedAmount,
  feeBy,
  onFeeByChange,
  overrideNote,
  onOverrideNoteChange,
  overrideNoteError,
}: {
  suggestedFeeBy: "Store" | "Customer";
  approvedAmount?: number;
  feeBy: "Store" | "Customer";
  onFeeByChange: (v: "Store" | "Customer") => void;
  overrideNote: string;
  onOverrideNoteChange: (v: string) => void;
  overrideNoteError?: string;
}) {
  const isOverriding = feeBy !== suggestedFeeBy;
  const estimatedFinalAmount =
    feeBy === "Customer" && approvedAmount != null
      ? `~${formatCurrency(Math.max(0, approvedAmount - 30000))} (after ~30,000 fee)`
      : approvedAmount != null
        ? formatCurrency(approvedAmount)
        : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 dark:border-gray-700 dark:bg-gray-800/40">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Return Shipping Fee</span>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          Suggested: {suggestedFeeBy}
        </span>
      </div>
      <div className="flex gap-3">
        {(["Store", "Customer"] as const).map((opt) => (
          <label
            key={opt}
            className={`flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-colors ${feeBy === opt
                ? "border-[#ff6a00] bg-orange-50 dark:bg-orange-900/20"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              }`}
          >
            <input type="radio" name="returnShippingFeeBy" value={opt} checked={feeBy === opt} onChange={() => onFeeByChange(opt)} className="accent-[#ff6a00]" />
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {opt === "Store" ? "Store bears cost" : "Customer bears cost"}
                {opt === suggestedFeeBy && <span className="ml-1.5 text-[10px] font-normal text-green-600">✓ suggested</span>}
              </div>
              <div className="text-[11px] text-gray-400">
                {opt === "Store" ? "Full refund to customer" : "Fee deducted from refund"}
              </div>
            </div>
          </label>
        ))}
      </div>
      {estimatedFinalAmount && (
        <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-sm dark:bg-gray-900/60">
          <span className="text-gray-500">Estimated wallet refund:</span>
          <span className={`font-bold ${feeBy === "Customer" ? "text-amber-600" : "text-green-600"}`}>{estimatedFinalAmount}</span>
        </div>
      )}
      {feeBy === "Customer" && approvedAmount != null && approvedAmount <= 30000 && (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <span className="text-amber-500">⚠</span>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Return shipping fee may equal or exceed the approved amount. Customer could receive <strong>0</strong>.
          </p>
        </div>
      )}
      {isOverriding && (
        <div>
          <Label htmlFor="returnShippingFeeNote">Override Reason <span className="text-red-500">*</span></Label>
          <textarea
            id="returnShippingFeeNote"
            value={overrideNote}
            onChange={(e) => onOverrideNoteChange(e.target.value)}
            rows={2}
            placeholder="Explain why you are overriding the suggested responsible party..."
            className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 dark:bg-gray-900 dark:text-white/90 ${
              overrideNoteError
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-[#ff6a00] dark:border-gray-700"
            }`}
          />
          {overrideNoteError && <p className="mt-1 text-xs text-red-500">{overrideNoteError}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Subcomponent: Damage Responsibility Proposal (Merchandise at InspectionPending) ─
function DamageProposalSection({
  value,
  onChange,
}: {
  value: "Customer" | "Carrier" | "";
  onChange: (v: "Customer" | "Carrier" | "") => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 dark:border-gray-700 dark:bg-gray-800/40">
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Damage Assessment <span className="font-normal text-gray-400">(Optional)</span></p>
        <p className="mt-0.5 text-xs text-gray-400">If goods appear damaged, propose the cause. Staff will confirm.</p>
      </div>
      <div className="space-y-2">
        {[
          { val: "", label: "No visible damage", sub: "Goods appear normal" },
          { val: "Customer", label: "Damage — Customer fault", sub: "Goods sent in damaged condition" },
          { val: "Carrier", label: "Damage — Carrier fault (GHN)", sub: "Likely damaged in transit (GHN)" },
        ].map((opt) => (
          <label
            key={opt.val}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              value === opt.val
                ? "border-[#ff6a00] bg-orange-50/60 dark:bg-orange-900/10"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            }`}
          >
            <input type="radio" name="damageProposal" checked={value === opt.val} onChange={() => onChange(opt.val as "Customer" | "Carrier" | "")} className="accent-[#ff6a00]" />
            <div>
              <div className="text-sm font-medium text-gray-800 dark:text-white/90">{opt.label}</div>
              <div className="text-[11px] text-gray-400">{opt.sub}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Subcomponent: Damage Confirmation (Staff at Complete — customer return only) ─
function DamageConfirmSection({
  inspectionPassed,
  merchandiseProposal,
  value,
  onChange,
}: {
  inspectionPassed: boolean;
  merchandiseProposal?: "Customer" | "Carrier" | null;
  value: "Customer" | "Carrier" | "";
  onChange: (v: "Customer" | "Carrier") => void;
}) {
  if (inspectionPassed) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3 dark:border-amber-800 dark:bg-amber-900/20">
      <div className="flex items-start gap-2">
        <span className="text-amber-500 mt-0.5">⚠</span>
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Inspection Failed — Confirm Damage Source</p>
          {merchandiseProposal && (
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">Merchandise assessment: <strong>{merchandiseProposal === "Carrier" ? "Carrier fault" : "Customer fault"}</strong></p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
            value === "Carrier"
              ? "border-green-400 bg-green-50 dark:bg-green-900/20"
              : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          }`}
        >
          <input
            type="radio"
            name="damageConfirm"
            checked={value === "Carrier"}
            onChange={() => onChange("Carrier")}
            className="accent-green-500"
          />
          <div>
            <div className="text-sm font-semibold text-gray-800 dark:text-white/90">Carrier fault — confirm</div>
            <div className="text-[11px] text-gray-400">Customer gets full refund. No stock restoration. File GHN carrier claim.</div>
          </div>
        </label>
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
            value === "Customer"
              ? "border-red-400 bg-red-50 dark:bg-red-900/20"
              : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          }`}
        >
          <input
            type="radio"
            name="damageConfirm"
            checked={value === "Customer"}
            onChange={() => onChange("Customer")}
            className="accent-red-500"
          />
          <div>
            <div className="text-sm font-semibold text-gray-800 dark:text-white/90">Customer fault — override</div>
            <div className="text-[11px] text-gray-400">Goods returned to customer. No refund issued.</div>
          </div>
        </label>
      </div>
    </div>
  );
}

// ─── Subcomponent: Restock Quantity (System Return — Merchandise at InspectionPending) ─
function RestockQuantitySection({
  details,
  restockQtys,
  onQtyChange,
  damageProposal,
}: {
  details: RefundDetailItem[];
  restockQtys: Record<number, number>;
  onQtyChange: (productId: number, qty: number) => void;
  damageProposal: "Customer" | "Carrier" | "";
}) {
  const isCarrierFault = damageProposal === "Carrier";

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3 dark:border-blue-800 dark:bg-blue-900/10">
      <div>
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Restock Quantity</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Enter the number of items still sellable. Customer still receives a full refund — this only affects inventory.
        </p>
      </div>
      {isCarrierFault && (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <span className="text-amber-500">⚠</span>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Selecting <strong>Carrier fault (GHN)</strong> sets restock quantity to 0 for all items. File a GHN claim.
          </p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-blue-100 dark:border-blue-800">
              <th className="py-2 pr-3 text-left font-medium">Product</th>
              <th className="py-2 px-3 text-center font-medium">Order Qty</th>
              <th className="py-2 pl-3 text-center font-medium">Restock Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50 dark:divide-blue-900">
            {details.map((item) => {
              const currentQty = isCarrierFault ? 0 : (restockQtys[item.productId] ?? item.quantity);
              return (
                <tr key={item.productId}>
                  <td className="py-2.5 pr-3 text-gray-800 dark:text-white/80 max-w-[180px] truncate">{item.productName}</td>
                  <td className="py-2.5 px-3 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                  <td className="py-2.5 pl-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={item.quantity}
                      value={currentQty}
                      disabled={isCarrierFault}
                      onChange={(e) => onQtyChange(item.productId, Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0)))}
                      className={`w-16 rounded-md border text-center text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400
                        ${isCarrierFault ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700" : "bg-white dark:bg-gray-900 dark:text-white/90"}
                        border-gray-300 dark:border-gray-600`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Subcomponent: System Return Complete — shipping toggle + breakdown ────────
function SystemReturnCompleteSection({
  totalAmount,
  customerShippingPaid,
  voucherDiscount,
  includeShipping,
  onIncludeShippingChange,
  damageResponsibility,
  refundDetails,
}: {
  totalAmount: number;
  customerShippingPaid: number;
  voucherDiscount?: number;
  includeShipping: boolean;
  onIncludeShippingChange: (v: boolean) => void;
  damageResponsibility?: string | null;
  refundDetails?: RefundDetailItem[];
}) {
  const productRefundAmount = totalAmount - customerShippingPaid;
  const finalRefund = includeShipping ? totalAmount : productRefundAmount;
  const hasShipFee = customerShippingPaid > 0;

  const totalRestockable = (refundDetails ?? []).reduce((sum, d) => sum + (d.restorableQuantity ?? d.quantity), 0);

  return (
    <div className="rounded-xl border border-green-200 bg-green-50/40 p-4 space-y-4 dark:border-green-800 dark:bg-green-900/10">
      {refundDetails && refundDetails.length > 0 && (
        <div className="rounded-lg bg-white/70 px-3 py-2 text-xs text-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
          Merchandise report: <strong>{totalRestockable}</strong> item(s) eligible for restock
          {damageResponsibility === "Carrier" && <span className="ml-1 text-amber-600">(Carrier fault — no restock)</span>}
        </div>
      )}

      {/* Breakdown */}
      <div className="rounded-lg bg-white/80 px-3 py-3 space-y-1.5 text-sm dark:bg-gray-900/50">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Product amount (after voucher)</span>
          <span className="font-medium text-gray-800 dark:text-white/80">{formatCurrency(productRefundAmount)}</span>
        </div>
        {hasShipFee && (
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Shipping fee paid by customer</span>
            <span className="font-medium text-gray-800 dark:text-white/80">{formatCurrency(customerShippingPaid)}</span>
          </div>
        )}
        {(voucherDiscount ?? 0) > 0 && (
          <div className="flex justify-between text-gray-400 dark:text-gray-500">
            <span>Voucher discount</span>
            <span className="line-through">-{formatCurrency(voucherDiscount ?? 0)} <span className="no-underline text-[10px] not-italic">(not refunded)</span></span>
          </div>
        )}
      </div>

      {/* Shipping toggle */}
      {hasShipFee ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Shipping fee refund option</p>
          {[
            {
              val: true,
              label: "Refund shipping fee",
              sub: `Customer receives ${formatCurrency(totalAmount)}`,
            },
            {
              val: false,
              label: "Do not refund shipping fee",
              sub: `Customer receives ${formatCurrency(productRefundAmount)}`,
            },
          ].map((opt) => (
            <label
              key={String(opt.val)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                includeShipping === opt.val
                  ? "border-[#ff6a00] bg-orange-50 dark:bg-orange-900/20"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              }`}
            >
              <input
                type="radio"
                name="includeShipping"
                checked={includeShipping === opt.val}
                onChange={() => onIncludeShippingChange(opt.val)}
                className="accent-[#ff6a00]"
              />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{opt.label}</div>
                <div className="text-[11px] text-gray-400">{opt.sub}</div>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
          Customer did not pay shipping (freeship voucher) — full refund {formatCurrency(totalAmount)}.
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between rounded-lg bg-green-100/80 px-4 py-2.5 dark:bg-green-900/30">
        <span className="text-sm font-semibold text-green-800 dark:text-green-300">Total wallet refund</span>
        <span className="text-base font-bold text-green-700 dark:text-green-300">{formatCurrency(finalRefund)}</span>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export const RefundStatusModal: React.FC<RefundStatusModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  isSubmitting,
  onSave,
  isSystemReturn = false,
  suggestedFeeBy = "Store",
  approvedAmount,
  currentDamageResponsibility,
  refundDetails = [],
  customerShippingPaid = 0,
  totalAmount,
}) => {
  const nextStatus = getNextStatus(currentStatus, isSystemReturn);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateRefundStatusData>({
    resolver: zodResolver(UpdateRefundStatusSchema),
    defaultValues: {
      status: (nextStatus || "RefundApproved") as UpdateRefundStatusData["status"],
      rejectReason: "",
      adminNote: "",
      inspectionPassed: true,
      inspectionNote: "",
      returnShippingFeeBy: suggestedFeeBy,
      returnShippingFeeNote: "",
      damageResponsibility: undefined,
    },
  });

  const [feeBy, setFeeBy] = React.useState<"Store" | "Customer">(suggestedFeeBy);
  const [overrideNote, setOverrideNote] = React.useState("");
  const [overrideNoteError, setOverrideNoteError] = React.useState("");
  const [damageProposal, setDamageProposal] = React.useState<"Customer" | "Carrier" | "">("");
  const [damageConfirm, setDamageConfirm] = React.useState<"Customer" | "Carrier" | "">("");
  const [includeShipping, setIncludeShipping] = React.useState(true);

  // Restock quantities: productId → qty (default = order quantity)
  const defaultRestockQtys = React.useMemo(
    () => Object.fromEntries(refundDetails.map((d) => [d.productId, d.quantity])),
    [refundDetails]
  );
  const [restockQtys, setRestockQtys] = React.useState<Record<number, number>>(defaultRestockQtys);

  const inspectionPassedWatch = watch("inspectionPassed");

  React.useEffect(() => {
    if (isOpen && nextStatus) {
      reset({
        status: nextStatus,
        rejectReason: "",
        adminNote: "",
        inspectionPassed: true,
        inspectionNote: "",
        returnShippingFeeBy: suggestedFeeBy,
        returnShippingFeeNote: "",
        damageResponsibility: undefined,
      });
      setFeeBy(suggestedFeeBy);
      setOverrideNote("");
      setOverrideNoteError("");
      setDamageProposal("");
      setDamageConfirm(currentDamageResponsibility || "");
      setIncludeShipping(true);
      setRestockQtys(defaultRestockQtys);
    }
  }, [isOpen, nextStatus, reset, currentStatus, suggestedFeeBy, currentDamageResponsibility, defaultRestockQtys]);

  if (!nextStatus) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-6">
        <div>
          <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90">No Transitions Available</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cannot change status from <strong>{currentStatus}</strong>.
          </p>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose} type="button">Close</Button>
          </div>
        </div>
      </Modal>
    );
  }

  const title = getRefundStatusLabel(nextStatus, isSystemReturn);

  // Description per step
  let description = `Are you sure you want to change the status to ${title}?`;
  if (!isSystemReturn) {
    if (nextStatus === "RefundApproved") {
      description = "Confirming this action will approve the customer's refund request. Set return shipping fee responsibility below.";
    } else if (nextStatus === "RefundPickupCreated") {
      description = "The return shipment will be created. If the shipping API fails, the action will be rolled back.";
    } else if (nextStatus === "RefundCompleted") {
      description = "The final refund amount will be credited to the customer's wallet and product quantity updated.";
    }
  }

  const handleFormSubmit = (data: UpdateRefundStatusData) => {
    const payload = { ...data };

    // Non-inspection steps: remove inspection fields
    if (nextStatus !== "RefundInspectionPending") {
      delete payload.inspectionPassed;
      delete payload.inspectionNote;
    }

    // Customer return Approve: fee fields
    if (nextStatus === "RefundApproved" && !isSystemReturn) {
      payload.returnShippingFeeBy = feeBy;
      if (feeBy !== suggestedFeeBy && !overrideNote.trim()) {
        setOverrideNoteError("Override reason is required when changing the suggested party.");
        return;
      }
      payload.returnShippingFeeNote = overrideNote || undefined;
    }

    // DamageResponsibility
    if (nextStatus === "RefundInspectionPending" && damageProposal) {
      payload.damageResponsibility = damageProposal as "Customer" | "Carrier";
    }
    if (nextStatus === "RefundCompleted" && !isSystemReturn && !inspectionPassedWatch && damageConfirm) {
      payload.damageResponsibility = damageConfirm as "Customer" | "Carrier";
    }

    // System return InspectionPending: gửi RestockItems
    if (isSystemReturn && nextStatus === "RefundInspectionPending") {
      const effectiveDamage = damageProposal;
      if (effectiveDamage === "Carrier") {
        payload.restockItems = refundDetails.map((d) => ({ productId: d.productId, restorableQuantity: 0 }));
      } else {
        payload.restockItems = refundDetails.map((d) => ({
          productId: d.productId,
          restorableQuantity: restockQtys[d.productId] ?? d.quantity,
        }));
      }
    }

    // System return Complete: bắt buộc includeShippingInRefund
    if (isSystemReturn && nextStatus === "RefundCompleted") {
      payload.includeShippingInRefund = customerShippingPaid > 0 ? includeShipping : true;
    }

    onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] p-5 lg:p-8">
      <div>
        <div className="mb-5">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">{title}</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Controller name="status" control={control} render={({ field }) => <input type="hidden" {...field} />} />

          {/* Carrier selector (Customer return PickupCreated) */}
          {nextStatus === "RefundPickupCreated" && !isSystemReturn && (
            <div>
              <Label htmlFor="provider">Carrier</Label>
              <select id="provider" disabled className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                <option value="GHN">Giao Hang Nhanh (GHN)</option>
              </select>
            </div>
          )}

          {/* ── Customer return Approve: Return Shipping Fee Section ── */}
          {nextStatus === "RefundApproved" && !isSystemReturn && (
            <ReturnShippingFeeSection
              suggestedFeeBy={suggestedFeeBy}
              approvedAmount={approvedAmount}
              feeBy={feeBy}
              onFeeByChange={setFeeBy}
              overrideNote={overrideNote}
              onOverrideNoteChange={(v) => { setOverrideNote(v); if (v.trim()) setOverrideNoteError(""); }}
              overrideNoteError={overrideNoteError}
            />
          )}

          {/* ── System Return InspectionPending: Restock + Damage Proposal ── */}
          {isSystemReturn && nextStatus === "RefundInspectionPending" ? (
            <>
              <RestockQuantitySection
                details={refundDetails}
                restockQtys={restockQtys}
                onQtyChange={(pid, qty) => setRestockQtys((prev) => ({ ...prev, [pid]: qty }))}
                damageProposal={damageProposal}
              />
              <DamageProposalSection value={damageProposal} onChange={setDamageProposal} />
              <div>
                <Label htmlFor="inspectionNote">Inspection Note (Optional)</Label>
                <TextArea id="inspectionNote" className="mt-2" {...register("inspectionNote")} rows={2} placeholder="Enter item condition notes..." />
              </div>
            </>
          ) : /* ── Customer return InspectionPending ── */
          !isSystemReturn && nextStatus === "RefundInspectionPending" ? (
            <>
              <div>
                <Label htmlFor="inspectionPassed">Quality Inspection Result</Label>
                <Controller
                  name="inspectionPassed"
                  control={control}
                  render={({ field }) => (
                    <select id="inspectionPassed" className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      value={field.value ? "true" : "false"} onChange={(e) => field.onChange(e.target.value === "true")}>
                      <option value="true">Passed</option>
                      <option value="false">Failed</option>
                    </select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="inspectionNote">Inspection Note</Label>
                <TextArea id="inspectionNote" className="mt-2" {...register("inspectionNote")} rows={3}
                  placeholder="Enter quality check or shop inspection notes..." error={!!errors.inspectionNote} hint={errors.inspectionNote?.message} />
              </div>
              <DamageProposalSection value={damageProposal} onChange={setDamageProposal} />
            </>
          ) : /* ── System Return Complete: shipping toggle ── */
          isSystemReturn && nextStatus === "RefundCompleted" ? (
            <SystemReturnCompleteSection
              totalAmount={totalAmount ?? approvedAmount ?? 0}
              customerShippingPaid={customerShippingPaid}
              includeShipping={includeShipping}
              onIncludeShippingChange={setIncludeShipping}
              damageResponsibility={currentDamageResponsibility}
              refundDetails={refundDetails}
            />
          ) : (
            <>
              {/* Customer return Complete: Damage confirmation if inspection failed */}
              {nextStatus === "RefundCompleted" && !isSystemReturn && inspectionPassedWatch === false && (
                <DamageConfirmSection
                  inspectionPassed={false}
                  merchandiseProposal={currentDamageResponsibility}
                  value={damageConfirm}
                  onChange={setDamageConfirm}
                />
              )}

              {/* Generic admin note for other steps */}
              {nextStatus !== "RefundApproved" && nextStatus !== "RefundReceived" && (
                <div>
                  <Label htmlFor="adminNote">Note (Optional)</Label>
                  <TextArea id="adminNote" className="mt-2" {...register("adminNote")} rows={3}
                    placeholder={nextStatus === "RefundCompleted" ? "Enter quality check or shop inspection notes..." : "Enter details or comments about this transition..."}
                    error={!!errors.adminNote} hint={errors.adminNote?.message} />
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : title}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
