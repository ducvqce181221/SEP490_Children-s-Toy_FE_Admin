"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/utils/format-utils";
import {
  DASHBOARD_PERIOD,
  DashboardPeriod,
} from "../types/dashboard";
import { useDashboardStatistics } from "../hooks/useDashboardStatistics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: DASHBOARD_PERIOD.TODAY, label: "Today" },
  { value: DASHBOARD_PERIOD.CURRENT_WEEK, label: "Current Week" },
  { value: DASHBOARD_PERIOD.PREVIOUS_WEEK, label: "Previous Week" },
  { value: DASHBOARD_PERIOD.CURRENT_MONTH, label: "Current Month" },
  { value: DASHBOARD_PERIOD.PREVIOUS_MONTH, label: "Previous Month" },
  { value: DASHBOARD_PERIOD.CURRENT_QUARTER, label: "Current Quarter" },
  { value: DASHBOARD_PERIOD.PREVIOUS_QUARTER, label: "Previous Quarter" },
];

const numberFormatter = new Intl.NumberFormat("vi-VN");

const calcDeltaLabel = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

export function AdminDashboardView() {
  const {
    period,
    isLoading,
    error,
    revenue,
    orderStatus,
    newCustomers,
    completedOrders,
    growth,
    orderRates,
    setPeriod,
  } = useDashboardStatistics();

  const revenueOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 300,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    stroke: {
      width: 3,
      curve: "smooth",
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#16a34a"],
    xaxis: {
      categories: revenue?.details.map((item) => item.label) ?? [],
    },
    yaxis: {
      labels: {
        formatter: (value: number) => numberFormatter.format(value),
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => formatCurrency(value),
      },
    },
  };

  const revenueSeries = [
    {
      name: "Revenue",
      data: revenue?.details.map((item) => item.value) ?? [],
    },
  ];

  const statusChartItems = (orderStatus?.statuses ?? []).filter((item) => item.value > 0);
  const statusOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    labels: statusChartItems.map((item) => item.status),
    legend: {
      position: "bottom",
    },
    dataLabels: {
      formatter: (value: number) => `${value.toFixed(1)}%`,
    },
  };

  const statusSeries = statusChartItems.map((item) => item.value);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Dashboard Analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data is aggregated by the selected time range
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-xs text-gray-500 dark:text-gray-400" htmlFor="dashboard-period">
              Time Range
              <select
                id="dashboard-period"
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                value={period}
                onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-200">
          {error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="Revenue" value={formatCurrency(revenue?.totalRevenue ?? 0)} delta={revenue?.growthPercentage ?? 0} />
        <MetricCard title="New Customers" value={numberFormatter.format(newCustomers?.totalNewCustomers ?? 0)} delta={newCustomers?.growthPercentage ?? 0} />
        <MetricCard title="Completed Orders" value={numberFormatter.format(completedOrders?.totalCompletedOrders ?? 0)} delta={completedOrders?.growthPercentage ?? 0} />
        <MetricCard title="Revenue Growth" value={calcDeltaLabel(growth?.revenueGrowthPercentage ?? 0)} delta={growth?.revenueGrowthPercentage ?? 0} />
        <MetricCard title="Order Growth" value={calcDeltaLabel(growth?.ordersGrowthPercentage ?? 0)} delta={growth?.ordersGrowthPercentage ?? 0} />
        <MetricCard title="Cancel / Refund Rate" value={`${(orderRates?.cancellationRatePercentage ?? 0).toFixed(2)}% / ${(orderRates?.refundRatePercentage ?? 0).toFixed(2)}%`} delta={0} />
      </section>

      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] xl:col-span-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Revenue Over Time</h3>
          {isLoading ? (
            <div className="mt-4 h-[320px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : (
            <div className="mt-4">
              <ReactApexChart options={revenueOptions} series={revenueSeries} type="line" height={320} />
            </div>
          )}
        </div>

        <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] xl:col-span-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Orders by Status</h3>
          {isLoading ? (
            <div className="mt-4 h-[320px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : (
            <div className="mt-4">
              <ReactApexChart options={statusOptions} series={statusSeries} type="donut" height={320} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  delta: number;
};

function MetricCard({ title, value, delta }: MetricCardProps) {
  const isPositive = delta >= 0;
  const deltaLabel = calcDeltaLabel(delta);

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      <p className={`mt-2 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-500"}`}>
        {deltaLabel}
      </p>
    </article>
  );
}
