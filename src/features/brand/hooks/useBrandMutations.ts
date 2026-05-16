import { AxiosError } from "axios";
import { useState } from "react";
import { brandApi } from "../services/brand-api";
import {
  ApiErrorResponse,
  BrandFormRequest,
  BrandMutationResult,
  ValidationErrorResponse,
} from "../types/brand";

export const useBrandMutations = (onSuccess?: () => void) => {
  const [isCreating, setIsCreating] = useState(false);
  const [updatingBrandId, setUpdatingBrandId] = useState<number | null>(null);

  const createBrand = async (
    payload: BrandFormRequest,
  ): Promise<BrandMutationResult> => {
    setIsCreating(true);

    try {
      const createdBrand = await brandApi.createBrand(payload);
      onSuccess?.();

      return {
        success: true,
        message: "Brand created successfully.",
        data: createdBrand,
      };
    } catch (error) {
      const axiosError = error as AxiosError<
        ValidationErrorResponse | ApiErrorResponse
      >;

      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data &&
        "errors" in axiosError.response.data
      ) {
        return {
          success: false,
          message: axiosError.response.data.message,
          validationErrors: axiosError.response.data.errors,
        };
      }

      return {
        success: false,
        message:
          axiosError.response?.data?.message ??
          "Unable to create brand. Please try again.",
      };
    } finally {
      setIsCreating(false);
    }
  };

  const updateBrand = async (
    brandId: number,
    payload: BrandFormRequest,
  ): Promise<BrandMutationResult> => {
    setUpdatingBrandId(brandId);

    try {
      const updatedBrand = await brandApi.updateBrand(brandId, payload);
      onSuccess?.();

      return {
        success: true,
        message: "Brand updated successfully.",
        data: updatedBrand,
      };
    } catch (error) {
      const axiosError = error as AxiosError<
        ValidationErrorResponse | ApiErrorResponse
      >;

      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data &&
        "errors" in axiosError.response.data
      ) {
        return {
          success: false,
          message: axiosError.response.data.message,
          validationErrors: axiosError.response.data.errors,
        };
      }

      return {
        success: false,
        message:
          axiosError.response?.data?.message ??
          "Unable to update brand. Please try again.",
      };
    } finally {
      setUpdatingBrandId(null);
    }
  };

  return {
    createBrand,
    updateBrand,
    isCreating,
    updatingBrandId,
  };
};
