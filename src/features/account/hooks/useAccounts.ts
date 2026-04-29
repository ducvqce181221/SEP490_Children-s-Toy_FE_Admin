import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { accountApi } from "../services/account-api";
import {
  AccountListItem,
  AccountSortBy,
  ApiErrorResponse,
  PaginatedResponse,
} from "../types/account";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

export const useAccounts = () => {
  const [accountsResponse, setAccountsResponse] = useState<
    PaginatedResponse<AccountListItem> | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<AccountSortBy>("createdat");
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

    const fetchAccounts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await accountApi.getAccounts({
          pageNumber,
          pageSize,
          sortBy,
          sortDesc,
          searchTerm:
            debouncedSearchTerm.length > 0 ? debouncedSearchTerm : undefined,
        });

        if (!isCancelled) {
          setAccountsResponse(response);
        }
      } catch (error) {
        if (!isCancelled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ??
              "Unable to load accounts. Please try again.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchAccounts();

    return () => {
      isCancelled = true;
    };
  }, [pageNumber, pageSize, sortBy, sortDesc, debouncedSearchTerm, reloadToken]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleSortByChange = useCallback((value: AccountSortBy) => {
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

  const reloadAccounts = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  return {
    accounts: accountsResponse?.items ?? [],
    isLoading,
    error,
    searchTerm,
    sortBy,
    sortDesc,
    pageNumber,
    pageSize,
    totalCount: accountsResponse?.totalCount ?? 0,
    totalPages: accountsResponse?.totalPages ?? 0,
    hasNextPage: accountsResponse?.hasNextPage ?? false,
    hasPreviousPage: accountsResponse?.hasPreviousPage ?? false,
    handleSearchChange,
    handleSortByChange,
    handleSortDirectionChange,
    handlePageSizeChange,
    setPageNumber,
    reloadAccounts,
  };
};
