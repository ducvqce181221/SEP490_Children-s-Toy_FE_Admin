import axiosClient from "@/configs/axios-client";
import {
  AccountDetail,
  AccountListItem,
  AccountQueryParams,
  CreateAccountRequest,
  PaginatedResponse,
  UpdateAccountStatusRequest,
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
    return axiosClient.post<AccountDetail, CreateAccountRequest>(
      "/accounts",
      payload,
    );
  },

  updateAccountStatus: async (
    accountId: number,
    payload: UpdateAccountStatusRequest,
  ): Promise<AccountDetail> => {
    return axiosClient.put<AccountDetail, UpdateAccountStatusRequest>(
      `/accounts/${accountId}/status`,
      payload,
    );
  },
};
