import { useState } from "react";
import toast from "react-hot-toast";
import { promotionApi } from "../services/promotion-api";
import { PromotionFormData, ApiErrorResponse, ValidationErrorResponse } from "../types/promotion";
import { AxiosError } from "axios";

export const usePromotionMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPromotion = async (data: PromotionFormData) => {
    setIsSubmitting(true);
    try {
      await promotionApi.create(data);
      toast.success("Promotion created successfully");
      onSuccess?.();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ValidationErrorResponse>;
      const message = axiosError.response?.data?.message || axiosError.message || "Creation failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePromotion = async (id: number, data: PromotionFormData) => {
    setIsSubmitting(true);
    try {
      await promotionApi.update(id, data);
      toast.success("Promotion updated successfully");
      onSuccess?.();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ValidationErrorResponse>;
      const message = axiosError.response?.data?.message || axiosError.message || "Update failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePromotion = async (id: number) => {
    setIsSubmitting(true);
    try {
      await promotionApi.delete(id);
      toast.success("Promotion deleted successfully");
      onSuccess?.();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message || axiosError.message || "Deletion failed";
      toast.error(message);
      throw err; // throw so caller can catch
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createPromotion, updatePromotion, deletePromotion, isSubmitting };
};
