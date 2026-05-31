import axiosClient from "@/configs/axios-client";
import { Refund, RefundFilter, RefundPaginatedResponse } from "../types/refund";
import { UpdateRefundStatusData } from "../types/refund.schema";

const BASE_URL = "/admin/refunds";

export const refundApi = {
  // Lấy danh sách refund (Admin)
  getAll: async (query: RefundFilter) => {
    const res = await axiosClient.get<{ data: RefundPaginatedResponse }>(BASE_URL, {
      params: query,
    });
    // Backend returns Ok(ApiResponse<PaginatedResponse<RefundListDto>>.Ok(result))
    return res.data;
  },

  // Lấy chi tiết refund
  getById: (id: number) => {
    return axiosClient.get<Refund>(`${BASE_URL}/${id}`);
  },

  // Cập nhật trạng thái
  updateStatus: (id: number, data: UpdateRefundStatusData) => {
    return axiosClient.patch<Refund>(`${BASE_URL}/${id}/status`, data);
  },

  // Phân công lại
  reassign: (id: number, data: { roleId: number; newScheduleId: number; notes?: string }) => {
    return axiosClient.post<void>(`${BASE_URL}/${id}/reassign`, data);
  },
};
