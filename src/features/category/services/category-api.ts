import axiosClient from "@/configs/axios-client";
import { CategoryFormData } from "../types/category.schema";
import {
  PaginatedResponse,
  CategoryListItem,
  CategoryQueryParams,
} from "../types/category";

export const categoryApi = {
  getCategories: async (
    params: CategoryQueryParams,
  ): Promise<PaginatedResponse<CategoryListItem>> => {
    return axiosClient.get<PaginatedResponse<CategoryListItem>>("/categories", {
      params,
    });
  },

  getCategoryById: async (categoryId: number): Promise<CategoryListItem> => {
    return axiosClient.get<CategoryListItem>(`/categories/${categoryId}`);
  },

  createCategory: async (
    payload: CategoryFormData,
  ): Promise<CategoryListItem> => {
    return axiosClient.post<CategoryListItem, CategoryFormData>(
      "/categories",
      payload,
    );
  },

  updateCategory: async (
    categoryId: number,
    payload: CategoryFormData,
  ): Promise<CategoryListItem> => {
    return axiosClient.put<CategoryListItem, CategoryFormData>(
      `/categories/${categoryId}`,
      payload,
    );
  },
};
