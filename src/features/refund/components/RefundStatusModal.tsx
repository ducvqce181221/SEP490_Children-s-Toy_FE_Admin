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
}

export const RefundStatusModal: React.FC<RefundStatusModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  isSubmitting,
  onSave,
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
      status: (["Approved", "Rejected", "Completed"].includes(currentStatus)
        ? currentStatus
        : "Approved") as UpdateRefundStatusData["status"],
      rejectReason: "",
    },
  });

  const selectedStatus = watch("status");

  // Only allow specific transitions based on current status
  const availableOptions = () => {
    switch (currentStatus) {
      case "Requested":
        return [
          { value: "Approved", label: "Approve Refund" },
          { value: "Rejected", label: "Reject Refund" },
        ];
      case "Approved":
        return [
          { value: "Completed", label: "Complete Refund" },
          { value: "Rejected", label: "Reject Refund" },
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
          : (["Approved", "Rejected", "Completed"].includes(currentStatus)
            ? currentStatus as UpdateRefundStatusData["status"]
            : "Approved"),
        rejectReason: ""
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

            {selectedStatus === "Rejected" && (
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
