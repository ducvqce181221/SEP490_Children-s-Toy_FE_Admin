import React from "react";
import SearchInput from "@/components/common/SearchInput";
import Button from "@/components/ui/button/Button";
import { WalletStatus } from "../types/wallet";

interface WalletToolbarProps {
  accountSearch: string;
  onAccountSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  statusFilter: WalletStatus | "";
  onStatusFilterChange: (value: WalletStatus | "") => void;
}

const selectClassName =
  "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const WalletToolbar: React.FC<WalletToolbarProps> = ({
  accountSearch,
  onAccountSearchChange,
  onSearchSubmit,
  statusFilter,
  onStatusFilterChange,
}) => {
  const handleSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Wallet List</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage wallet status for freeze and reactivation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="mb-1 block text-sm font-medium text-transparent select-none" aria-hidden="true">
            Search
          </p>
          <div className="flex items-center gap-2">
            <SearchInput
              value={accountSearch}
              onChange={onAccountSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by account name, email, or phone"
            />
            <Button variant="primary" onClick={onSearchSubmit}>
              Search
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <label
            htmlFor="wallet-status-filter"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Status
          </label>
          <select
            id="wallet-status-filter"
            className={`${selectClassName} w-full`}
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange((event.target.value as WalletStatus | "") ?? "")
            }
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Frozen">Frozen</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default WalletToolbar;
