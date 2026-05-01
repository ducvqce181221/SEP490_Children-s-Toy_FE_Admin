import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons/index";
import SearchInput from "@/components/common/SearchInput";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { SuperCategorySortBy } from "../types/super-category";

const FilterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5.83333H17.5M5 10H15M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface SuperCategoryToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: SuperCategorySortBy;
  onSortByChange: (value: SuperCategorySortBy) => void;
  sortDesc: boolean;
  onSortDirectionChange: (value: boolean) => void;
  onAddClick: () => void;
}

const SuperCategoryToolbar: React.FC<SuperCategoryToolbarProps> = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortDesc,
  onSortDirectionChange,
  onAddClick,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchChange(localSearchTerm);
    }
  };

  const clearFilters = () => {
    onSortByChange("createdat");
    onSortDirectionChange(true);
    setIsFilterOpen(false);
  };

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Super Categories
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage super categories in the system.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" startIcon={<PlusIcon />} onClick={onAddClick}>
            Add Super Category
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchInput
            placeholder="Search super categories... (Press Enter)"
            value={localSearchTerm}
            onChange={setLocalSearchTerm}
            onKeyDown={handleKeyDown}
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
            {(sortBy !== "createdat" || !sortDesc) && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-500 rounded-full">
                !
              </span>
            )}
          </Button>

          <Dropdown isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} className="w-[300px] p-4 right-0">
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Filter Super Categories</h4>
              
              <div>
                <Label>Sort By</Label>
                <Select
                  options={[
                    { value: "createdat", label: "Created At" },
                    { value: "supercategoryname", label: "Category Name" },
                    { value: "status", label: "Status" },
                  ]}
                  onChange={(e) => onSortByChange(e.target.value as SuperCategorySortBy)}
                  value={sortBy}
                />
              </div>

              <div>
                <Label>Order</Label>
                <Select
                  options={[
                    { value: "desc", label: "Descending" },
                    { value: "asc", label: "Ascending" },
                  ]}
                  onChange={(e) => onSortDirectionChange(e.target.value === "desc")}
                  value={sortDesc ? "desc" : "asc"}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
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

export default SuperCategoryToolbar;
