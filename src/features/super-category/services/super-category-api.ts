import axiosClient from "@/configs/axios-client";
import { SuperCategoryFormData } from "../types/super-category.schema";
import {
  PaginatedResponse,
  SuperCategoryListItem,
  SuperCategoryQueryParams,
} from "../types/super-category";

export const superCategoryApi = {
  getSuperCategories: async (
    params: SuperCategoryQueryParams,
  ): Promise<PaginatedResponse<SuperCategoryListItem>> => {
    return axiosClient.get<PaginatedResponse<SuperCategoryListItem>>(
      "/categories/super-categories",
      {
        params,
      },
    );
  },

  getSuperCategoryById: async (
    superCategoryId: number,
  ): Promise<SuperCategoryListItem> => {
    return axiosClient.get<SuperCategoryListItem>(
      `/categories/super-categories/${superCategoryId}`,
    );
  },

  createSuperCategory: async (
    payload: SuperCategoryFormData,
  ): Promise<SuperCategoryListItem> => {
    return axiosClient.post<SuperCategoryListItem, SuperCategoryFormData>(
      "/categories/super-categories",
      payload,
    );
  },

  updateSuperCategory: async (
    superCategoryId: number,
    payload: SuperCategoryFormData,
  ): Promise<SuperCategoryListItem> => {
    return axiosClient.put<SuperCategoryListItem, SuperCategoryFormData>(
      `/categories/super-categories/${superCategoryId}`,
      payload,
    );
  },
};
