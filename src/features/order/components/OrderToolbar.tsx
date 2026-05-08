"use client";

import React from "react";
import SearchInput from "@/components/common/SearchInput";
import DatePicker from "@/components/form/date-picker";
import {
  ORDER_STATUS_ID,
  ORDER_STATUS_LABEL,
  ROLE_DEFAULT_STATUS_IDS,
  ROLE_NAME,
} from "../types/order";

interface OrderToolbarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  statusId: number | "";
  onStatusChange: (value: number | "") => void;
  assignedToMe: boolean;
  onAssignedToMeChange: (value: boolean) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  roleName?: string;
  defaultStatusIds?: number[];
  totalCount?: number;
}

const selectClassName =
  "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const ALL_STATUS_OPTIONS = [
  { value: ORDER_STATUS_ID.PENDING, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.PENDING] },
  { value: ORDER_STATUS_ID.CONFIRMED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.CONFIRMED] },
  { value: ORDER_STATUS_ID.PROCESSING, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.PROCESSING] },
  { value: ORDER_STATUS_ID.SHIPPED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.SHIPPED] },
  { value: ORDER_STATUS_ID.DELIVERING, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.DELIVERING] },
  { value: ORDER_STATUS_ID.DELIVERED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.DELIVERED] },
  { value: ORDER_STATUS_ID.COMPLETED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.COMPLETED] },
  { value: ORDER_STATUS_ID.CANCELLED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.CANCELLED] },
];

function getRoleBadge(roleName: string) {
  switch (roleName) {
    case ROLE_NAME.ADMIN:
      return { label: "Admin", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" };
    case ROLE_NAME.STAFF:
      return { label: "Staff", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
    case ROLE_NAME.MERCHANDISE:
      return { label: "Merchandise", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" };
    default:
      return null;
  }
}

const OrderToolbar: React.FC<OrderToolbarProps> = ({
  keyword,
  onKeywordChange,
  statusId,
  onStatusChange,
  assignedToMe,
  onAssignedToMeChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  roleName = "",
  defaultStatusIds = [],
  totalCount,
}) => {
  const handleFromDateChange = React.useCallback(
    ([date]: Date[]) => {
      if (date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        onFromDateChange(`${y}-${m}-${d}`);
      } else {
        onFromDateChange("");
      }
    },
    [onFromDateChange]
  );

  const handleToDateChange = React.useCallback(
    ([date]: Date[]) => {
      if (date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        onToDateChange(`${y}-${m}-${d}`);
      } else {
        onToDateChange("");
      }
    },
    [onToDateChange]
  );

  const roleBadge = getRoleBadge(roleName);
  const isAdmin = roleName === ROLE_NAME.ADMIN;

  // Tên của preset mặc định theo role (hiển thị trong option "—")
  const defaultLabel = defaultStatusIds.length > 0
    ? `Mặc định (${defaultStatusIds.map((id) => ORDER_STATUS_LABEL[id]).join(", ")})`
    : "Tất cả trạng thái";

  const statusOptions = isAdmin
    ? [
        { value: "", label: "Mặc định (Tất cả)" },
        ...ALL_STATUS_OPTIONS,
      ]
    : [
        { value: "", label: defaultLabel },
        ...ALL_STATUS_OPTIONS,
      ];

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Quản lý Đơn hàng
            </h3>
            {roleBadge && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge.className}`}>
                {roleBadge.label}
              </span>
            )}
            {typeof totalCount === "number" && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {totalCount.toLocaleString("vi-VN")} đơn
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {roleName === ROLE_NAME.STAFF && "Xem và xác nhận đơn đang chờ xử lý."}
            {roleName === ROLE_NAME.MERCHANDISE && "Chuẩn bị và tạo vận đơn cho các đơn đã xác nhận."}
            {roleName === ROLE_NAME.ADMIN && "Toàn quyền xem, phân công và thao tác trên mọi đơn hàng."}
            {!roleName && "Theo dõi, xử lý và cập nhật trạng thái đơn hàng."}
          </p>
        </div>

        {/* "Đơn của tôi" toggle — first-class trên mobile */}
        <label className="flex shrink-0 cursor-pointer select-none items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-700 dark:hover:bg-brand-900/20">
          <input
            type="checkbox"
            className="rounded-sm border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
            checked={assignedToMe}
            onChange={(e) => onAssignedToMeChange(e.target.checked)}
          />
          <span className={assignedToMe ? "font-medium text-brand-600 dark:text-brand-400" : ""}>
            Đơn của tôi
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Search */}
        <div className="lg:col-span-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tìm kiếm
          </label>
          <SearchInput
            value={keyword}
            onChange={onKeywordChange}
            placeholder="Mã ĐH, tên KH, số điện thoại..."
          />
        </div>

        {/* Filters */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Status */}
            <div className="flex flex-col">
              <label
                htmlFor="order-status"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Trạng thái
              </label>
              <select
                id="order-status"
                className={`${selectClassName} w-full`}
                value={statusId}
                onChange={(e) =>
                  onStatusChange(e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* From date */}
            <div className="flex flex-col">
              <DatePicker
                id="from-date"
                label="Từ ngày"
                placeholder="YYYY-MM-DD"
                defaultDate={fromDate || undefined}
                onChange={handleFromDateChange}
              />
            </div>

            {/* To date */}
            <div className="flex flex-col">
              <DatePicker
                id="to-date"
                label="Đến ngày"
                placeholder="YYYY-MM-DD"
                defaultDate={toDate || undefined}
                onChange={handleToDateChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderToolbar;
