import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { orderApi } from "../services/order-api";
import {
  ApiErrorResponse,
  OrderListItem,
  OrderQueryParams,
  PaginatedResponse,
  ROLE_DEFAULT_STATUS_IDS,
  ROLE_NAME,
} from "../types/order";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

export const useOrders = () => {
  const { account } = useAuthContext();
  const roleName = account?.roleName ?? "";

  /** Status IDs mặc định phù hợp với role hiện tại */
  const defaultStatusIds = useMemo(
    () => ROLE_DEFAULT_STATUS_IDS[roleName] ?? [],
    [roleName],
  );

  const [ordersResponse, setOrdersResponse] =
    useState<PaginatedResponse<OrderListItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter state ────────────────────────────────────────────────────────
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  // "" = dùng default theo role; số = filter cụ thể; 0 = Admin xem tất cả
  const [statusId, setStatusId] = useState<number | "">("");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // ── Pagination ──────────────────────────────────────────────────────────
  const [pageNumber, setPageNumber] = useState(DEFAULT_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // ── Reload trigger ──────────────────────────────────────────────────────
  const [reloadToken, setReloadToken] = useState(0);

  // Manual search submission
  const handleSearchSubmit = useCallback(() => {
    setSearchKeyword(keyword.trim());
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, [keyword]);

  // ── Fetch orders ─────────────────────────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;

    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);

      // Khi statusId = "" và role có default → gửi statusIds[] (multi-filter)
      // Khi statusId là số cụ thể → gửi đúng id đó
      // Khi Admin chọn "Tất cả" (statusId = 0) → không gửi statusId
      const params: OrderQueryParams = {
        pageNumber,
        pageSize,
        ...(statusId !== "" && statusId !== 0 && { statusId }),
        ...(statusId === "" && defaultStatusIds.length > 0 && { statusIds: defaultStatusIds }),
        ...(assignedToMe && { assignedToMe }),
        ...(searchKeyword && { keyword: searchKeyword }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      };

      try {
        const response = await orderApi.getOrders(params);
        if (!isCancelled) setOrdersResponse(response);
      } catch (err) {
        if (!isCancelled) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ??
              "Could not load orders. Please try again.",
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchOrders();
    return () => {
      isCancelled = true;
    };
  }, [
    pageNumber,
    pageSize,
    statusId,
    assignedToMe,
    searchKeyword,
    fromDate,
    toDate,
    reloadToken,
  ]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
  }, []);

  const handleStatusChange = useCallback((value: number | "") => {
    setStatusId(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleAssignedToMeChange = useCallback((value: boolean) => {
    setAssignedToMe(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleFromDateChange = useCallback((value: string) => {
    setFromDate(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleToDateChange = useCallback((value: string) => {
    setToDate(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSize(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const reloadOrders = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  return {
    orders: ordersResponse?.items ?? [],
    isLoading,
    error,
    keyword,
    statusId,
    assignedToMe,
    fromDate,
    toDate,
    pageNumber,
    pageSize,
    totalCount: ordersResponse?.totalCount ?? 0,
    totalPages: ordersResponse?.totalPages ?? 0,
    hasNextPage: ordersResponse?.hasNextPage ?? false,
    hasPreviousPage: ordersResponse?.hasPreviousPage ?? false,
    roleName,
    defaultStatusIds,
    handleKeywordChange,
    handleSearchSubmit,
    handleStatusChange,
    handleAssignedToMeChange,
    handleFromDateChange,
    handleToDateChange,
    handlePageSizeChange,
    setPageNumber,
    reloadOrders,
  };
};
