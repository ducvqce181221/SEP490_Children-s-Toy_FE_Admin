import axiosClient from "@/configs/axios-client";
import { ReviewDetail, ReviewPaginatedResponse, ReviewQuery } from "../types/review";
import { ReviewReplyData, UpdateReviewStatusData } from "../types/review.schema";

const BASE_URL = "/admin/reviews";

export const reviewApi = {
  // Lấy danh sách reviews
  getAll: (query: ReviewQuery) => {
    return axiosClient.get<unknown, ReviewPaginatedResponse>(BASE_URL, {
      params: query,
    });
  },

  // Lấy chi tiết review
  getById: (id: number) => {
    return axiosClient.get<unknown, ReviewDetail>(`${BASE_URL}/${id}`);
  },

  // Cập nhật trạng thái
  updateStatus: (id: number, data: UpdateReviewStatusData) => {
    return axiosClient.put<unknown, ReviewDetail>(`${BASE_URL}/${id}/status`, data);
  },

  // Thêm phản hồi
  createReply: (id: number, data: ReviewReplyData) => {
    return axiosClient.post<unknown, unknown>(`${BASE_URL}/${id}/reply`, data);
  },

  // Sửa phản hồi
  updateReply: (id: number, replyProductId: number, data: ReviewReplyData) => {
    return axiosClient.put<unknown, unknown>(`${BASE_URL}/${id}/reply/${replyProductId}`, data);
  },

  // Xóa phản hồi
  deleteReply: (id: number, replyProductId: number) => {
    return axiosClient.delete<unknown, unknown>(`${BASE_URL}/${id}/reply/${replyProductId}`);
  },
};
