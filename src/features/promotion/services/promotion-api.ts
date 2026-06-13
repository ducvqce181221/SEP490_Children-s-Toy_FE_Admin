import axiosClient from "@/configs/axios-client";
import {
  Promotion,
  PromotionFormData,
  PromotionListDto,
  PaginatedResponse,
  ProductPromotionInfoDto,
} from "../types/promotion";

export interface GetPromotionsParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDesc?: boolean;
  searchTerm?: string;
  status?: string;
}

export const promotionApi = {
  getAll: (params?: GetPromotionsParams) =>
    axiosClient.get<PaginatedResponse<PromotionListDto>>("/promotions", { params }),

  getById: (id: number) => axiosClient.get<Promotion>(`/promotions/${id}`),

  create: (data: PromotionFormData) =>
    axiosClient.post<Promotion>("/promotions", data),

  update: (id: number, data: Partial<PromotionFormData & { isDeleted?: boolean }>) =>
    axiosClient.put<Promotion>(`/promotions/${id}`, data),

  delete: (id: number) =>
    axiosClient.put(`/promotions/${id}`, { isDeleted: true }),

  getPromotionsByProductId: (productId: number) =>
    axiosClient.get<ProductPromotionInfoDto[]>(`/promotions/product/${productId}`),
};
