import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { UpdateReviewStatusData, UpdateReviewStatusSchema } from "../types/review.schema";

interface ReviewStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  isSubmitting: boolean;
  onSave: (data: UpdateReviewStatusData) => void;
}

export const ReviewStatusModal: React.FC<ReviewStatusModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  isSubmitting,
  onSave,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateReviewStatusData>({
    resolver: zodResolver(UpdateReviewStatusSchema),
    mode: "onChange",
    defaultValues: {
      moderationStatus: currentStatus as UpdateReviewStatusData["moderationStatus"],
      reason: "",
    },
  });

  const watchedReason = watch("reason");
  const watchedStatus = watch("moderationStatus");

  useEffect(() => {
    if (isOpen) {
      reset({
        moderationStatus: currentStatus as UpdateReviewStatusData["moderationStatus"],
        reason: "",
      });
    }
  }, [isOpen, currentStatus, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-5 lg:p-6">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Update Status
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Change the status of this review and optionally provide a reason.
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSave)}>
        <div>
          <Label>
            Status <span className="text-error-500">*</span>
          </Label>
          <Select
            options={[
              { value: currentStatus, label: currentStatus === "ManualReview" ? "Manual Review" : currentStatus },
              ...(currentStatus !== "Approved" ? [{ value: "Approved", label: "Approved" }] : []),
              ...(currentStatus !== "Rejected" ? [{ value: "Rejected", label: "Rejected" }] : []),
            ].filter((v, i, a) => a.findIndex(t => t.value === v.value) === i)}
            error={!!errors.moderationStatus}
            hint={errors.moderationStatus?.message}
            disabled={isSubmitting}
            {...register("moderationStatus")}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <Label className="mb-0">
              Reason {watchedStatus === "Rejected" && <span className="text-error-500">*</span>}
            </Label>
            <span className="text-[10px] text-gray-400 font-normal">
              {(watchedReason || "").length}/500
            </span>
          </div>
          <TextArea
            placeholder="Enter reason for status change..."
            rows={3}
            error={!!errors.reason}
            hint={errors.reason?.message}
            disabled={isSubmitting}
            {...register("reason")}
          />
        </div>

        <div className="flex items-center gap-3 justify-end mt-2 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || watchedStatus === currentStatus}>
            {isSubmitting ? "Saving..." : "Update Status"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
