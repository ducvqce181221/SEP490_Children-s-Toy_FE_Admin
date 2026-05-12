import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { customerApi } from "../services/customer-api";
import {
  ApiErrorResponse,
  CustomerListItem,
  CustomerSortBy,
  PaginatedResponse,
} from "../types/customer";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

export const useCustomers = () => {
  const [customersResponse, setCustomersResponse] = useState<
    PaginatedResponse<CustomerListItem> | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<CustomerSortBy>("createdat");
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

    const fetchCustomers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await customerApi.getCustomers({
          pageNumber,
          pageSize,
          sortBy,
          sortDesc,
          searchTerm:
            debouncedSearchTerm.length > 0 ? debouncedSearchTerm : undefined,
        });

        if (!isCancelled) {
          setCustomersResponse(response);
        }
      } catch (error) {
        if (!isCancelled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ??
              "Unable to load customers. Please try again.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCustomers();

    return () => {
      isCancelled = true;
    };
  }, [pageNumber, pageSize, sortBy, sortDesc, debouncedSearchTerm, reloadToken]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleSortByChange = useCallback((value: CustomerSortBy) => {
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

  const reloadCustomers = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  return {
    customers: customersResponse?.items ?? [],
    isLoading,
    error,
    searchTerm,
    sortBy,
    sortDesc,
    pageNumber,
    pageSize,
    totalCount: customersResponse?.totalCount ?? 0,
    totalPages: customersResponse?.totalPages ?? 0,
    handleSearchChange,
    handleSortByChange,
    handleSortDirectionChange,
    handlePageSizeChange,
    setPageNumber,
    reloadCustomers,
  };
};
