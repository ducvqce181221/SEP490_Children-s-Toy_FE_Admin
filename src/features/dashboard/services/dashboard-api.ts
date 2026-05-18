import axiosClient from "@/configs/axios-client";
import {
  DashboardCompletedOrderStatistics,
  DashboardGrowthStatistics,
  DashboardNewCustomerStatistics,
  DashboardOrderRateStatistics,
  DashboardOrderStatusStatistics,
  DashboardRevenueStatistics,
  DashboardSlowMovingProducts,
  DashboardTimeFilter,
  DashboardTopSellingProducts,
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
  getRevenueStatistics: (filter: DashboardTimeFilter): Promise<DashboardRevenueStatistics> =>
    axiosClient.get<DashboardRevenueStatistics>("/admin/dashboard/revenue", {
      params: toParams(filter),
    }),

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

  getCompletedOrderStatistics: (
    filter: DashboardTimeFilter,
  ): Promise<DashboardCompletedOrderStatistics> =>
    axiosClient.get<DashboardCompletedOrderStatistics>("/admin/dashboard/completed-orders", {
      params: toParams(filter),
    }),

  getGrowthStatistics: (filter: DashboardTimeFilter): Promise<DashboardGrowthStatistics> =>
    axiosClient.get<DashboardGrowthStatistics>("/admin/dashboard/growth", {
      params: toParams(filter),
    }),

  getOrderRateStatistics: (
    filter: DashboardTimeFilter,
  ): Promise<DashboardOrderRateStatistics> =>
    axiosClient.get<DashboardOrderRateStatistics>("/admin/dashboard/order-rates", {
      params: toParams(filter),
    }),

  getTop5BestSellers: (): Promise<DashboardTopSellingProducts> =>
    axiosClient.get<DashboardTopSellingProducts>("/admin/dashboard/products/top-5-best-sellers"),

  getSlowMovingProducts: (limit = 10): Promise<DashboardSlowMovingProducts> =>
    axiosClient.get<DashboardSlowMovingProducts>("/admin/dashboard/products/slow-moving", {
      params: { limit },
    }),

  getTotalProducts: (): Promise<DashboardTotalProducts> =>
    axiosClient.get<DashboardTotalProducts>("/admin/dashboard/products/total-count"),
};
