import { AxiosError } from "axios";
import { useState } from "react";
import { accountApi } from "../services/account-api";
import {
  AccountDetail,
  ApiErrorResponse,
  CreateAccountRequest,
  CreateAccountResult,
  MutationResult,
  ValidationErrorResponse,
} from "../types/account";

interface UpdateAccountStatusResult extends MutationResult {
  data?: AccountDetail;
}

export const useAccountMutations = (onSuccess?: () => void) => {
  const [isCreating, setIsCreating] = useState(false);
  const [updatingAccountId, setUpdatingAccountId] = useState<number | null>(null);

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

  const updateAccountStatus = async (
    accountId: number,
    isActive: boolean,
  ): Promise<UpdateAccountStatusResult> => {
    setUpdatingAccountId(accountId);

    try {
      const updatedAccount = await accountApi.updateAccountStatus(accountId, {
        isActive,
      });
      onSuccess?.();

      return {
        success: true,
        message: isActive
          ? "Account activated successfully."
          : "Account deactivated successfully.",
        data: updatedAccount,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      return {
        success: false,
        message:
          axiosError.response?.data?.message ??
          "Unable to update account status. Please try again.",
      };
    } finally {
      setUpdatingAccountId(null);
    }
  };

  return {
    createAccount,
    updateAccountStatus,
    isCreating,
    updatingAccountId,
  };
};
