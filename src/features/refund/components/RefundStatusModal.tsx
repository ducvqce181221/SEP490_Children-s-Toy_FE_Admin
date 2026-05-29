"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
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

export const RefundStatusModal: React.FC<RefundStatusModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  isSubmitting,
  onSave,
  isSystemReturn = false,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateRefundStatusData>({
    resolver: zodResolver(UpdateRefundStatusSchema),
    defaultValues: {
      status: (["RefundApproved", "RefundRejected", "RefundPickupCreated", "RefundShipping", "RefundReceived", "RefundInspectionPending", "RefundCompleted", "RefundCancelled"].includes(currentStatus)
        ? currentStatus
        : "RefundApproved") as UpdateRefundStatusData["status"],
      rejectReason: "",
      shippingOrderCode: "",
      adminNote: "",
    },
  });

  const selectedStatus = watch("status");

  // Only allow specific transitions based on current status
  const availableOptions = () => {
    switch (currentStatus) {
      case "RefundRequested":
        if (isSystemReturn) {
          return [{ value: "RefundApproved", label: "Approve Refund Request" }];
        }
        return [
          { value: "RefundApproved", label: "Approve Refund Request" },
          { value: "RefundRejected", label: "Reject Request" },
        ];
      case "RefundRejected":
        if (isSystemReturn) {
          return [{ value: "RefundApproved", label: "Reopen — Approve Refund" }];
        }
        return [];
      case "RefundApproved":
        if (isSystemReturn) {
          return [
            { value: "RefundCompleted", label: "Complete Refund & Disburse" },
          ];
        }
        return [
          { value: "RefundPickupCreated", label: "Create Return Shipping Order" },
          { value: "RefundRejected", label: "Reject Request" },
        ];
      case "RefundPickupCreated":
        return [
          { value: "RefundShipping", label: "Ship Return Package" },
          { value: "RefundRejected", label: "Reject Request" },
        ];
      case "RefundShipping":
        return [
          { value: "RefundReceived", label: "Receive Return Package" },
          { value: "RefundRejected", label: "Reject Request" },
        ];
      case "RefundReceived":
        return [
          { value: "RefundInspectionPending", label: "Send to Quality Inspection" },
          { value: "RefundRejected", label: "Reject Request" },
        ];
      case "RefundInspectionPending":
        return [
          { value: "RefundCompleted", label: "Complete Refund & Disburse" },
          { value: "RefundRejected", label: "Reject Request" },
        ];
      default:
        return [];
    }
  };

  const options = availableOptions();

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      reset({
        status: options.length > 0
          ? (options[0].value as UpdateRefundStatusData["status"])
          : (["RefundApproved", "RefundRejected", "RefundPickupCreated", "RefundShipping", "RefundReceived", "RefundInspectionPending", "RefundCompleted", "RefundCancelled"].includes(currentStatus)
            ? currentStatus as UpdateRefundStatusData["status"]
            : "RefundApproved"),
        rejectReason: "",
        shippingOrderCode: "",
        adminNote: "",
      });
    }
  }, [isOpen, currentStatus, reset, options.length]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px]">
      <div className="p-6">
        <h3 className="mb-5 text-lg font-bold text-gray-800 dark:text-white/90">
          Update Refund Status
        </h3>

        {options.length === 0 ? (
          <div className="text-gray-500 mb-6 text-sm">
            Cannot change status from <strong>{currentStatus}</strong>.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <Label>New Status <span className="text-error-500">*</span></Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={options}
                  />
                )}
              />
              {errors.status && (
                <p className="mt-1 text-sm text-error-500">{errors.status.message}</p>
              )}
            </div>

            {selectedStatus === "RefundRejected" && (
              <div>
                <Label>Reason for Rejection <span className="text-error-500">*</span></Label>
                <Controller
                  name="rejectReason"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter the reason for rejection..."
                      className={errors.rejectReason ? "border-error-500" : ""}
                    />
                  )}
                />
                {errors.rejectReason && (
                  <p className="mt-1 text-sm text-error-500">{errors.rejectReason.message}</p>
                )}
              </div>
            )}

            {selectedStatus === "RefundPickupCreated" && (
              <div>
                <Label>Shipping Order Tracking Code</Label>
                <Controller
                  name="shippingOrderCode"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter GHN/Courier tracking code..."
                      className={errors.shippingOrderCode ? "border-error-500" : ""}
                    />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to automatically call GHN API to create a return shipping order. Enter a code if you want to fill it manually.
                </p>
                {errors.shippingOrderCode && (
                  <p className="mt-1 text-sm text-error-500">{errors.shippingOrderCode.message}</p>
                )}
              </div>
            )}

            {(selectedStatus === "RefundInspectionPending" || selectedStatus === "RefundCompleted") && (
              <div>
                <Label>Quality Inspection / Warehouse Note</Label>
                <Controller
                  name="adminNote"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      placeholder="Enter details about returned items quality check..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm resize-none outline-none focus:border-brand-500 h-24"
                    />
                  )}
                />
                {errors.adminNote && (
                  <p className="mt-1 text-sm text-error-500">{errors.adminNote.message}</p>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
