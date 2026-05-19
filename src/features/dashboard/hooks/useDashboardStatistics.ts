import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../services/dashboard-api";
import {
  DASHBOARD_PERIOD,
  DashboardCompletedOrderStatistics,
  DashboardNewCustomerStatistics,
  DashboardOrderRateStatistics,
  DashboardOrderStatusStatistics,
  DashboardPeriod,
  DashboardRevenueStatistics,
  DashboardSlowMovingProducts,
  DashboardTimeFilter,
  DashboardTopSellingProducts,
  DashboardTotalProducts,
} from "../types/dashboard";

type DashboardApiError = {
  message?: string;
};

const buildFilter = (
  period: DashboardPeriod,
): DashboardTimeFilter => {
  return { period };
};

export const useDashboardStatistics = () => {
  const [period, setPeriod] = useState<DashboardPeriod>(DASHBOARD_PERIOD.CURRENT_MONTH);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revenue, setRevenue] = useState<DashboardRevenueStatistics | null>(null);
  const [orderStatus, setOrderStatus] = useState<DashboardOrderStatusStatistics | null>(null);
  const [newCustomers, setNewCustomers] = useState<DashboardNewCustomerStatistics | null>(null);
  const [completedOrders, setCompletedOrders] = useState<DashboardCompletedOrderStatistics | null>(null);
  const [orderRates, setOrderRates] = useState<DashboardOrderRateStatistics | null>(null);
  const [top5BestSellers, setTop5BestSellers] = useState<DashboardTopSellingProducts | null>(null);
  const [slowMovingProducts, setSlowMovingProducts] = useState<DashboardSlowMovingProducts | null>(null);
  const [totalProducts, setTotalProducts] = useState<DashboardTotalProducts | null>(null);

  const filter = useMemo(
    () => buildFilter(period),
    [period],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        revenueData,
        orderStatusData,
        newCustomersData,
        completedOrdersData,
        orderRatesData,
        top5Data,
        slowMovingData,
        totalProductsData,
      ] = await Promise.all([
        dashboardApi.getRevenueStatistics(filter),
        dashboardApi.getOrderStatusStatistics(filter),
        dashboardApi.getNewCustomerStatistics(filter),
        dashboardApi.getCompletedOrderStatistics(filter),
        dashboardApi.getOrderRateStatistics(filter),
        dashboardApi.getTop5BestSellers(),
        dashboardApi.getSlowMovingProducts(5),
        dashboardApi.getTotalProducts(),
      ]);

      setRevenue(revenueData);
      setOrderStatus(orderStatusData);
      setNewCustomers(newCustomersData);
      setCompletedOrders(completedOrdersData);
      setOrderRates(orderRatesData);
      setTop5BestSellers(top5Data);
      setSlowMovingProducts(slowMovingData);
      setTotalProducts(totalProductsData);
    } catch (err) {
      const axiosError = err as AxiosError<DashboardApiError>;
      setError(
        axiosError.response?.data?.message ??
          "Unable to load dashboard analytics. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (cancelled) {
        return;
      }
      await loadData();
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  return {
    period,
    isLoading,
    error,
    revenue,
    orderStatus,
    newCustomers,
    completedOrders,
    orderRates,
    top5BestSellers,
    slowMovingProducts,
    totalProducts,
    setPeriod,
    reload: loadData,
  };
};
