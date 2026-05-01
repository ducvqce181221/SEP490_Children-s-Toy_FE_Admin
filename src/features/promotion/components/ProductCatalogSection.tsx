"use client";

import { useState, useEffect, useCallback } from "react";
import { productApi } from "@/features/product/services/product-api";
import { ProductListItem } from "@/features/product/types/product";
import Button from "@/components/ui/button/Button";
import SearchInput from "@/components/common/SearchInput";
import Checkbox from "@/components/form/input/Checkbox";
import Pagination from "@/components/common/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductCatalogSectionProps {
  onConfirm: (addedProducts: ProductListItem[], removedProductIds: number[]) => void;
  selectedProductIds: number[];
}

export function ProductCatalogSection({
  onConfirm,
  selectedProductIds,
}: ProductCatalogSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productCache, setProductCache] = useState<Map<number, ProductListItem>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set(selectedProductIds));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = useCallback(async (search: string, pageNum: number) => {
    setIsLoading(true);
    try {
      const res = await productApi.getProducts({
        pageNumber: pageNum,
        pageSize: 10,
        searchTerm: search,
      });
      setProducts(res.items);
      setTotalPages(res.totalPages);
      setProductCache((prev) => {
        const newCache = new Map(prev);
        res.items.forEach((p: ProductListItem) => newCache.set(p.productId, p));
        return newCache;
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[ProductCatalogSection] Failed to fetch products", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(debouncedSearch, page);
  }, [debouncedSearch, page, fetchProducts]);

  // Keep local checkedIds in sync if external selectedProductIds changes (e.g., deleted from Section 2 directly)
  useEffect(() => {
    setCheckedIds(new Set(selectedProductIds));
  }, [selectedProductIds]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSearchSubmit = () => {
    setDebouncedSearch(searchTerm);
    setPage(1);
  };

  const handleSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const toggleCheck = (productId: number) => {
    const newChecked = new Set(checkedIds);
    if (newChecked.has(productId)) {
      newChecked.delete(productId);
    } else {
      newChecked.add(productId);
    }
    setCheckedIds(newChecked);
  };

  const handleConfirmClick = () => {
    const removedProductIds = selectedProductIds.filter((id) => !checkedIds.has(id));
    const addedProductIds = Array.from(checkedIds).filter((id) => !selectedProductIds.includes(id));
    
    const addedProducts = addedProductIds
      .map((id) => productCache.get(id))
      .filter((p): p is ProductListItem => p !== undefined);

    onConfirm(addedProducts, removedProductIds);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-orange-500 dark:text-orange-400">
        Product Catalog
      </h3>

      <div className="flex gap-3">
        <SearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search products..."
          className="flex-1"
        />
        <Button type="button" onClick={handleSearchSubmit} variant="outline" size="sm">
          Search
        </Button>
      </div>

      <div className="border border-gray-200 dark:border-white/[0.05] rounded-xl min-h-[300px] overflow-hidden bg-white dark:bg-white/[0.03]">
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px] text-gray-400">
            Loading...
          </div>
        ) : products.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-gray-400 dark:text-gray-500">
            No products found
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 w-12 font-medium text-gray-500 text-theme-xs dark:text-gray-400 text-start"
                >
                  Select
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Product Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 w-36 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Price
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 w-24 font-medium text-gray-500 text-theme-xs dark:text-gray-400 text-start"
                >
                  Stock
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {products.map((product) => {
                const isChecked = checkedIds.has(product.productId);

                return (
                  <TableRow
                    key={product.productId}
                    className={`transition-colors ${isChecked ? "bg-gray-50 dark:bg-white/[0.02]" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
                  >
                    <TableCell className="px-4 py-3 text-start">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleCheck(product.productId)}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90 text-start">
                      {product.productName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-start">
                      {product.price.toLocaleString("vi-VN")} đ
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-start">
                      {product.quantity}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Selected: <strong>{checkedIds.size}</strong> products
        </span>
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="primary"
          onClick={handleConfirmClick}
        >
          Confirm to Apply ({checkedIds.size})
        </Button>
      </div>
    </div>
  );
}
