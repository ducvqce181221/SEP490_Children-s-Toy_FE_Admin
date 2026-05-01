"use client";

import { useState, useEffect, useCallback } from "react";
import { productApi } from "@/features/product/services/product-api";
import { ProductListItem } from "@/features/product/types/product";
import { Modal } from "@/components/ui/modal";
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

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProducts: (products: ProductListItem[]) => void;
  selectedProductIds: number[];
}

export function ProductPickerModal({
  isOpen,
  onClose,
  onAddProducts,
  selectedProductIds,
}: ProductPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
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
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[ProductPickerModal] Failed to fetch products", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProducts(debouncedSearch, page);
      setCheckedIds(new Set()); // Reset on open
    }
  }, [isOpen, debouncedSearch, page, fetchProducts]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSearchSubmit = () => {
    setDebouncedSearch(searchTerm);
    setPage(1);
  };

  const handleSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") handleSearchSubmit();
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

  const handleConfirm = () => {
    const selectedProducts = products.filter((p) => checkedIds.has(p.productId));
    onAddProducts(selectedProducts);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl mx-auto p-6"
      showCloseButton
    >
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
          Chọn Sản Phẩm
        </h2>

        <div className="flex gap-3">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Tìm kiếm sản phẩm..."
            className="flex-1"
          />
          <Button onClick={handleSearchSubmit} variant="outline" size="sm">
            Tìm
          </Button>
        </div>

        <div className="border border-gray-200 dark:border-white/[0.05] rounded-xl min-h-[300px] overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-[300px] text-gray-400">
              Đang tải...
            </div>
          ) : products.length === 0 ? (
            <div className="flex justify-center items-center h-[300px] text-gray-400 dark:text-gray-500">
              Không tìm thấy sản phẩm nào
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-4 py-3 w-12 font-medium text-gray-500 text-theme-xs dark:text-gray-400 text-center"
                  >
                    Chọn
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Tên sản phẩm
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 w-36 font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Giá bán
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 w-24 font-medium text-gray-500 text-theme-xs dark:text-gray-400 text-center"
                  >
                    Kho
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {products.map((product) => {
                  const isAlreadySelected = selectedProductIds.includes(product.productId);
                  const isChecked = checkedIds.has(product.productId) || isAlreadySelected;

                  return (
                    <TableRow
                      key={product.productId}
                      className={`transition-colors ${isAlreadySelected ? "bg-gray-50 dark:bg-white/[0.02]" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
                    >
                      <TableCell className="px-4 py-3 text-center">
                        <Checkbox
                          checked={isChecked}
                          disabled={isAlreadySelected}
                          onChange={() => toggleCheck(product.productId)}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                        {product.productName}
                        {isAlreadySelected && (
                          <span className="ml-2 text-xs text-brand-500 font-normal">(Đã chọn)</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {product.price.toLocaleString("vi-VN")} đ
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-center">
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
            Đã chọn: <strong>{checkedIds.size}</strong> sản phẩm
          </span>
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-white/[0.05]">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={checkedIds.size === 0}
          >
            Xác nhận ({checkedIds.size})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
