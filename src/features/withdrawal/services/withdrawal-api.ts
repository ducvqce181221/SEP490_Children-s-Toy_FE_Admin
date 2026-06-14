import axiosClient from "@/configs/axios-client";
import {
  AdminWithdrawalDetail,
  AdminWithdrawalListItem,
  AdminWithdrawalQueryParams,
  PaginatedResponse,
} from "../types/withdrawal";

export const withdrawalApi = {
  getWithdrawals: async (
    params: AdminWithdrawalQueryParams,
  ): Promise<PaginatedResponse<AdminWithdrawalListItem>> => {
    return axiosClient.get<PaginatedResponse<AdminWithdrawalListItem>>("/admin/withdrawals", {
      params,
    });
  },

  getWithdrawalById: async (id: number): Promise<AdminWithdrawalDetail> => {
    return axiosClient.get<AdminWithdrawalDetail>(`/admin/withdrawals/${id}`);
  },
};
