import { AxiosError } from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { productApi } from "../services/product-api";
import { ProductFormData } from "../types/product.schema";
import {
  ProductMutationResult,
  ValidationErrorResponse,
} from "../types/product";

export const useProductMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProduct = async (
    data: ProductFormData,
  ): Promise<ProductMutationResult> => {
    setIsSubmitting(true);
    try {
      const result = await productApi.createProduct(data);
      toast.success("Product created successfully");
      onSuccess?.();
      return { success: true, message: "Product created successfully", data: result };
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
        axiosError.response?.data?.message || "Failed to create product";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProduct = async (
    id: number,
    data: ProductFormData,
  ): Promise<ProductMutationResult> => {
    setIsSubmitting(true);
    try {
      const result = await productApi.updateProduct(id, data);
      toast.success("Product updated successfully");
      onSuccess?.();
      return { success: true, message: "Product updated successfully", data: result };
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
        axiosError.response?.data?.message || "Failed to update product";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createProduct,
    updateProduct,
    isSubmitting,
  };
};
