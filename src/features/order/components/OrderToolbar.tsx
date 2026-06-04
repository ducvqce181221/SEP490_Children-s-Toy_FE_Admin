"use client";

import React from "react";
import SearchInput from "@/components/common/SearchInput";
import DatePicker from "@/components/form/date-picker";
import {
  ORDER_STATUS_ID,
  ORDER_STATUS_LABEL,
  ORDER_WORK_TAB,
  ORDER_WORK_TAB_LABEL,
  OrderWorkTab,
  ROLE_NAME,
} from "../types/order";

const selectClassName =
  "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const NORMAL_FLOW_OPTIONS = [
  { value: ORDER_STATUS_ID.PENDING, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.PENDING] },
  { value: ORDER_STATUS_ID.CONFIRMED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.CONFIRMED] },
  { value: ORDER_STATUS_ID.PROCESSING, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.PROCESSING] },
  { value: ORDER_STATUS_ID.SHIPPED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.SHIPPED] },
  { value: ORDER_STATUS_ID.DELIVERING, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.DELIVERING] },
  { value: ORDER_STATUS_ID.DELIVERED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.DELIVERED] },
  { value: ORDER_STATUS_ID.COMPLETED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.COMPLETED] },
];

const RETURN_FLOW_OPTIONS = [
  { value: ORDER_STATUS_ID.RETURNING, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.RETURNING] },
  { value: ORDER_STATUS_ID.RETURN_COMPLETED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.RETURN_COMPLETED] },
  { value: ORDER_STATUS_ID.DELIVERY_FAILED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.DELIVERY_FAILED] },
  { value: ORDER_STATUS_ID.WAITING_RETURN, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.WAITING_RETURN] },
  { value: ORDER_STATUS_ID.RETURN_FAILED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.RETURN_FAILED] },
  { value: ORDER_STATUS_ID.LOST, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.LOST] },
  { value: ORDER_STATUS_ID.DAMAGED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.DAMAGED] },
];

const TERMINAL_OPTIONS = [
  { value: ORDER_STATUS_ID.CANCELLED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.CANCELLED] },
  { value: ORDER_STATUS_ID.REFUNDED, label: ORDER_STATUS_LABEL[ORDER_STATUS_ID.REFUNDED] },
];

interface OrderToolbarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  onSearchSubmit: () => void;
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
  workTab?: OrderWorkTab;
  onWorkTabChange?: (tab: OrderWorkTab) => void;
}

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
  onSearchSubmit,
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
  workTab = ORDER_WORK_TAB.IN_PROGRESS,
  onWorkTabChange,
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
  const showWorkTabs =
    (roleName === ROLE_NAME.STAFF || roleName === ROLE_NAME.MERCHANDISE) &&
    !!onWorkTabChange;

  const defaultLabel =
    defaultStatusIds.length > 0
      ? `Default (${defaultStatusIds.map((id) => ORDER_STATUS_LABEL[id]).join(", ")})`
      : "All Statuses";

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Order Management
            </h3>
            {roleBadge && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge.className}`}>
                {roleBadge.label}
              </span>
            )}
            {typeof totalCount === "number" && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {totalCount.toLocaleString("en-US")} orders
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {roleName === ROLE_NAME.STAFF &&
              (workTab === ORDER_WORK_TAB.COMPLETED
                ? "Orders you handled in this shift — view only, no actions."
                : "Orders assigned to you this shift — confirm and track.")}
            {roleName === ROLE_NAME.MERCHANDISE &&
              (workTab === ORDER_WORK_TAB.COMPLETED
                ? "Orders you handled in this shift — view only, no actions."
                : "Orders assigned to you this shift — prepare and create waybills.")}
            {roleName === ROLE_NAME.ADMIN && "Full access to view, assign, and manage all orders."}
            {!roleName && "Track, process, and update order statuses."}
          </p>
        </div>
      </div>

      {showWorkTabs && (
        <div className="mb-5 inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
          {(Object.values(ORDER_WORK_TAB) as OrderWorkTab[]).map((tab) => {
            const isActive = workTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onWorkTabChange(tab)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-500 text-white shadow-theme-xs"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                {ORDER_WORK_TAB_LABEL[tab]}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Search
          </label>
          <SearchInput
            value={keyword}
            onChange={onKeywordChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearchSubmit();
              }
            }}
            placeholder="Order ID, Customer, Phone...(Press Enter)"
          />
        </div>

        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col">
              <label
                htmlFor="order-status"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Status
              </label>
              <select
                id="order-status"
                className={`${selectClassName} w-full`}
                value={statusId}
                onChange={(e) =>
                  onStatusChange(e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                <option value="">
                  {isAdmin ? "Default (All)" : defaultLabel}
                </option>
                <optgroup label="── Normal Flow ──">
                  {NORMAL_FLOW_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── Return & Issue Flow ──">
                  {RETURN_FLOW_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── Terminal ──">
                  {TERMINAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="flex flex-col">
              <DatePicker
                id="from-date"
                label="From Date"
                placeholder="YYYY-MM-DD"
                defaultDate={fromDate || undefined}
                onChange={handleFromDateChange}
              />
            </div>

            <div className="flex flex-col">
              <DatePicker
                id="to-date"
                label="To Date"
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
