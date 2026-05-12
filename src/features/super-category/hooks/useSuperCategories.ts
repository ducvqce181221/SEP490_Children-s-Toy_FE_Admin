import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { superCategoryApi } from "../services/super-category-api";
import {
  ApiErrorResponse,
  PaginatedResponse,
  SuperCategoryListItem,
  SuperCategorySortBy,
} from "../types/super-category";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

export const useSuperCategories = () => {
  const [response, setResponse] = useState<PaginatedResponse<SuperCategoryListItem> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SuperCategorySortBy>("createdat");
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

    const fetchSuperCategories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await superCategoryApi.getSuperCategories({
          pageNumber,
          pageSize,
          sortBy,
          sortDesc,
          searchTerm: debouncedSearchTerm.length > 0 ? debouncedSearchTerm : undefined,
        });

        if (!isCancelled) {
          setResponse(res);
        }
      } catch (error) {
        if (!isCancelled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ??
              "Could not load super categories. Please try again.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchSuperCategories();

    return () => {
      isCancelled = true;
    };
  }, [
    pageNumber,
    pageSize,
    sortBy,
    sortDesc,
    debouncedSearchTerm,
    reloadToken,
  ]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleSortByChange = useCallback((value: SuperCategorySortBy) => {
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

  const reloadData = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  return {
    superCategories: response?.items ?? [],
    isLoading,
    error,
    searchTerm,
    sortBy,
    sortDesc,
    pageNumber,
    pageSize,
    totalCount: response?.totalCount ?? 0,
    totalPages: response?.totalPages ?? 0,
    hasNextPage: response?.hasNextPage ?? false,
    hasPreviousPage: response?.hasPreviousPage ?? false,
    handleSearchChange,
    handleSortByChange,
    handleSortDirectionChange,
    handlePageSizeChange,
    setPageNumber,
    reloadData,
  };
};
