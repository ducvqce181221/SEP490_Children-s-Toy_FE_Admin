import { AxiosError } from "axios";
import { useState } from "react";
import { accountApi } from "../services/account-api";
import {
  ApiErrorResponse,
  CreateAccountRequest,
  CreateAccountResult,
  UpdateAccountInfoRequest,
  UpdateAccountInfoResult,
  UpdateAccountPasswordRequest,
  ValidationErrorResponse,
} from "../types/account";
export type UpdateAccountPasswordResult = CreateAccountResult;

export const useAccountMutations = (onSuccess?: () => void) => {
  const [isCreating, setIsCreating] = useState(false);
  const [updatingInfoAccountId, setUpdatingInfoAccountId] = useState<number | null>(null);
  const [updatingPasswordAccountId, setUpdatingPasswordAccountId] = useState<number | null>(null);

  const createAccount = async (
    payload: CreateAccountRequest,
  ): Promise<CreateAccountResult> => {
    setIsCreating(true);

    try {
      await accountApi.createAccount(payload);
      onSuccess?.();

      return {
        success: true,
        message: "Account created successfully.",
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
          "Unable to create account. Please try again.",
      };
    } finally {
      setIsCreating(false);
    }
  };

  const updateAccountInfo = async (
    accountId: number,
    payload: UpdateAccountInfoRequest,
  ): Promise<UpdateAccountInfoResult> => {
    setUpdatingInfoAccountId(accountId);

    try {
      const updatedAccount = await accountApi.updateAccountInfo(accountId, payload);
      onSuccess?.();

      return {
        success: true,
        message: "Account updated successfully.",
        data: updatedAccount,
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
          "Unable to update account information. Please try again.",
      };
    } finally {
      setUpdatingInfoAccountId(null);
    }
  };

  const updateAccountPassword = async (
    accountId: number,
    payload: UpdateAccountPasswordRequest,
  ): Promise<UpdateAccountPasswordResult> => {
    setUpdatingPasswordAccountId(accountId);

    try {
      await accountApi.updateAccountPassword(accountId, payload);
      return {
        success: true,
        message: "Account password updated successfully.",
      };
    } catch (error) {
      const axiosError = error as AxiosError<ValidationErrorResponse | ApiErrorResponse>;
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
          "Unable to update account password. Please try again.",
      };
    } finally {
      setUpdatingPasswordAccountId(null);
    }
  };

  return {
    createAccount,
    updateAccountInfo,
    updateAccountPassword,
    isCreating,
    updatingInfoAccountId,
    updatingPasswordAccountId,
  };
};
