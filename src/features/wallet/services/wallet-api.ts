import axiosClient from "@/configs/axios-client";
import {
  PaginatedResponse,
  UpdateWalletStatusRequest,
  WalletListItem,
  WalletQueryParams,
} from "../types/wallet";

const BASE_URL = "/admin/wallets";

export const walletApi = {
  getWallets: async (
    params: WalletQueryParams,
  ): Promise<PaginatedResponse<WalletListItem>> => {
    return axiosClient.get<PaginatedResponse<WalletListItem>>(BASE_URL, { params });
  },

  updateWalletStatus: async (
    walletId: number,
    payload: UpdateWalletStatusRequest,
  ): Promise<WalletListItem> => {
    return axiosClient.patch<WalletListItem, UpdateWalletStatusRequest>(
      `${BASE_URL}/${walletId}/status`,
      payload,
    );
  },
};
