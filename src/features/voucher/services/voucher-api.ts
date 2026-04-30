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
    return axiosClient.get<unknown, PaginatedVouchers>("/vouchers", {
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
    axiosClient.get<unknown, Voucher>(`/vouchers/${id}`),

  createVoucher: (data: VoucherFormData) => 
    axiosClient.post<unknown, Voucher>("/vouchers", data),

  updateVoucher: (id: number, data: Partial<VoucherFormData & { isDeleted: boolean }>) =>
    axiosClient.put<unknown, Voucher>(`/vouchers/${id}`, data),
};
