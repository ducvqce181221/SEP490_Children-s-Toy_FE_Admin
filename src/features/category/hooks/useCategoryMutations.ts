import { AxiosError } from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { categoryApi } from "../services/category-api";
import { CategoryFormData } from "../types/category.schema";
import {
  CategoryMutationResult,
  ValidationErrorResponse,
} from "../types/category";

export const useCategoryMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCategory = async (
    data: CategoryFormData,
  ): Promise<CategoryMutationResult> => {
    setIsSubmitting(true);
    try {
      const result = await categoryApi.createCategory(data);
      toast.success("Category created successfully");
      onSuccess?.();
      return { success: true, message: "Category created successfully", data: result };
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
        axiosError.response?.data?.message || "Failed to create category";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCategory = async (
    id: number,
    data: CategoryFormData,
  ): Promise<CategoryMutationResult> => {
    setIsSubmitting(true);
    try {
      const result = await categoryApi.updateCategory(id, data);
      toast.success("Category updated successfully");
      onSuccess?.();
      return { success: true, message: "Category updated successfully", data: result };
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
        axiosError.response?.data?.message || "Failed to update category";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createCategory,
    updateCategory,
    isSubmitting,
  };
};
