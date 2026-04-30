import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons/index";
import SearchInput from "@/components/common/SearchInput";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import { TemplateFilters } from "../hooks/useTemplates";

const FilterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5.83333H17.5M5 10H15M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface TemplateToolbarProps {
  onAddClick: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: TemplateFilters;
  onFilterChange: (filters: TemplateFilters) => void;
}

export const TemplateToolbar: React.FC<TemplateToolbarProps> = ({
  onAddClick,
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState<TemplateFilters>(filters);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSearchTerm(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchChange(localSearchTerm);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let isActive: boolean | undefined = undefined;
    if (e.target.value === "true") isActive = true;
    if (e.target.value === "false") isActive = false;
    setLocalFilters({ ...localFilters, isActive });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters({ ...localFilters, startDate: e.target.value || undefined });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters({ ...localFilters, endDate: e.target.value || undefined });
  };

  const clearFilters = () => {
    const emptyFilters = { isActive: undefined, startDate: undefined, endDate: undefined };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsFilterOpen(false);
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
    setIsFilterOpen(false);
  };

  const hasActiveFilters = filters.isActive !== undefined || filters.startDate || filters.endDate;

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Template List
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your message templates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" startIcon={<PlusIcon />} onClick={onAddClick}>
            Add Template
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchInput 
            value={localSearchTerm} 
            onChange={setLocalSearchTerm} 
            onKeyDown={handleKeyDown}
            placeholder="Search templates... (Press Enter)" 
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
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-500 rounded-full">
                !
              </span>
            )}
          </Button>

          <Dropdown isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} className="w-[300px] p-4 right-0">
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Filter Templates</h4>
              
              <div>
                <Label>Status</Label>
                <Select
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "true", label: "Active" },
                    { value: "false", label: "Inactive" },
                  ]}
                  onChange={handleStatusChange}
                  value={localFilters.isActive === undefined ? "" : localFilters.isActive.toString()}
                />
              </div>

              <div>
                <Label>Created After</Label>
                <Input 
                  type="date"
                  value={localFilters.startDate || ""}
                  onChange={handleStartDateChange}
                />
              </div>

              <div>
                <Label>Created Before</Label>
                <Input 
                  type="date"
                  value={localFilters.endDate || ""}
                  onChange={handleEndDateChange}
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
