import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { productApi } from "../services/product-api";
import {
  ApiErrorResponse,
  PaginatedResponse,
  ProductListItem,
  ProductSortBy,
} from "../types/product";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

export const useProducts = () => {
  const [response, setResponse] = useState<PaginatedResponse<ProductListItem> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<ProductSortBy>("createdat");
  const [sortDesc, setSortDesc] = useState(true);
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(DEFAULT_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  useEffect(() => {
    let isCancelled = false;

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await productApi.getProducts({
          pageNumber,
          pageSize,
          sortBy,
          sortDesc,
          searchTerm: debouncedSearchTerm.length > 0 ? debouncedSearchTerm : undefined,
          status: status.length > 0 ? status : undefined,
          categoryId: categoryId ?? undefined,
          brandId: brandId ?? undefined,
        });

        if (!isCancelled) {
          setResponse(res);
        }
      } catch (error) {
        if (!isCancelled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ??
              "Unable to load products. Please try again.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isCancelled = true;
    };
  }, [
    pageNumber,
    pageSize,
    sortBy,
    sortDesc,
    status,
    categoryId,
    brandId,
    debouncedSearchTerm,
    reloadToken,
  ]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleSortByChange = useCallback((value: ProductSortBy) => {
    setSortBy(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleSortDirectionChange = useCallback((value: boolean) => {
    setSortDesc(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleCategoryChange = useCallback((value: number | null) => {
    setCategoryId(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleBrandChange = useCallback((value: number | null) => {
    setBrandId(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSize(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const reloadData = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  return {
    products: response?.items ?? [],
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
    totalCount: response?.totalCount ?? 0,
    totalPages: response?.totalPages ?? 0,
    hasNextPage: response?.hasNextPage ?? false,
    hasPreviousPage: response?.hasPreviousPage ?? false,
    handleSearchChange,
    handleSortByChange,
    handleSortDirectionChange,
    handleStatusChange,
    handleCategoryChange,
    handleBrandChange,
    handlePageSizeChange,
    setPageNumber,
    reloadData,
  };
};
