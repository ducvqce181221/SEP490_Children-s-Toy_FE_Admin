import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { brandApi } from "../services/brand-api";
import {
  ApiErrorResponse,
  BrandListItem,
  BrandSortBy,
  PaginatedResponse,
} from "../types/brand";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

export const useBrands = () => {
  const [brandsResponse, setBrandsResponse] = useState<
    PaginatedResponse<BrandListItem> | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<BrandSortBy>("createdat");
  const [sortDesc, setSortDesc] = useState(true);
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

    const fetchBrands = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await brandApi.getBrands({
          pageNumber,
          pageSize,
          sortBy,
          sortDesc,
          searchTerm:
            debouncedSearchTerm.length > 0 ? debouncedSearchTerm : undefined,
        });

        if (!isCancelled) {
          setBrandsResponse(response);
        }
      } catch (error) {
        if (!isCancelled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ??
              "Unable to load brands. Please try again.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchBrands();

    return () => {
      isCancelled = true;
    };
  }, [pageNumber, pageSize, sortBy, sortDesc, debouncedSearchTerm, reloadToken]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleSortByChange = useCallback((value: BrandSortBy) => {
    setSortBy(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleSortDirectionChange = useCallback((value: boolean) => {
    setSortDesc(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSize(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const reloadBrands = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  return {
    brands: brandsResponse?.items ?? [],
    isLoading,
    error,
    searchTerm,
    sortBy,
    sortDesc,
    pageNumber,
    pageSize,
    totalCount: brandsResponse?.totalCount ?? 0,
    totalPages: brandsResponse?.totalPages ?? 0,
    hasNextPage: brandsResponse?.hasNextPage ?? false,
    hasPreviousPage: brandsResponse?.hasPreviousPage ?? false,
    handleSearchChange,
    handleSortByChange,
    handleSortDirectionChange,
    handlePageSizeChange,
    setPageNumber,
    reloadBrands,
  };
};
