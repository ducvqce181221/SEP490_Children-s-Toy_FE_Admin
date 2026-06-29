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
}

// Helper to determine the single next valid status transition
export const getNextStatus = (currentStatus: string, isSystemReturn: boolean = false): UpdateRefundStatusData["status"] | null => {
  switch (currentStatus) {
    case "RefundRequested":
      return "RefundApproved";
    case "RefundRejected":
      if (isSystemReturn) return "RefundApproved";
      return null;
    case "RefundApproved":
      return isSystemReturn ? "RefundCompleted" : "RefundPickupCreated";
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

const getRefundStatusLabel = (status: string) => {
  switch (status) {
    case "RefundApproved": return "Approve Refund Request";
    case "RefundPickupCreated": return "Create Return Shipping Order";
    case "RefundShipping": return "Ship Return Package";
    case "RefundReceived": return "Receive Return Package";
    case "RefundInspectionPending": return "Send to Quality Inspection";
    case "RefundCompleted": return "Complete Refund & Disburse";
    default: return status;
  }
};

// ─── Subcomponent: Return Shipping Fee Section (hiện tại bước Approve) ────────
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
  // Hiển thị ước tính (FE không có phí GHN thực, chỉ là thông tin tham khảo)
  const estimatedFinalAmount =
    feeBy === "Customer" && approvedAmount != null
      ? `~${formatCurrency(Math.max(0, approvedAmount - 30000))} (after ~30,000đ fee)`
      : approvedAmount != null
      ? formatCurrency(approvedAmount)
      : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 dark:border-gray-700 dark:bg-gray-800/40">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Return Shipping Fee
        </span>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          System suggestion: {suggestedFeeBy}
        </span>
      </div>

      <div className="flex gap-3">
        {(["Store", "Customer"] as const).map((opt) => (
          <label
            key={opt}
            className={`flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-colors ${
              feeBy === opt
                ? "border-[#ff6a00] bg-orange-50 dark:bg-orange-900/20"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            }`}
          >
            <input
              type="radio"
              name="returnShippingFeeBy"
              value={opt}
              checked={feeBy === opt}
              onChange={() => onFeeByChange(opt)}
              className="accent-[#ff6a00]"
            />
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {opt === "Store" ? "Store bears cost" : "Customer bears cost"}
                {opt === suggestedFeeBy && (
                  <span className="ml-1.5 text-[10px] font-normal text-green-600">✓ suggested</span>
                )}
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
          <span className="text-gray-500">Estimated final refund:</span>
          <span className={`font-bold ${feeBy === "Customer" ? "text-amber-600" : "text-green-600"}`}>
            {estimatedFinalAmount}
          </span>
        </div>
      )}

      {/* Warning nếu FinalRefundAmount = 0 */}
      {feeBy === "Customer" && approvedAmount != null && approvedAmount <= 30000 && (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <span className="text-amber-500">⚠</span>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Return shipping fee may equal or exceed the approved amount.
            Customer could receive <strong>0đ</strong> after deduction.
          </p>
        </div>
      )}

      {/* Override note — bắt buộc nếu khác suggestion */}
      {isOverriding && (
        <div>
          <Label htmlFor="returnShippingFeeNote">
            Override Reason <span className="text-red-500">*</span>
          </Label>
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

// ─── Subcomponent: Damage Responsibility (Merchandise đề xuất tại InspectionPending) ─
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
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Damage Assessment <span className="font-normal text-gray-400">(Optional)</span>
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          If goods appear damaged, propose the cause. Staff will confirm.
        </p>
      </div>
      <div className="space-y-2">
        {[
          { val: "", label: "No visible damage", sub: "Goods appear normal" },
          { val: "Customer", label: "Damage — Customer fault", sub: "Goods sent in damaged condition" },
          { val: "Carrier", label: "Damage — Carrier fault", sub: "Likely damaged in transit (GHN)" },
        ].map((opt) => (
          <label
            key={opt.val}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              value === opt.val
                ? "border-[#ff6a00] bg-orange-50/60 dark:bg-orange-900/10"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            }`}
          >
            <input
              type="radio"
              name="damageProposal"
              checked={value === opt.val}
              onChange={() => onChange(opt.val as "Customer" | "Carrier" | "")}
              className="accent-[#ff6a00]"
            />
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

// ─── Subcomponent: Damage Responsibility Confirmation (Staff tại Complete) ─────
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
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Inspection Failed — Confirm Damage Source
          </p>
          {merchandiseProposal && (
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
              Merchandise assessment: <strong>{merchandiseProposal} fault</strong>
            </p>
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
            <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Carrier fault — confirm
            </div>
            <div className="text-[11px] text-gray-400">
              Customer gets full refund. No stock restoration. File GHN carrier claim.
            </div>
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
            <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Customer fault — override
            </div>
            <div className="text-[11px] text-gray-400">
              Goods returned to customer. No refund issued.
            </div>
          </div>
        </label>
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

  // Local state cho các field mới (controlled outside react-hook-form để tránh type conflict)
  const [feeBy, setFeeBy] = React.useState<"Store" | "Customer">(suggestedFeeBy);
  const [overrideNote, setOverrideNote] = React.useState("");
  const [overrideNoteError, setOverrideNoteError] = React.useState("");
  const [damageProposal, setDamageProposal] = React.useState<"Customer" | "Carrier" | "">("");
  const [damageConfirm, setDamageConfirm] = React.useState<"Customer" | "Carrier" | "">("");

  const inspectionPassedWatch = watch("inspectionPassed");

  // Reset khi modal mở
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
    }
  }, [isOpen, nextStatus, reset, currentStatus, suggestedFeeBy, currentDamageResponsibility]);

  if (!nextStatus) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-6">
        <div>
          <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90">
            No Transitions Available
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cannot change status from <strong>{currentStatus}</strong>.
          </p>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose} type="button">
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const title = getRefundStatusLabel(nextStatus);
  let description = `Are you sure you want to change the status to ${getRefundStatusLabel(nextStatus)}?`;
  if (nextStatus === "RefundApproved") {
    description = "Confirming this action will approve the customer's refund request. Set return shipping fee responsibility below.";
  } else if (nextStatus === "RefundPickupCreated") {
    description = "The return shipment will be created. If the shipping API fails, the action will be rolled back.";
  } else if (nextStatus === "RefundCompleted") {
    description = "The final refund amount will be credited to the customer's wallet and product quantity updated.";
  }

  const handleFormSubmit = (data: UpdateRefundStatusData) => {
    const payload = { ...data };

    // Bước InspectionPending: không cần fee fields
    if (nextStatus !== "RefundInspectionPending") {
      delete payload.inspectionPassed;
      delete payload.inspectionNote;
    }

    // Gắn fee fields khi Approve
    if (nextStatus === "RefundApproved") {
      payload.returnShippingFeeBy = feeBy;
      // Validate override note
      if (feeBy !== suggestedFeeBy && !overrideNote.trim()) {
        setOverrideNoteError("Override reason is required when changing the suggested party.");
        return;
      }
      payload.returnShippingFeeNote = overrideNote || undefined;
    }

    // Gắn damageResponsibility
    if (nextStatus === "RefundInspectionPending" && damageProposal) {
      payload.damageResponsibility = damageProposal as "Customer" | "Carrier";
    }
    if (nextStatus === "RefundCompleted" && !inspectionPassedWatch && damageConfirm) {
      payload.damageResponsibility = damageConfirm as "Customer" | "Carrier";
    }

    onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] p-5 lg:p-8">
      <div>
        <div className="mb-5">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Controller
            name="status"
            control={control}
            render={({ field }) => <input type="hidden" {...field} />}
          />

          {/* Carrier selector (PickupCreated) */}
          {nextStatus === "RefundPickupCreated" && (
            <div>
              <Label htmlFor="provider">Carrier</Label>
              <select
                id="provider"
                disabled
                className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="GHN">Giao Hang Nhanh (GHN)</option>
              </select>
            </div>
          )}

          {/* ── Approve: Return Shipping Fee Section ── */}
          {nextStatus === "RefundApproved" && (
            <ReturnShippingFeeSection
              suggestedFeeBy={suggestedFeeBy}
              approvedAmount={approvedAmount}
              feeBy={feeBy}
              onFeeByChange={setFeeBy}
              overrideNote={overrideNote}
              onOverrideNoteChange={(v) => {
                setOverrideNote(v);
                if (v.trim()) setOverrideNoteError("");
              }}
              overrideNoteError={overrideNoteError}
            />
          )}

          {/* ── InspectionPending: Quality Inspection + Damage Proposal ── */}
          {nextStatus === "RefundInspectionPending" ? (
            <>
              <div>
                <Label htmlFor="inspectionPassed">Quality Inspection Result</Label>
                <Controller
                  name="inspectionPassed"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="inspectionPassed"
                      className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      value={field.value ? "true" : "false"}
                      onChange={(e) => field.onChange(e.target.value === "true")}
                    >
                      <option value="true">Passed</option>
                      <option value="false">Failed</option>
                    </select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="inspectionNote">Inspection Note</Label>
                <TextArea
                  id="inspectionNote"
                  className="mt-2"
                  {...register("inspectionNote")}
                  rows={3}
                  placeholder="Enter quality check or warehouse inspection notes..."
                  error={!!errors.inspectionNote}
                  hint={errors.inspectionNote?.message}
                />
              </div>

              {/* Merchandise đề xuất DamageResponsibility */}
              <DamageProposalSection
                value={damageProposal}
                onChange={setDamageProposal}
              />
            </>
          ) : (
            <>
              {/* ── Complete: Damage Confirmation nếu inspection failed ── */}
              {nextStatus === "RefundCompleted" && inspectionPassedWatch === false && (
                <DamageConfirmSection
                  inspectionPassed={false}
                  merchandiseProposal={currentDamageResponsibility}
                  value={damageConfirm}
                  onChange={setDamageConfirm}
                />
              )}

              {/* Note chung cho các bước khác */}
              {nextStatus !== "RefundApproved" && (
                <div>
                  <Label htmlFor="adminNote">Note (Optional)</Label>
                  <TextArea
                    id="adminNote"
                    className="mt-2"
                    {...register("adminNote")}
                    rows={3}
                    placeholder={
                      nextStatus === "RefundCompleted"
                        ? "Enter quality check or warehouse inspection notes..."
                        : "Enter details or comments about this transition..."
                    }
                    error={!!errors.adminNote}
                    hint={errors.adminNote?.message}
                  />
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : title}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
