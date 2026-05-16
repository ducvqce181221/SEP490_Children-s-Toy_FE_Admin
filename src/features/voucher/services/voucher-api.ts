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
    return axiosClient.get<PaginatedVouchers>("/vouchers", {
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
    axiosClient.get<Voucher>(`/vouchers/${id}`),

  createVoucher: (data: VoucherFormData) => 
    axiosClient.post<Voucher, VoucherFormData>("/vouchers", data),

  updateVoucher: (id: number, data: Partial<VoucherFormData & { isDeleted: boolean, reason?: string | null }>) =>
    axiosClient.put<Voucher, Partial<VoucherFormData & { isDeleted: boolean, reason?: string | null }>>(`/vouchers/${id}`, data),
};
