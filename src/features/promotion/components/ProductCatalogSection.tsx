"use client";

import { useState, useEffect } from "react";
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
import { brandApi } from "@/features/brand/services/brand-api";
import { categoryApi } from "@/features/category/services/category-api";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Image from "next/image";

const FilterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5.83333H17.5M5 10H15M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [brands, setBrands] = useState<{ value: string; label: string }[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productCache, setProductCache] = useState<Map<number, ProductListItem>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  
  // QUAN TRỌNG: Thay vì dùng state và useEffect bị lỗi cascading renders,
  // ta dùng localAddedIds và localRemovedIds để tính toán derived state (checkedIds)
  const [localAddedIds, setLocalAddedIds] = useState<Set<number>>(new Set());
  const [localRemovedIds, setLocalRemovedIds] = useState<Set<number>>(new Set());
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Biến tính toán (Derived State) thay thế cho state cũ + useEffect
  const checkedIds = new Set([
    ...selectedProductIds.filter(id => !localRemovedIds.has(id)),
    ...localAddedIds
  ]);

  useEffect(() => {
    let isCancelled = false;

    const fetchLookups = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          brandApi.getBrands({ pageNumber: 1, pageSize: 100 }),
          categoryApi.getCategories({ pageNumber: 1, pageSize: 100 }),
        ]);
        if (!isCancelled) {
          setBrands([
            { value: "", label: "All Brands" },
            ...brandsRes.items.map(b => ({ value: b.brandId.toString(), label: b.brandName }))
          ]);
          setCategories([
            { value: "", label: "All Categories" },
            ...categoriesRes.items.map(c => ({ value: c.categoryId.toString(), label: c.categoryName }))
          ]);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[ProductCatalogSection] Failed to fetch filters", error);
        }
      }
    };
    fetchLookups();

    return () => { isCancelled = true; };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await productApi.getProducts({
          pageNumber: page,
          pageSize: 10,
          searchTerm: debouncedSearch,
          brandId: selectedBrandId,
          categoryId: selectedCategoryId,
          status: "Active",
        });

        if (!isCancelled) {
          setProducts(res.items);
          setTotalPages(res.totalPages);
          setProductCache((prev) => {
            const newCache = new Map(prev);
            res.items.forEach((p: ProductListItem) => newCache.set(p.productId, p));
            return newCache;
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[ProductCatalogSection] Failed to fetch products", error);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, page, selectedBrandId, selectedCategoryId]); 

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setDebouncedSearch(searchTerm);
      setPage(1);
    }
  };

  const clearFilters = () => {
    setSelectedBrandId(null);
    setSelectedCategoryId(null);
    setIsFilterOpen(false);
    setPage(1);
  };

  const toggleCheck = (productId: number) => {
    if (checkedIds.has(productId)) {
      // Đang checked -> Bỏ check
      if (selectedProductIds.includes(productId)) {
        // Nếu nó là sản phẩm từ props ban đầu -> đánh dấu là bị xoá
        setLocalRemovedIds(prev => new Set(prev).add(productId));
        setLocalAddedIds(prev => { const n = new Set(prev); n.delete(productId); return n; });
      } else {
        // Nếu nó là sản phẩm vừa được thêm vào ở phiên này -> bỏ khỏi danh sách thêm
        setLocalAddedIds(prev => { const n = new Set(prev); n.delete(productId); return n; });
      }
    } else {
      // Chưa checked -> Check thêm
      if (localRemovedIds.has(productId)) {
        // Nếu nó bị đánh dấu xoá trước đó -> bỏ khỏi danh sách xoá (khôi phục lại)
        setLocalRemovedIds(prev => { const n = new Set(prev); n.delete(productId); return n; });
      } else {
        // Nếu nó hoàn toàn mới -> thêm vào danh sách thêm
        setLocalAddedIds(prev => new Set(prev).add(productId));
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    const newAdded = new Set(localAddedIds);
    const newRemoved = new Set(localRemovedIds);

    if (checked) {
      // Select all on current page
      products.forEach((p) => {
        if (selectedProductIds.includes(p.productId)) {
          newRemoved.delete(p.productId);
        } else {
          newAdded.add(p.productId);
        }
      });
    } else {
      // Deselect all on current page
      products.forEach((p) => {
        if (selectedProductIds.includes(p.productId)) {
          newRemoved.add(p.productId);
        } else {
          newAdded.delete(p.productId);
        }
      });
    }

    setLocalAddedIds(newAdded);
    setLocalRemovedIds(newRemoved);
  };

  const handleConfirmClick = () => {
    const removedProductIds = Array.from(localRemovedIds);

    const addedProducts = Array.from(localAddedIds)
      .map((id) => productCache.get(id))
      .filter((p): p is ProductListItem => p !== undefined);

    onConfirm(addedProducts, removedProductIds);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-orange-500 dark:text-orange-400">
        Product Catalog
      </h3>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products... (Enter)"
          />
        </div>

        <div className="relative">
          <Button
            type="button"
            variant="outline"
            startIcon={<FilterIcon />}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            Filter
            {(selectedBrandId || selectedCategoryId) && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                !
              </span>
            )}
          </Button>

          <Dropdown 
            isOpen={isFilterOpen} 
            onClose={() => setIsFilterOpen(false)} 
            className="absolute right-0 z-50 mt-2 w-[300px] p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
          >
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-gray-800 dark:text-white/90">Filter Products</h4>
              
              <div>
                <Label>Brand</Label>
                <Select
                  options={brands}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedBrandId(val ? parseInt(val) : null);
                    setPage(1);
                  }}
                  value={selectedBrandId?.toString() || ""}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  options={categories}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCategoryId(val ? parseInt(val) : null);
                    setPage(1);
                  }}
                  value={selectedCategoryId?.toString() || ""}
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
                  #
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 w-12 font-medium text-gray-500 text-theme-xs dark:text-gray-400 text-start"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={products.length > 0 && products.every(p => checkedIds.has(p.productId))}
                      onChange={(checked) => handleSelectAll(checked)}
                    />
                    <span>Select</span>
                  </div>
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Product Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 w-32 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Price (VND)
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 w-20 font-medium text-gray-500 text-theme-xs dark:text-gray-400 text-start"
                >
                  Stock
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {products.map((product, index) => {
                const isChecked = checkedIds.has(product.productId);

                return (
                  <TableRow
                    key={product.productId}
                    className={`transition-colors ${isChecked ? "bg-gray-50 dark:bg-white/[0.02]" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
                  >
                    <TableCell className="px-4 py-3 text-start text-sm text-gray-500 dark:text-gray-400">
                      {(page - 1) * 10 + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleCheck(product.productId)}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex items-center gap-3">
                        {product.mainImageUrl ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
                            <Image
                              src={product.mainImageUrl}
                              alt={product.productName}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                            <span className="text-[10px] text-gray-400">No Img</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {product.productName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {product.categoryName} {product.brandName ? `• ${product.brandName}` : ""}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-start">
                      {product.price.toLocaleString("vi-VN")}
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