"use client";

import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { withdrawalApi } from "../services/withdrawal-api";
import {
  AdminWithdrawalDetail,
  AdminWithdrawalListItem,
  AdminWithdrawalQueryParams,
  ApiErrorResponse,
  PaginatedResponse,
  WithdrawalStatus,
} from "../types/withdrawal";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

export const useWithdrawals = () => {
  const [withdrawalsResponse, setWithdrawalsResponse] =
    useState<PaginatedResponse<AdminWithdrawalListItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  // --- Filter states ---
  const [keyword, setKeyword] = useState(searchParams?.get("q") || "");
  const [searchKeyword, setSearchKeyword] = useState(searchParams?.get("q") || "");
  const [status, setStatus] = useState<string>(searchParams?.get("status") || "");
  const [dateFrom, setDateFrom] = useState<string>(searchParams?.get("from") || "");
  const [dateTo, setDateTo] = useState<string>(searchParams?.get("to") || "");

  // --- Pagination states ---
  const [pageNumber, setPageNumber] = useState(
    Number(searchParams?.get("page")) || DEFAULT_PAGE_NUMBER
  );
  const [pageSize, setPageSize] = useState(
    Number(searchParams?.get("size")) || DEFAULT_PAGE_SIZE
  );

  const [reloadToken, setReloadToken] = useState(0);

  // --- Detail modal states ---
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminWithdrawalDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Sync state to URL query parameters
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (searchKeyword) {
      params.set("q", searchKeyword);
      changed = true;
    } else if (params.has("q")) {
      params.delete("q");
      changed = true;
    }

    if (status) {
      params.set("status", status);
      changed = true;
    } else if (params.has("status")) {
      params.delete("status");
      changed = true;
    }

    if (dateFrom) {
      params.set("from", dateFrom);
      changed = true;
    } else if (params.has("from")) {
      params.delete("from");
      changed = true;
    }

    if (dateTo) {
      params.set("to", dateTo);
      changed = true;
    } else if (params.has("to")) {
      params.delete("to");
      changed = true;
    }

    if (pageNumber > 1) {
      params.set("page", pageNumber.toString());
      changed = true;
    } else if (params.has("page")) {
      params.delete("page");
      changed = true;
    }

    if (pageSize !== DEFAULT_PAGE_SIZE) {
      params.set("size", pageSize.toString());
      changed = true;
    } else if (params.has("size")) {
      params.delete("size");
      changed = true;
    }

    if (changed) {
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    } else if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchKeyword, status, dateFrom, dateTo, pageNumber, pageSize]);

  // Submit keyword search manually (e.g. on Enter key)
  const handleSearchSubmit = useCallback(() => {
    setSearchKeyword(keyword.trim());
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, [keyword]);

  // Fetch withdrawals list
  useEffect(() => {
    let isCancelled = false;

    const fetchList = async () => {
      setIsLoading(true);
      setError(null);

      const params: AdminWithdrawalQueryParams = {
        page: pageNumber,
        pageSize: pageSize,
        ...(searchKeyword && { keyword: searchKeyword }),
        ...(status && { status }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      };

      try {
        const response = await withdrawalApi.getWithdrawals(params);
        if (!isCancelled) {
          setWithdrawalsResponse(response);
        }
      } catch (err) {
        if (!isCancelled) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ??
              "Could not load withdrawals. Please try again."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchList();

    return () => {
      isCancelled = true;
    };
  }, [pageNumber, pageSize, searchKeyword, status, dateFrom, dateTo, reloadToken]);

  // Fetch detailed withdrawal info when selectedId is set
  useEffect(() => {
    if (selectedId === null) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    let isCancelled = false;

    const fetchDetail = async () => {
      setIsDetailLoading(true);
      setDetailError(null);

      try {
        const response = await withdrawalApi.getWithdrawalById(selectedId);
        if (!isCancelled) {
          setDetail(response);
        }
      } catch (err) {
        if (!isCancelled) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          setDetailError(
            axiosError.response?.data?.message ??
              "Could not load withdrawal details. Please try again."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsDetailLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      isCancelled = true;
    };
  }, [selectedId]);

  // Filter handlers
  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleFromDateChange = useCallback((value: string) => {
    setDateFrom(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleToDateChange = useCallback((value: string) => {
    setDateTo(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSize(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const clearFilters = useCallback(() => {
    setKeyword("");
    setSearchKeyword("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const reloadWithdrawals = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  const openDetailModal = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const closeDetailModal = useCallback(() => {
    setSelectedId(null);
  }, []);

  return {
    withdrawals: withdrawalsResponse?.items ?? [],
    isLoading,
    error,
    keyword,
    status,
    dateFrom,
    dateTo,
    pageNumber,
    pageSize,
    totalCount: withdrawalsResponse?.totalCount ?? 0,
    totalPages: withdrawalsResponse?.totalPages ?? 0,
    hasNextPage: withdrawalsResponse?.hasNextPage ?? false,
    hasPreviousPage: withdrawalsResponse?.hasPreviousPage ?? false,
    detail,
    isDetailLoading,
    detailError,
    selectedId,
    handleKeywordChange,
    handleSearchSubmit,
    handleStatusChange,
    handleFromDateChange,
    handleToDateChange,
    handlePageSizeChange,
    clearFilters,
    setPageNumber,
    reloadWithdrawals,
    openDetailModal,
    closeDetailModal,
  };
};
