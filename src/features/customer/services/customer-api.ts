import axiosClient from "@/configs/axios-client";
import {
  CustomerDetail,
  CustomerListItem,
  CustomerQueryParams,
  ManualBlockCustomerRequest,
  PaginatedResponse,
  UpdateCustomerRequest,
} from "../types/customer";

export const customerApi = {
  getCustomers: async (
    params: CustomerQueryParams,
  ): Promise<PaginatedResponse<CustomerListItem>> => {
    return axiosClient.get<PaginatedResponse<CustomerListItem>>("/customers", {
      params,
    });
  },

  getCustomerById: async (accountId: number): Promise<CustomerDetail> => {
    return axiosClient.get<CustomerDetail>(`/customers/${accountId}`);
  },

  updateCustomer: async (
    accountId: number,
    payload: UpdateCustomerRequest,
  ): Promise<CustomerDetail> => {
    return axiosClient.put<CustomerDetail, UpdateCustomerRequest>(
      `/customers/${accountId}`,
      payload,
    );
  },

  blockCustomerForDeliveryAbuse: async (
    accountId: number,
    payload: ManualBlockCustomerRequest,
  ): Promise<CustomerDetail> => {
    return axiosClient.post<CustomerDetail, ManualBlockCustomerRequest>(
      `/customers/${accountId}/delivery-abuse/block`,
      payload,
    );
  },
};
