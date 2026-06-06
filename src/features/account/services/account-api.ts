import axiosClient from "@/configs/axios-client";
import {
  AccountDetail,
  AccountListItem,
  AccountQueryParams,
  CreateAccountRequest,
  PaginatedResponse,
  UpdateAccountInfoRequest,
  UpdateAccountPasswordRequest,
} from "../types/account";

export const accountApi = {
  getAccounts: async (
    params: AccountQueryParams,
  ): Promise<PaginatedResponse<AccountListItem>> => {
    return axiosClient.get<PaginatedResponse<AccountListItem>>("/accounts", {
      params,
    });
  },

  getAccountById: async (accountId: number): Promise<AccountDetail> => {
    return axiosClient.get<AccountDetail>(`/accounts/${accountId}`);
  },

  createAccount: async (payload: CreateAccountRequest): Promise<AccountDetail> => {
    return axiosClient.post<AccountDetail, CreateAccountRequest>("/accounts", payload);
  },

  updateAccountInfo: async (
    accountId: number,
    payload: UpdateAccountInfoRequest,
  ): Promise<AccountDetail> => {
    return axiosClient.put<AccountDetail, UpdateAccountInfoRequest>(
      `/accounts/${accountId}`,
      payload,
    );
  },
  updateAccountPassword: async (
    accountId: number,
    payload: UpdateAccountPasswordRequest,
  ): Promise<void> => {
    return axiosClient.put<void, UpdateAccountPasswordRequest>(
      `/accounts/${accountId}/password`,
      payload,
    );
  },
};
