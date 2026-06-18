"use client";

import React from "react";
import SearchInput from "@/components/common/SearchInput";
import DatePicker from "@/components/form/date-picker";
import { RefundStatusType, REFUND_WORK_TAB, REFUND_WORK_TAB_LABEL, RefundWorkTab } from "../types/refund";

interface RefundToolbarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  onSearchSubmit: () => void;
  refundStatus: RefundStatusType | "";
  onStatusChange: (value: RefundStatusType | "") => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  roleName?: string;
  totalCount?: number;
  workTab?: RefundWorkTab;
  onWorkTabChange?: (tab: RefundWorkTab) => void;
}

const selectClassName =
  "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const ROLE_NAME = {
  ADMIN: "Admin",
  STAFF: "Staff",
  MERCHANDISE: "Merchandise",
};

const REFUND_STATUS_OPTIONS = [
  { value: "RefundRequested", label: "Requested" },
  { value: "RefundApproved", label: "Approved" },
  { value: "RefundPickupCreated", label: "Pickup Created" },
  { value: "RefundShipping", label: "Shipping" },
  { value: "RefundReceived", label: "Received" },
  { value: "RefundInspectionPending", label: "Inspection Pending" },
  { value: "RefundCompleted", label: "Completed" },
  { value: "RefundCancelled", label: "Cancelled" },
  { value: "RefundRejected", label: "Rejected" },
  { value: "RefundDamage", label: "Damaged" },
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

export const RefundToolbar: React.FC<RefundToolbarProps> = ({
  keyword,
  onKeywordChange,
  onSearchSubmit,
  refundStatus,
  onStatusChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  roleName = "",
  totalCount,
  workTab = REFUND_WORK_TAB.IN_PROGRESS,
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
  const showWorkTabs =
    (roleName === ROLE_NAME.STAFF || roleName === ROLE_NAME.MERCHANDISE) &&
    !!onWorkTabChange;

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Refunds Management
            </h3>
            {roleBadge && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge.className}`}>
                {roleBadge.label}
              </span>
            )}
            {typeof totalCount === "number" && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {totalCount.toLocaleString("en-US")} refunds
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {roleName === ROLE_NAME.STAFF &&
              (workTab === REFUND_WORK_TAB.COMPLETED
                ? "Refunds you handled in this shift — view only, no actions."
                : "Refunds assigned to you this shift — verify and update status.")}
            {roleName === ROLE_NAME.MERCHANDISE &&
              (workTab === REFUND_WORK_TAB.COMPLETED
                ? "Refunds you handled in this shift — view only, no actions."
                : "Refunds assigned to you this shift — verify returned toy quality and handle inspections.")}
            {roleName === ROLE_NAME.ADMIN && "Full access to view, assign, and manage all refund cases."}
            {!roleName && "Manage and track customer refund requests."}
          </p>
        </div>
      </div>

      {showWorkTabs && (
        <div className="mb-5 inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
          {(Object.values(REFUND_WORK_TAB) as RefundWorkTab[]).map((tab) => {
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
                {REFUND_WORK_TAB_LABEL[tab]}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Search */}
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

        {/* Filters */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Status */}
            <div className="flex flex-col">
              <label
                htmlFor="refund-status"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Status
              </label>
              <select
                id="refund-status"
                className={`${selectClassName} w-full`}
                value={refundStatus}
                onChange={(e) =>
                  onStatusChange(e.target.value === "" ? "" : (e.target.value as RefundStatusType))
                }
              >
                <option value="">All Statuses</option>
                {REFUND_STATUS_OPTIONS.map((opt) => (
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
                label="From Date"
                placeholder="YYYY-MM-DD"
                defaultDate={fromDate || undefined}
                onChange={handleFromDateChange}
              />
            </div>

            {/* To date */}
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
