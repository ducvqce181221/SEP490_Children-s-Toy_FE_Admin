import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons/index";
import SearchInput from "@/components/common/SearchInput";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { PromotionFilters } from "../hooks/usePromotions";
import Link from "next/link";

const FilterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5.83333H17.5M5 10H15M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface PromotionToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: PromotionFilters;
  onFilterChange: (filters: PromotionFilters) => void;
}

export const PromotionToolbar: React.FC<PromotionToolbarProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchQuery);
  const [localStatus, setLocalStatus] = useState(filters.status);

  // Sync local state when parent searchQuery changes
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSearchTerm(searchQuery);
  }, [searchQuery]);

  // Sync local status state when parent status filter changes
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalStatus(filters.status);
  }, [filters.status]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchChange(localSearchTerm);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalStatus(e.target.value);
  };

  const clearFilters = () => {
    setLocalStatus("");
    onFilterChange({ status: "" });
    setIsFilterOpen(false);
  };

  const applyFilters = () => {
    onFilterChange({ ...filters, status: localStatus });
    setIsFilterOpen(false);
  };

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Promotion List
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your store promotions and discounts here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/promotions/create">
            <Button variant="primary" startIcon={<PlusIcon />}>
              Add Promotion
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchInput 
            value={localSearchTerm} 
            onChange={setLocalSearchTerm} 
            onKeyDown={handleKeyDown}
            placeholder="Search promotions... (Press Enter)" 
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
            {filters.status && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-500 rounded-full">
                !
              </span>
            )}
          </Button>

          <Dropdown isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} className="w-[300px] p-4 right-0">
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Filter Promotions</h4>
              
              <div>
                <Label>Status</Label>
                <Select
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "Active", label: "Active" },
                    { value: "Scheduled", label: "Scheduled" },
                    { value: "Inactive", label: "Inactive" },
                    { value: "Expired", label: "Expired" },
                  ]}
                  onChange={handleStatusChange}
                  value={localStatus}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
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
