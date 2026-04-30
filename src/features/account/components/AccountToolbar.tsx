import React, { useState } from "react";
import Button from "../../../components/ui/button/Button";
import { DownloadIcon, PlusIcon } from "@/icons/index";
import SearchInput from "../../../components/common/SearchInput";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";

const FilterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5.83333H17.5M5 10H15M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export interface AccountFilters {
  role: string;
  status: string;
}

interface AccountToolbarProps {
  onAddClick: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: AccountFilters;
  onFilterChange: (filters: AccountFilters) => void;
}

const AccountToolbar: React.FC<AccountToolbarProps> = ({
  onAddClick,
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleRoleChange = (value: string) => {
    onFilterChange({ ...filters, role: value });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filters, status: value });
  };

  const clearFilters = () => {
    onFilterChange({ role: "", status: "" });
    setIsFilterOpen(false);
  };

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Account List
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your team members and their account permissions here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" startIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button variant="primary" startIcon={<PlusIcon />} onClick={onAddClick}>
            Add Account
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchInput value={searchQuery} onChange={onSearchChange} />
        </div>
        
        <div className="relative">
          <Button 
            variant="outline" 
            startIcon={<FilterIcon />} 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="dropdown-toggle"
          >
            Filter
            {(filters.role || filters.status) && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-500 rounded-full">
                !
              </span>
            )}
          </Button>

          <Dropdown isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} className="w-[300px] p-4 right-0">
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Filter Accounts</h4>
              
              <div>
                <Label>Role</Label>
                <Select
                  options={[
                    { value: "", label: "All Roles" },
                    { value: "Admin", label: "Admin" },
                    { value: "Editor", label: "Editor" },
                    { value: "User", label: "User" },
                  ]}
                  onChange={handleRoleChange}
                  defaultValue={filters.role}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "Active", label: "Active" },
                    { value: "Pending", label: "Pending" },
                    { value: "Banned", label: "Banned" },
                  ]}
                  onChange={handleStatusChange}
                  defaultValue={filters.status}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
                <Button variant="primary" size="sm" onClick={() => setIsFilterOpen(false)}>
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

export default AccountToolbar;
