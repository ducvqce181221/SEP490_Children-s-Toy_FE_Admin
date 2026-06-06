import { AxiosError } from "axios";
import { useState } from "react";
import { customerApi } from "../services/customer-api";
import {
  ApiErrorResponse,
  CustomerDetail,
  ManualBlockCustomerRequest,
  UpdateCustomerRequest,
  UpdateCustomerResult,
  ValidationErrorResponse,
} from "../types/customer";

export const useCustomerMutations = (onSuccess?: () => void) => {
  const [updatingCustomerId, setUpdatingCustomerId] = useState<number | null>(null);
  const [blockingCustomerId, setBlockingCustomerId] = useState<number | null>(null);

  const updateCustomer = async (
    customerId: number,
    payload: UpdateCustomerRequest,
  ): Promise<UpdateCustomerResult> => {
    setUpdatingCustomerId(customerId);

    try {
      const updatedCustomer = await customerApi.updateCustomer(customerId, payload);
      onSuccess?.();

      return {
        success: true,
        message: "Customer status updated successfully.",
        data: updatedCustomer as CustomerDetail,
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
          "Unable to update customer. Please try again.",
      };
    } finally {
      setUpdatingCustomerId(null);
    }
  };

  const blockCustomerForDeliveryAbuse = async (
    customerId: number,
    payload: ManualBlockCustomerRequest,
  ): Promise<UpdateCustomerResult> => {
    setBlockingCustomerId(customerId);

    try {
      const blockedCustomer = await customerApi.blockCustomerForDeliveryAbuse(customerId, payload);
      onSuccess?.();

      return {
        success: true,
        message: "Customer account locked successfully.",
        data: blockedCustomer as CustomerDetail,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ??
          "Unable to lock customer account. Please try again.",
      };
    } finally {
      setBlockingCustomerId(null);
    }
  };

  return {
    updateCustomer,
    blockCustomerForDeliveryAbuse,
    updatingCustomerId,
    blockingCustomerId,
  };
};
