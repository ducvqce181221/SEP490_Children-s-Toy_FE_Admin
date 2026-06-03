import React, { useState } from "react";
import SearchInput from "@/components/common/SearchInput";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { WalletStatus } from "../types/wallet";

interface WalletToolbarProps {
  accountSearch: string;
  onAccountSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  statusFilter: WalletStatus | "";
  onStatusFilterChange: (value: WalletStatus | "") => void;
}

const FilterIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2.5 5.83333H17.5M5 10H15M8.33333 14.1667H11.6667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WalletToolbar: React.FC<WalletToolbarProps> = ({
  accountSearch,
  onAccountSearchChange,
  onSearchSubmit,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localStatusFilter, setLocalStatusFilter] = useState<WalletStatus | "">(statusFilter);
  const [prevStatusFilter, setPrevStatusFilter] = useState(statusFilter);

  if (prevStatusFilter !== statusFilter) {
    setPrevStatusFilter(statusFilter);
    setLocalStatusFilter(statusFilter);
  }

  const handleSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSearchSubmit();
    }
  };

  const clearFilters = () => {
    setLocalStatusFilter("");
    onStatusFilterChange("");
    setIsFilterOpen(false);
  };

  const applyFilters = () => {
    onStatusFilterChange(localStatusFilter);
    setIsFilterOpen(false);
  };

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Wallet List</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage customer wallet activation.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xl">
          <p className="mb-1 block text-sm font-medium text-transparent select-none" aria-hidden="true">
            Search
          </p>
          <SearchInput
            value={accountSearch}
            onChange={onAccountSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by account name, email, or phone"
          />
        </div>

        <div className="relative">
          <Button
            variant="outline"
            startIcon={<FilterIcon />}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="dropdown-toggle"
          >
            Filter
            {statusFilter && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                !
              </span>
            )}
          </Button>

          <Dropdown
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            className="right-0 w-[300px] p-4"
          >
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Filter Wallets</h4>

              <div>
                <Label>Status</Label>
                <Select
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "Active", label: "Active" },
                    { value: "Frozen", label: "Frozen" },
                  ]}
                  onChange={(event) =>
                    setLocalStatusFilter((event.target.value as WalletStatus | "") ?? "")
                  }
                  value={localStatusFilter}
                />
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
                <Button variant="primary" size="sm" onClick={applyFilters}>
                  Apply
                </Button>
              </div>
            </div>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default WalletToolbar;
