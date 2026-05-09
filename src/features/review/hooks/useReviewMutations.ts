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
      toast.success("Cập nhật trạng thái thành công");
      onSuccess?.();
    } catch (err: unknown) {
      // Axios interceptor đã xử lý toast error global, ở đây chỉ catch để không crash app
      // Nhưng nếu lỗi Validation thì toast có thể không show, có thể log thêm
      console.error("Update Status Error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const createReply = async (id: number, data: ReviewReplyData) => {
    setIsSubmitting(true);
    try {
      await reviewApi.createReply(id, data);
      toast.success("Phản hồi đã được đăng");
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Create Reply Error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateReply = async (id: number, replyProductId: number, data: ReviewReplyData) => {
    setIsSubmitting(true);
    try {
      await reviewApi.updateReply(id, replyProductId, data);
      toast.success("Cập nhật phản hồi thành công");
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Update Reply Error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReply = async (id: number, replyProductId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phản hồi này?")) return;
    
    setIsSubmitting(true);
    try {
      await reviewApi.deleteReply(id, replyProductId);
      toast.success("Xóa phản hồi thành công");
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Delete Reply Error", err);
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
  };
};
