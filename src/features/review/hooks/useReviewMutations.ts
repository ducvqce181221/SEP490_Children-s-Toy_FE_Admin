import { useState } from "react";
import toast from "react-hot-toast";
import { reviewApi } from "../services/review-api";
import { ReviewReplyData, UpdateReviewStatusData } from "../types/review.schema";

export const useReviewMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const updateStatus = async (id: number, data: UpdateReviewStatusData) => {
    setIsSubmitting(true);
    try {
      await reviewApi.updateStatus(id, data);
      toast.success("Status updated successfully");
      onSuccess?.();
    } catch (err: any) {
      console.error("Update Status Error", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to update status";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const createReply = async (id: number, data: ReviewReplyData) => {
    setIsSubmitting(true);
    try {
      await reviewApi.createReply(id, data);
      toast.success("Reply posted successfully");
      onSuccess?.();
    } catch (err: any) {
      console.error("Create Reply Error", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to post reply";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateReply = async (id: number, replyProductId: number, data: ReviewReplyData) => {
    setIsSubmitting(true);
    try {
      await reviewApi.updateReply(id, replyProductId, data);
      toast.success("Reply updated successfully");
      onSuccess?.();
    } catch (err: any) {
      console.error("Update Reply Error", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to update reply";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReply = async (id: number, replyProductId: number) => {
    setIsSubmitting(true);
    try {
      await reviewApi.deleteReply(id, replyProductId);
      toast.success("Reply deleted successfully");
      onSuccess?.();
    } catch (err: any) {
      console.error("Delete Reply Error", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to delete reply";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReview = async (id: number) => {
    setIsSubmitting(true);
    try {
      await reviewApi.updateStatus(id, { isDeleted: true });
      toast.success("Review deleted successfully");
      onSuccess?.();
    } catch (err: any) {
      console.error("Delete Review Error", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to delete review";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    updateStatus,
    createReply,
    updateReply,
    deleteReply,
    deleteReview,
  };
};
