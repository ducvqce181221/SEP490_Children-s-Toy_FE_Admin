"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { CategoryListItem } from "../types/category";
import { categoryApi } from "../services/category-api";
import { format } from "date-fns";
import Badge from "@/components/ui/badge/Badge";

interface CategoryDetailModalProps {
  isOpen: boolean;
  categoryId: number;
  onClose: () => void;
}

const CategoryDetailModal = ({
  isOpen,
  categoryId,
  onClose,
}: CategoryDetailModalProps) => {
  const [category, setCategory] = useState<CategoryListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !categoryId) return;

    const fetchCategoryDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await categoryApi.getCategoryById(categoryId);
        setCategory(data);
      } catch (err) {
        setError("Failed to load category details");
        console.error("[CategoryDetailModal] Failed to fetch category:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryDetails();
  }, [isOpen, categoryId]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      Active: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
      Inactive: "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400",
    };
    return statusColors[status] || statusColors.Inactive;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-0">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-gray-900">
        <h2 id="category-detail-title" className="text-xl font-semibold text-gray-800 dark:text-white">
          Category Details
        </h2>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-error-500">{error}</p>
          </div>
        ) : category ? (
          <div className="space-y-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{category.categoryId}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Category Name</dt>
                <dd className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                  {category.categoryName}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Super Category</dt>
                <dd className="mt-1">
                  <Badge size="sm" color="light">
                    {category.superCategoryName}
                  </Badge>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(category.status)}`}
                  >
                    {category.status}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {format(new Date(category.createdAt), "dd/MM/yyyy HH:mm")}
                </dd>
              </div>

              {category.updatedAt && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(category.updatedAt), "dd/MM/yyyy HH:mm")}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-gray-500">Category not found</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex justify-end border-t border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-gray-900">
        <button
          onClick={onClose}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default CategoryDetailModal;
