import React from "react";
import SearchInput from "@/components/common/SearchInput";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons/index";
import { BlogSortBy, BlogStatus, blogStatuses } from "../types/blog";

interface BlogToolbarProps {
  roleLabel: string;
  canAdd: boolean;
  searchTerm: string;
  statusFilter: BlogStatus | "all";
  sortBy: BlogSortBy;
  sortDesc: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: BlogStatus | "all") => void;
  onSortByChange: (value: BlogSortBy) => void;
  onSortDirectionChange: (value: boolean) => void;
  onAddClick: () => void;
}

const sortOptions: Array<{ value: BlogSortBy; label: string }> = [
  { value: "createdat", label: "Created Date" },
  { value: "updatedat", label: "Updated Date" },
  { value: "blogtitle", label: "Blog Title" },
  { value: "status", label: "Status" },
  { value: "blogat", label: "Blog At" },
];

const directionOptions = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
] as const;

const selectClassName =
  "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const BlogToolbar: React.FC<BlogToolbarProps> = ({
  roleLabel,
  canAdd,
  searchTerm,
  statusFilter,
  sortBy,
  sortDesc,
  onSearchChange,
  onStatusFilterChange,
  onSortByChange,
  onSortDirectionChange,
  onAddClick,
}) => {
  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Blog List ({roleLabel})
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Search, track status, and manage blog workflow.
          </p>
        </div>
        {canAdd && (
          <div className="flex items-center gap-3">
            <Button variant="primary" startIcon={<PlusIcon />} onClick={onAddClick}>
              Add Blog
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="mb-1 block text-sm font-medium text-transparent select-none" aria-hidden="true">
            Search
          </p>
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by blog title or content"
          />
        </div>

        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:justify-end">
            <div>
              <label
                htmlFor="blog-status-filter"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Status
              </label>
              <select
                id="blog-status-filter"
                className={`${selectClassName} w-full sm:w-40`}
                value={statusFilter}
                onChange={(event) =>
                  onStatusFilterChange(event.target.value as BlogStatus | "all")
                }
              >
                <option value="all">All</option>
                {blogStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="blog-sort-field"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Sort by
              </label>
              <select
                id="blog-sort-field"
                className={`${selectClassName} w-full sm:w-44`}
                value={sortBy}
                onChange={(event) => onSortByChange(event.target.value as BlogSortBy)}
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
                htmlFor="blog-sort-direction"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Direction
              </label>
              <select
                id="blog-sort-direction"
                className={`${selectClassName} w-full sm:w-40`}
                value={sortDesc ? "desc" : "asc"}
                onChange={(event) => onSortDirectionChange(event.target.value === "desc")}
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

export default BlogToolbar;
