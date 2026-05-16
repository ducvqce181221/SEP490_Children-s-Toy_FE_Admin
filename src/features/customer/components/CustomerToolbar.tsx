import React from "react";
import SearchInput from "@/components/common/SearchInput";
import { CustomerSortBy } from "../types/customer";

interface CustomerToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: CustomerSortBy;
  onSortByChange: (value: CustomerSortBy) => void;
  sortDesc: boolean;
  onSortDirectionChange: (value: boolean) => void;
}

const sortOptions: Array<{ value: CustomerSortBy; label: string }> = [
  { value: "createdat", label: "Created Date" },
  { value: "accountname", label: "Customer Name" },
  { value: "email", label: "Email" },
  { value: "isactive", label: "Status" },
];

const directionOptions = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
] as const;

const selectClassName =
  "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const CustomerToolbar: React.FC<CustomerToolbarProps> = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortDesc,
  onSortDirectionChange,
}) => {
  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="mb-5 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Customer List
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage customer accounts where role is Customer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p
            className="mb-1 block text-sm font-medium text-transparent select-none"
            aria-hidden="true"
          >
            Search
          </p>
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by customer name, email, or phone number"
          />
        </div>

        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:justify-end">
            <div>
              <label
                htmlFor="customer-sort-field"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Sort by
              </label>
              <select
                id="customer-sort-field"
                className={`${selectClassName} w-full sm:w-44`}
                value={sortBy}
                onChange={(event) =>
                  onSortByChange(event.target.value as CustomerSortBy)
                }
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="customer-sort-direction"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Direction
              </label>
              <select
                id="customer-sort-direction"
                className={`${selectClassName} w-full sm:w-40`}
                value={sortDesc ? "desc" : "asc"}
                onChange={(event) =>
                  onSortDirectionChange(event.target.value === "desc")
                }
              >
                {directionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerToolbar;
