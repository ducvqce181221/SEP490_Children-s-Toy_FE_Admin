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
      toast.success("Tạo danh mục thành công");
      onSuccess?.();
      return { success: true, message: "Tạo danh mục thành công", data: result };
    } catch (error) {
      const axiosError = error as AxiosError<ValidationErrorResponse>;
      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data?.errors
      ) {
        return {
          success: false,
          message: "Dữ liệu không hợp lệ",
          validationErrors: axiosError.response.data.errors,
        };
      }

      const errorMessage =
        axiosError.response?.data?.message || "Tạo danh mục thất bại";
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
      toast.success("Cập nhật danh mục thành công");
      onSuccess?.();
      return { success: true, message: "Cập nhật danh mục thành công", data: result };
    } catch (error) {
      const axiosError = error as AxiosError<ValidationErrorResponse>;
      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data?.errors
      ) {
        return {
          success: false,
          message: "Dữ liệu không hợp lệ",
          validationErrors: axiosError.response.data.errors,
        };
      }

      const errorMessage =
        axiosError.response?.data?.message || "Cập nhật danh mục thất bại";
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
