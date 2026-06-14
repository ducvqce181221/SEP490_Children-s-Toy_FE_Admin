"use client";

import React from "react";
import SearchInput from "@/components/common/SearchInput";
import DatePicker from "@/components/form/date-picker";

const selectClassName =
  "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

interface WithdrawalToolbarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  onSearchSubmit: () => void;
  status: string;
  onStatusChange: (value: string) => void;
  dateFrom: string;
  onFromDateChange: (value: string) => void;
  dateTo: string;
  onToDateChange: (value: string) => void;
  clearFilters: () => void;
  totalCount?: number;
}

const WithdrawalToolbar: React.FC<WithdrawalToolbarProps> = ({
  keyword,
  onKeywordChange,
  onSearchSubmit,
  status,
  onStatusChange,
  dateFrom,
  onFromDateChange,
  dateTo,
  onToDateChange,
  clearFilters,
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

  const hasAnyFilter = !!keyword || !!status || !!dateFrom || !!dateTo;

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Withdrawal History
            </h3>
            {typeof totalCount === "number" && (
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                {totalCount.toLocaleString("en-US")} requests
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and audit withdrawal requests and payment history details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Keyword Search */}
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
            placeholder="Search request code, customer... (Enter)"
          />
        </div>

        {/* Filters Grid */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-end">
            <div className="flex flex-col">
              <label
                htmlFor="withdrawal-status"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Status
              </label>
              <select
                id="withdrawal-status"
                className={`${selectClassName} w-full`}
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="flex flex-col">
              <DatePicker
                id="from-date"
                label="From Date"
                placeholder="YYYY-MM-DD"
                defaultDate={dateFrom || undefined}
                onChange={handleFromDateChange}
              />
            </div>

            <div className="flex flex-col">
              <DatePicker
                id="to-date"
                label="To Date"
                placeholder="YYYY-MM-DD"
                defaultDate={dateTo || undefined}
                onChange={handleToDateChange}
              />
            </div>

            <div className="flex">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasAnyFilter}
                className={`h-11 w-full text-sm font-medium border rounded-lg transition-colors ${
                  hasAnyFilter
                    ? "text-brand-500 border-brand-300 hover:bg-brand-50/50 dark:text-brand-400 dark:border-brand-800 dark:hover:bg-brand-500/10 cursor-pointer"
                    : "text-gray-400 border-gray-200 dark:text-gray-600 dark:border-gray-800 cursor-not-allowed"
                }`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalToolbar;
