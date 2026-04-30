import axiosClient from "@/configs/axios-client";
import {
  BrandFormRequest,
  BrandListItem,
  BrandQueryParams,
  PaginatedResponse,
} from "../types/brand";

export const brandApi = {
  getBrands: async (
    params: BrandQueryParams,
  ): Promise<PaginatedResponse<BrandListItem>> => {
    return axiosClient.get<PaginatedResponse<BrandListItem>>("/brands", {
      params,
    });
  },

  createBrand: async (payload: BrandFormRequest): Promise<BrandListItem> => {
    return axiosClient.post<BrandListItem, BrandFormRequest>("/brands", payload);
  },

  updateBrand: async (
    brandId: number,
    payload: BrandFormRequest,
  ): Promise<BrandListItem> => {
    return axiosClient.put<BrandListItem, BrandFormRequest>(
      `/brands/${brandId}`,
      payload,
    );
  },
};
