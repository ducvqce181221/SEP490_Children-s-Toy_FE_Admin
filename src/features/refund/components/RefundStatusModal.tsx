"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateRefundStatusData, UpdateRefundStatusSchema } from "../types/refund.schema";

interface RefundStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  isSubmitting: boolean;
  onSave: (data: UpdateRefundStatusData) => void;
  isSystemReturn?: boolean;
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

export const RefundStatusModal: React.FC<RefundStatusModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  isSubmitting,
  onSave,
  isSystemReturn = false,
}) => {
  const nextStatus = getNextStatus(currentStatus, isSystemReturn);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateRefundStatusData>({
    resolver: zodResolver(UpdateRefundStatusSchema),
    defaultValues: {
      status: (nextStatus || "RefundApproved") as UpdateRefundStatusData["status"],
      rejectReason: "",
      adminNote: "",
    },
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && nextStatus) {
      reset({
        status: nextStatus,
        rejectReason: "",
        adminNote: "",
      });
    }
  }, [isOpen, nextStatus, reset]);

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

  // Get action-specific details
  const title = getRefundStatusLabel(nextStatus);
  let description = `Are you sure you want to change the status to ${getRefundStatusLabel(nextStatus)}?`;
  
  if (nextStatus === "RefundApproved") {
    description = "Confirming this action will approve the customer's refund request. The refund will proceed to the next step.";
  } else if (nextStatus === "RefundPickupCreated") {
    description = "The return shipment will be created. If the shipping API fails, the action will be rolled back.";
  } else if (nextStatus === "RefundCompleted") {
    description = "Are you sure you want to complete this refund? The approved amount will be credited to the customer's wallet and stock inventory will be updated.";
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-5 lg:p-8">
      <div>
        <div className="mb-5">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <Controller
            name="status"
            control={control}
            render={({ field }) => <input type="hidden" {...field} />}
          />

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
