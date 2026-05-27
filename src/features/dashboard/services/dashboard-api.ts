import axiosClient from "@/configs/axios-client";
import {
  DashboardGrowthStatistics,
  DashboardNewCustomerStatistics,
  DashboardOrderStatusStatistics,
  DashboardTimeFilter,
  DashboardTotalProducts,
} from "../types/dashboard";

const toParams = (filter: DashboardTimeFilter): Record<string, number | string> => {
  const params: Record<string, number | string> = {
    period: filter.period,
  };

  if (filter.groupBy) {
    params.groupBy = filter.groupBy;
  }

  return params;
};

export const dashboardApi = {
  getOrderStatusStatistics: (
    filter: DashboardTimeFilter,
  ): Promise<DashboardOrderStatusStatistics> =>
    axiosClient.get<DashboardOrderStatusStatistics>("/admin/dashboard/orders-by-status", {
      params: toParams(filter),
    }),

  getNewCustomerStatistics: (
    filter: DashboardTimeFilter,
  ): Promise<DashboardNewCustomerStatistics> =>
    axiosClient.get<DashboardNewCustomerStatistics>("/admin/dashboard/new-customers", {
      params: toParams(filter),
    }),

  getGrowthStatistics: (filter: DashboardTimeFilter): Promise<DashboardGrowthStatistics> =>
    axiosClient.get<DashboardGrowthStatistics>("/admin/dashboard/growth", {
      params: toParams(filter),
    }),

  getTotalProducts: (): Promise<DashboardTotalProducts> =>
    axiosClient.get<DashboardTotalProducts>("/admin/dashboard/products/total-count"),
};
