import { useState } from "react";
import toast from "react-hot-toast";
import { promotionApi } from "../services/promotion-api";
import { PromotionFormData, ApiErrorResponse, ValidationErrorResponse } from "../types/promotion";
import { AxiosError } from "axios";

const getErrorMessage = (err: unknown, defaultMsg: string): string => {
  const axiosError = err as AxiosError<ValidationErrorResponse>;
  const data = axiosError.response?.data;
  if (data?.errors) {
    const errorList = Object.entries(data.errors)
      .flatMap(([_, msgs]) => msgs)
      .join("\n");
    if (errorList) return errorList;
  }
  return data?.message || axiosError.message || defaultMsg;
};

export const usePromotionMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPromotion = async (data: PromotionFormData) => {
    setIsSubmitting(true);
    try {
      await promotionApi.create(data);
      toast.success("Promotion created successfully");
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Creation failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePromotion = async (id: number, data: Partial<PromotionFormData & { isDeleted?: boolean }>) => {
    setIsSubmitting(true);
    try {
      await promotionApi.update(id, data);
      toast.success("Promotion updated successfully");
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Update failed"));
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
      toast.error(getErrorMessage(err, "Deletion failed"));
      throw err; // throw so caller can catch
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createPromotion, updatePromotion, deletePromotion, isSubmitting };
};
