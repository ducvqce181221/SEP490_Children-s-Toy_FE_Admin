"use client";

import React, { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/common/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductMutations } from "../hooks/useProductMutations";
import { useProducts } from "../hooks/useProducts";
import {
  ProductListItem,
  ProductMutationResult,
  ProductLookupsResponse,
} from "../types/product";
import { ProductFormData } from "../types/product.schema";
import ProductFormModal from "./ProductFormModal";
import { ProductRow } from "./ProductRow";
import ProductToolbar from "./ProductToolbar";
import ProductDetailModal from "./ProductDetailModal";
import ProductExportReportModal from "./ProductExportReportModal";
import { productApi } from "../services/product-api";

const ProductTable = () => {
  const {
    products,
    isLoading,
    error,
    searchTerm,
    sortBy,
    sortDesc,
    status,
    categoryId,
    brandId,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    handleSearchChange,
    handleSortByChange,
    handleSortDirectionChange,
    handleStatusChange,
    handleCategoryChange,
    handleBrandChange,
    handlePageSizeChange,
    setPageNumber,
    reloadData,
  } = useProducts();

  const { createProduct, updateProduct, isSubmitting } =
    useProductMutations(reloadData);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductListItem | null>(null);
  const [viewingProduct, setViewingProduct] =
    useState<ProductListItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [lookups, setLookups] = useState<ProductLookupsResponse | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  const hasData = products.length > 0;
  const showInitialLoading = isLoading && !hasData;
  const isEditMode = editingProduct !== null;

  useEffect(() => {
    let isCancelled = false;

    const fetchLookups = async () => {
      setIsLookupLoading(true);
      try {
        const data = await productApi.getProductLookups();
        if (!isCancelled) {
          setLookups(data);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("[ProductTable] Failed to fetch product lookups", error);
        }
      } finally {
        if (!isCancelled) {
          setIsLookupLoading(false);
        }
      }
    };

    fetchLookups();

    return () => {
      isCancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(
    () =>
      lookups?.categories.map((category) => ({
        value: String(category.id),
        label: category.label,
      })) ?? [],
    [lookups?.categories],
  );

  const brandOptions = useMemo(
    () =>
      lookups?.brands.map((brand) => ({
        value: String(brand.id),
        label: brand.label,
      })) ?? [],
    [lookups?.brands],
  );

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product: ProductListItem) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (product: ProductListItem) => {
    setViewingProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setViewingProduct(null);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (
    payload: ProductFormData,
    id: number | null,
  ): Promise<ProductMutationResult> => {
    if (id !== null) {
      const result = await updateProduct(id, payload);

      if (result.success) {
        handleCloseFormModal();
        return result;
      }

      return result;
    }

    const result = await createProduct(payload);

    if (result.success) {
      handleCloseFormModal();
      return result;
    }

    return result;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <ProductToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortDesc={sortDesc}
        onSortDirectionChange={handleSortDirectionChange}
        status={status}
        onStatusChange={handleStatusChange}
        categoryId={categoryId}
        onCategoryChange={handleCategoryChange}
        brandId={brandId}
        onBrandChange={handleBrandChange}
        categoryOptions={categoryOptions}
        brandOptions={brandOptions}
        onAddClick={handleOpenCreateModal}
        onExportClick={() => setIsExportModalOpen(true)}
      />

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[1000px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  #
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Product Info
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Price
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Quantity
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Created Date
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {showInitialLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-10 text-center text-error-500"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : products.length > 0 ? (
                products.map((product, index) => (
                  <ProductRow
                    key={product.productId}
                    product={product}
                    rowNumber={(pageNumber - 1) * pageSize + index + 1}
                    onEdit={handleOpenEditModal}
                    onViewDetails={handleOpenDetailModal}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-5 py-4 border-t border-gray-100 dark:border-white/[0.05] gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Showing {Math.min((pageNumber - 1) * pageSize + 1, totalCount)} - {Math.min(pageNumber * pageSize, totalCount)} / {totalCount} products
            </span>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="py-1 px-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <Pagination
            currentPage={pageNumber}
            totalPages={totalPages}
            onPageChange={setPageNumber}
          />
        </div>
      )}

      {isFormModalOpen && (
        <ProductFormModal
          isOpen={isFormModalOpen}
          mode={isEditMode ? "edit" : "create"}
          product={editingProduct}
          isSubmitting={isSubmitting}
          onClose={handleCloseFormModal}
          onSubmit={handleSubmit}
        />
      )}

      {isDetailModalOpen && viewingProduct && (
        <ProductDetailModal
          isOpen={isDetailModalOpen}
          productId={viewingProduct.productId}
          onClose={handleCloseDetailModal}
        />
      )}

      {isExportModalOpen && (
        <ProductExportReportModal
          isOpen={isExportModalOpen}
          isLoadingLookups={isLookupLoading}
          lookups={lookups}
          currentFilters={{
            searchTerm,
            sortBy,
            sortDesc,
            status,
            categoryId,
            brandId,
          }}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductTable;
