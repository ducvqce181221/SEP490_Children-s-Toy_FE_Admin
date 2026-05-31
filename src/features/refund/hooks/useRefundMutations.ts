import { useState } from "react";
import toast from "react-hot-toast";
import { refundApi } from "../services/refund-api";
import { UpdateRefundStatusData } from "../types/refund.schema";

export const useRefundMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateStatus = async (id: number, data: UpdateRefundStatusData) => {
    setIsSubmitting(true);
    try {
      await refundApi.updateStatus(id, data);
      toast.success("Status updated successfully");
      onSuccess?.();
    } catch (error) {
      // Error is handled globally by axios interceptor, but we catch to stop execution
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isReassigning, setIsReassigning] = useState(false);

  const reassign = async (id: number, data: { roleId: number; newScheduleId: number; notes?: string }) => {
    setIsReassigning(true);
    try {
      await refundApi.reassign(id, data);
      toast.success("Refund reassigned successfully");
      onSuccess?.();
      return { success: true };
    } catch (error) {
      return { success: false };
    } finally {
      setIsReassigning(false);
    }
  };

  return {
    updateStatus,
    isSubmitting,
    reassign,
    isReassigning,
  };
};
