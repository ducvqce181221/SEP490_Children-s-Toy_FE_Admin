import axiosClient from "@/configs/axios-client";
import { ProductFormData } from "../types/product.schema";
import {
  PaginatedResponse,
  ProductListItem,
  ProductDetail,
  ProductLookupsResponse,
  ProductQueryParams,
} from "../types/product";

export const productApi = {
  getProducts: async (
    params: ProductQueryParams,
  ): Promise<PaginatedResponse<ProductListItem>> => {
    return axiosClient.get<PaginatedResponse<ProductListItem>>("/products", {
      params,
    });
  },

  getProductById: async (productId: number): Promise<ProductDetail> => {
    return axiosClient.get<ProductDetail>(`/products/${productId}`);
  },

  getProductLookups: async (): Promise<ProductLookupsResponse> => {
    return axiosClient.get<ProductLookupsResponse>("/products/lookups");
  },

  createProduct: async (
    payload: ProductFormData,
  ): Promise<ProductDetail> => {
    return axiosClient.post<ProductDetail, ProductFormData>(
      "/products",
      payload,
    );
  },

  updateProduct: async (
    productId: number,
    payload: ProductFormData,
  ): Promise<ProductDetail> => {
    return axiosClient.put<ProductDetail, ProductFormData>(
      `/products/${productId}`,
      payload,
    );
  },
};
