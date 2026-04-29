import axiosClient from "@/configs/axios-client";
import { Voucher, VoucherFormData, PaginatedVouchers } from "../types/voucher";

export const voucherApi = {
  getVouchers: (
    pageNumber = 1,
    pageSize = 10,
    sortBy?: string,
    sortDesc = false,
    searchTerm?: string,
    status?: string
  ) => {
    return axiosClient.get<unknown, PaginatedVouchers>("/api/vouchers", {
      params: {
        pageNumber,
        pageSize,
        ...(sortBy && { sortBy }),
        sortDesc,
        ...(searchTerm && { searchTerm }),
        ...(status && { status }),
      },
    });
  },

  getVoucherById: (id: number) => 
    axiosClient.get<unknown, Voucher>(`/api/vouchers/${id}`),

  createVoucher: (data: VoucherFormData) => 
    axiosClient.post<unknown, Voucher>("/api/vouchers", data),

  updateVoucher: (id: number, data: VoucherFormData) =>
    axiosClient.put<unknown, Voucher>(`/api/vouchers/${id}`, data),

  deleteVoucher: (id: number) => 
    axiosClient.delete<unknown, unknown>(`/api/vouchers/${id}`),
};
