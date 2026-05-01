import { useState } from "react";
import toast from "react-hot-toast";
import { promotionApi } from "../services/promotion-api";
import { PromotionFormData } from "../types/promotion";

export const usePromotionMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPromotion = async (data: PromotionFormData) => {
    setIsSubmitting(true);
    try {
      await promotionApi.create(data);
      toast.success("Tạo chương trình khuyến mãi thành công");
      onSuccess?.();
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Tạo thất bại";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePromotion = async (id: number, data: PromotionFormData) => {
    setIsSubmitting(true);
    try {
      await promotionApi.update(id, data);
      toast.success("Cập nhật chương trình khuyến mãi thành công");
      onSuccess?.();
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Cập nhật thất bại";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePromotion = async (id: number) => {
    setIsSubmitting(true);
    try {
      await promotionApi.delete(id);
      toast.success("Xóa chương trình khuyến mãi thành công");
      onSuccess?.();
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Xóa thất bại";
      toast.error(message);
      throw err; // throw so caller can catch
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createPromotion, updatePromotion, deletePromotion, isSubmitting };
};
