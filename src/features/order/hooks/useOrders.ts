import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { orderApi } from "../services/order-api";
import {
  ApiErrorResponse,
  ORDER_WORK_TAB,
  OrderListItem,
  OrderQueryParams,
  OrderWorkTab,
  PaginatedResponse,
  ROLE_DEFAULT_STATUS_IDS,
  ROLE_NAME,
} from "../types/order";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

const isOperationalRole = (roleName: string) =>
  roleName === ROLE_NAME.STAFF || roleName === ROLE_NAME.MERCHANDISE;

const parseWorkTabFromUrl = (value: string | null): OrderWorkTab => {
  if (value === ORDER_WORK_TAB.COMPLETED) return ORDER_WORK_TAB.COMPLETED;
  return ORDER_WORK_TAB.IN_PROGRESS;
};

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

  const searchParams = useSearchParams();

  // ── Filter state ────────────────────────────────────────────────────────
  const [keyword, setKeyword] = useState(searchParams?.get("q") || "");
  const [searchKeyword, setSearchKeyword] = useState(searchParams?.get("q") || "");
  // "" = dùng default theo role; số = filter cụ thể; 0 = Admin xem tất cả
  const [statusId, setStatusId] = useState<number | "">(
    searchParams?.has("status") ? Number(searchParams.get("status")) : ""
  );
  const [assignedToMe, setAssignedToMe] = useState(searchParams?.get("assigned") === "true");
  const [workTab, setWorkTab] = useState<OrderWorkTab>(() =>
    parseWorkTabFromUrl(searchParams?.get("tab") ?? null),
  );
  const [fromDate, setFromDate] = useState<string>(searchParams?.get("from") || "");
  const [toDate, setToDate] = useState<string>(searchParams?.get("to") || "");

  // ── Pagination ──────────────────────────────────────────────────────────
  const [pageNumber, setPageNumber] = useState(Number(searchParams?.get("page")) || DEFAULT_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState(Number(searchParams?.get("size")) || DEFAULT_PAGE_SIZE);

  // Sync state to URL silently so that "Back" button restores it
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (searchKeyword) { params.set("q", searchKeyword); changed = true; }
    else if (params.has("q")) { params.delete("q"); changed = true; }

    if (statusId !== "") { params.set("status", statusId.toString()); changed = true; }
    else if (params.has("status")) { params.delete("status"); changed = true; }

    if (assignedToMe) { params.set("assigned", "true"); changed = true; }
    else if (params.has("assigned")) { params.delete("assigned"); changed = true; }

    if (isOperationalRole(roleName)) {
      if (workTab !== ORDER_WORK_TAB.IN_PROGRESS) {
        params.set("tab", workTab);
        changed = true;
      } else if (params.has("tab")) {
        params.delete("tab");
        changed = true;
      }
    } else if (params.has("tab")) {
      params.delete("tab");
      changed = true;
    }

    if (fromDate) { params.set("from", fromDate); changed = true; }
    else if (params.has("from")) { params.delete("from"); changed = true; }

    if (toDate) { params.set("to", toDate); changed = true; }
    else if (params.has("to")) { params.delete("to"); changed = true; }

    if (pageNumber > 1) { params.set("page", pageNumber.toString()); changed = true; }
    else if (params.has("page")) { params.delete("page"); changed = true; }

    if (pageSize !== DEFAULT_PAGE_SIZE) { params.set("size", pageSize.toString()); changed = true; }
    else if (params.has("size")) { params.delete("size"); changed = true; }

    if (changed) {
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    } else if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchKeyword, statusId, assignedToMe, workTab, roleName, fromDate, toDate, pageNumber, pageSize]);

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
        ...(statusId === "" &&
          roleName !== ROLE_NAME.STAFF &&
          roleName !== ROLE_NAME.MERCHANDISE &&
          defaultStatusIds.length > 0 && { statusIds: defaultStatusIds }),
        ...(assignedToMe && roleName === ROLE_NAME.ADMIN && { assignedToMe }),
        ...(isOperationalRole(roleName) && { assignmentScope: workTab }),
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
    workTab,
    roleName,
    searchKeyword,
    fromDate,
    toDate,
    reloadToken,
    defaultStatusIds,
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

  const handleWorkTabChange = useCallback((tab: OrderWorkTab) => {
    setWorkTab(tab);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRealtime = () => {
      reloadOrders();
    };
    window.addEventListener("realtime-notification", handleRealtime);
    return () => {
      window.removeEventListener("realtime-notification", handleRealtime);
    };
  }, [reloadOrders]);

  return {
    orders: ordersResponse?.items ?? [],
    isLoading,
    error,
    keyword,
    statusId,
    assignedToMe,
    workTab,
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
    handleWorkTabChange,
    handleFromDateChange,
    handleToDateChange,
    handlePageSizeChange,
    setPageNumber,
    reloadOrders,
  };
};
