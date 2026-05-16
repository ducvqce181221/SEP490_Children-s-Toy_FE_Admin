import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { walletApi } from "../services/wallet-api";
import {
  ApiErrorResponse,
  PaginatedResponse,
  WalletListItem,
  WalletStatus,
} from "../types/wallet";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

export const useWallets = () => {
  const [walletResponse, setWalletResponse] = useState<
    PaginatedResponse<WalletListItem> | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [accountSearch, setAccountSearch] = useState("");
  const [submittedAccountSearch, setSubmittedAccountSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WalletStatus | "">("");
  const [pageNumber, setPageNumber] = useState(DEFAULT_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const fetchWallets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await walletApi.getWallets({
          pageNumber,
          pageSize,
          account:
            submittedAccountSearch.length > 0 ? submittedAccountSearch : undefined,
          status: statusFilter || undefined,
        });

        if (!isCancelled) {
          setWalletResponse(response);
        }
      } catch (err) {
        if (!isCancelled) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ??
              "Unable to load wallets. Please try again.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchWallets();

    return () => {
      isCancelled = true;
    };
  }, [pageNumber, pageSize, submittedAccountSearch, statusFilter, reloadToken]);

  const handleAccountSearchChange = useCallback((value: string) => {
    setAccountSearch(value);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setSubmittedAccountSearch(accountSearch.trim());
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, [accountSearch]);

  const handleStatusFilterChange = useCallback((value: WalletStatus | "") => {
    setStatusFilter(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSize(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const reloadWallets = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  return {
    wallets: walletResponse?.items ?? [],
    totalCount: walletResponse?.totalCount ?? 0,
    totalPages: walletResponse?.totalPages ?? 0,
    accountSearch,
    statusFilter,
    pageNumber,
    pageSize,
    isLoading,
    error,
    setPageNumber,
    handleAccountSearchChange,
    handleSearchSubmit,
    handleStatusFilterChange,
    handlePageSizeChange,
    reloadWallets,
  };
};
