import { AxiosError } from "axios";
import { useState } from "react";
import { walletApi } from "../services/wallet-api";
import {
  ApiErrorResponse,
  UpdateWalletStatusRequest,
  WalletListItem,
} from "../types/wallet";

interface MutationResult {
  success: boolean;
  message: string;
  data?: WalletListItem;
}

export const useWalletMutations = (onSuccess?: () => void) => {
  const [updatingWalletId, setUpdatingWalletId] = useState<number | null>(null);

  const updateWalletStatus = async (
    walletId: number,
    payload: UpdateWalletStatusRequest,
  ): Promise<MutationResult> => {
    setUpdatingWalletId(walletId);

    try {
      const updatedWallet = await walletApi.updateWalletStatus(walletId, payload);
      onSuccess?.();

      return {
        success: true,
        message: "Wallet has been activated successfully.",
        data: updatedWallet,
      };
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ??
          "Unable to update wallet status. Please try again.",
      };
    } finally {
      setUpdatingWalletId(null);
    }
  };

  return {
    updateWalletStatus,
    updatingWalletId,
  };
};
