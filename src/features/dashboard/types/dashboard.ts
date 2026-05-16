export const DASHBOARD_PERIOD = {
  TODAY: "today",
  CURRENT_WEEK: "current_week",
  PREVIOUS_WEEK: "previous_week",
  CURRENT_MONTH: "current_month",
  PREVIOUS_MONTH: "previous_month",
  CURRENT_QUARTER: "current_quarter",
  PREVIOUS_QUARTER: "previous_quarter",
} as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIOD)[keyof typeof DASHBOARD_PERIOD];

export interface DashboardTimeRange {
  period: string;
  groupBy: string;
  fromDate: string;
  toDate: string;
}

export interface DashboardTimeFilter {
  period: DashboardPeriod;
  groupBy?: "day" | "week" | "month";
}

export interface DashboardRevenueChartPoint {
  label: string;
  value: number;
  date: string;
}

export interface DashboardRevenueStatistics {
  range: DashboardTimeRange;
  totalRevenue: number;
  previousPeriodRevenue: number;
  growthPercentage: number;
  details: DashboardRevenueChartPoint[];
}

export interface DashboardOrderStatusItem {
  status: string;
  value: number;
  percentage: number;
}

export interface DashboardOrderStatusTimelinePoint {
  label: string;
  date: string;
  status: string;
  value: number;
}

export interface DashboardOrderStatusStatistics {
  range: DashboardTimeRange;
  totalOrders: number;
  statuses: DashboardOrderStatusItem[];
  details: DashboardOrderStatusTimelinePoint[];
}

export interface DashboardCountChartPoint {
  label: string;
  date: string;
  value: number;
}

export interface DashboardNewCustomerStatistics {
  range: DashboardTimeRange;
  totalNewCustomers: number;
  previousPeriodNewCustomers: number;
  growthPercentage: number;
  details: DashboardCountChartPoint[];
}

export interface DashboardCompletedOrderStatistics {
  range: DashboardTimeRange;
  totalCompletedOrders: number;
  previousPeriodCompletedOrders: number;
  growthPercentage: number;
  details: DashboardCountChartPoint[];
}

export interface DashboardGrowthStatistics {
  range: DashboardTimeRange;
  revenueCurrent: number;
  revenuePrevious: number;
  revenueGrowthPercentage: number;
  ordersCurrent: number;
  ordersPrevious: number;
  ordersGrowthPercentage: number;
}

export interface DashboardOrderRateStatistics {
  range: DashboardTimeRange;
  totalOrders: number;
  refundedOrders: number;
  cancelledOrders: number;
  refundRatePercentage: number;
  cancellationRatePercentage: number;
}
