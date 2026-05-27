import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../services/dashboard-api";
import {
  DASHBOARD_PERIOD,
  DashboardGrowthStatistics,
  DashboardNewCustomerStatistics,
  DashboardOrderStatusStatistics,
  DashboardPeriod,
  DashboardTimeFilter,
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

  const [orderStatus, setOrderStatus] = useState<DashboardOrderStatusStatistics | null>(null);
  const [newCustomers, setNewCustomers] = useState<DashboardNewCustomerStatistics | null>(null);
  const [growthStatistics, setGrowthStatistics] = useState<DashboardGrowthStatistics | null>(null);
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
        orderStatusData,
        newCustomersData,
        growthStatisticsData,
        totalProductsData,
      ] = await Promise.all([
        dashboardApi.getOrderStatusStatistics(filter),
        dashboardApi.getNewCustomerStatistics(filter),
        dashboardApi.getGrowthStatistics(filter),
        dashboardApi.getTotalProducts(),
      ]);

      setOrderStatus(orderStatusData);
      setNewCustomers(newCustomersData);
      setGrowthStatistics(growthStatisticsData);
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
    orderStatus,
    newCustomers,
    growthStatistics,
    totalProducts,
    setPeriod,
    reload: loadData,
  };
};
