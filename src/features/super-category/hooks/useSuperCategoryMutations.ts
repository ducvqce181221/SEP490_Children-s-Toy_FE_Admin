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
      toast.success("Tạo danh mục lớn thành công");
      onSuccess?.();
      return { success: true, message: "Tạo danh mục lớn thành công", data: result };
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
        axiosError.response?.data?.message || "Tạo danh mục lớn thất bại";
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
      toast.success("Cập nhật danh mục lớn thành công");
      onSuccess?.();
      return { success: true, message: "Cập nhật danh mục lớn thành công", data: result };
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
        axiosError.response?.data?.message || "Cập nhật danh mục lớn thất bại";
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
