import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons/index";
import SearchInput from "@/components/common/SearchInput";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { CategorySortBy } from "../types/category";

const FilterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5.83333H17.5M5 10H15M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface CategoryToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: CategorySortBy;
  onSortByChange: (value: CategorySortBy) => void;
  sortDesc: boolean;
  onSortDirectionChange: (value: boolean) => void;
  onAddClick: () => void;
}

const CategoryToolbar: React.FC<CategoryToolbarProps> = ({
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
            Danh mục
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý các danh mục của hệ thống tại đây.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" startIcon={<PlusIcon />} onClick={onAddClick}>
            Thêm danh mục
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchInput
            placeholder="Tìm kiếm danh mục... (Nhấn Enter)"
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
            Lọc
            {(sortBy !== "createdat" || !sortDesc) && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-500 rounded-full">
                !
              </span>
            )}
          </Button>

          <Dropdown isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} className="w-[300px] p-4 right-0">
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Lọc danh mục</h4>
              
              <div>
                <Label>Sắp xếp theo</Label>
                <Select
                  options={[
                    { value: "createdat", label: "Ngày tạo" },
                    { value: "categoryname", label: "Tên danh mục" },
                    { value: "supercategoryname", label: "Danh mục lớn" },
                  ]}
                  onChange={(e) => onSortByChange(e.target.value as CategorySortBy)}
                  value={sortBy}
                />
              </div>

              <div>
                <Label>Thứ tự</Label>
                <Select
                  options={[
                    { value: "desc", label: "Giảm dần" },
                    { value: "asc", label: "Tăng dần" },
                  ]}
                  onChange={(e) => onSortDirectionChange(e.target.value === "desc")}
                  value={sortDesc ? "desc" : "asc"}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Xóa lọc
                </Button>
                <Button variant="primary" size="sm" onClick={() => setIsFilterOpen(false)}>
                  Áp dụng
                </Button>
              </div>
            </div>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default CategoryToolbar;
