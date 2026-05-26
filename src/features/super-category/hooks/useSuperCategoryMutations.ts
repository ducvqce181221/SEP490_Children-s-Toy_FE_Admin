import { AxiosError } from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { superCategoryApi } from "../services/super-category-api";
import { SuperCategoryFormData } from "../types/super-category.schema";
import {
  SuperCategoryMutationResult,
  ValidationErrorResponse,
} from "../types/super-category";

export const useSuperCategoryMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSuperCategory = async (
    data: SuperCategoryFormData,
  ): Promise<SuperCategoryMutationResult> => {
    setIsSubmitting(true);
    try {
      const result = await superCategoryApi.createSuperCategory(data);
      toast.success("Super category created successfully");
      onSuccess?.();
      return { success: true, message: "Super category created successfully", data: result };
    } catch (error) {
      const axiosError = error as AxiosError<ValidationErrorResponse>;
      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data?.errors
      ) {
        return {
          success: false,
          message: "Invalid data",
          validationErrors: axiosError.response.data.errors,
        };
      }

      const errorMessage =
        axiosError.response?.data?.message || "Failed to create super category";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSuperCategory = async (
    id: number,
    data: SuperCategoryFormData,
  ): Promise<SuperCategoryMutationResult> => {
    setIsSubmitting(true);
    try {
      const result = await superCategoryApi.updateSuperCategory(id, data);
      toast.success("Super category updated successfully");
      onSuccess?.();
      return { success: true, message: "Super category updated successfully", data: result };
    } catch (error) {
      const axiosError = error as AxiosError<ValidationErrorResponse>;
      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data?.errors
      ) {
        return {
          success: false,
          message: "Invalid data",
          validationErrors: axiosError.response.data.errors,
        };
      }

      const errorMessage =
        axiosError.response?.data?.message || "Failed to update super category";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createSuperCategory,
    updateSuperCategory,
    isSubmitting,
  };
};
