import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { Refund, RefundFilter, RefundStatusType, REFUND_WORK_TAB, RefundWorkTab } from "../types/refund";
import { refundApi } from "../services/refund-api";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

const isOperationalRole = (role: string) =>
  role === "Staff" || role === "Merchandise";

const parseWorkTabFromUrl = (value: string | null): RefundWorkTab => {
  if (value === REFUND_WORK_TAB.COMPLETED) return REFUND_WORK_TAB.COMPLETED;
  return REFUND_WORK_TAB.IN_PROGRESS;
};

export const useRefunds = (initialQuery?: RefundFilter) => {
  const { account } = useAuthContext();
  const roleName = account?.roleName ?? "";

  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  const searchParams = useSearchParams();

  // -- Filter state --
  const [keyword, setKeyword] = useState(searchParams?.get("q") || "");
  const [searchKeyword, setSearchKeyword] = useState(searchParams?.get("q") || "");
  const [refundStatus, setRefundStatus] = useState<RefundStatusType | "">(
    (searchParams?.get("status") as RefundStatusType) || ""
  );
  const [workTab, setWorkTab] = useState<RefundWorkTab>(() =>
    parseWorkTabFromUrl(searchParams?.get("tab") ?? null)
  );
  const [fromDate, setFromDate] = useState<string>(searchParams?.get("from") || "");
  const [toDate, setToDate] = useState<string>(searchParams?.get("to") || "");

  // -- Pagination --
  const [pageNumber, setPageNumber] = useState(Number(searchParams?.get("page")) || DEFAULT_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState(Number(searchParams?.get("size")) || DEFAULT_PAGE_SIZE);

  // Sync state to URL silently so that "Back" button restores it
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (searchKeyword) { params.set("q", searchKeyword); changed = true; }
    else if (params.has("q")) { params.delete("q"); changed = true; }

    if (refundStatus !== "") { params.set("status", refundStatus); changed = true; }
    else if (params.has("status")) { params.delete("status"); changed = true; }

    if (isOperationalRole(roleName)) {
      if (workTab !== REFUND_WORK_TAB.IN_PROGRESS) {
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
  }, [searchKeyword, refundStatus, workTab, roleName, fromDate, toDate, pageNumber, pageSize]);

  // -- Reload trigger --
  const [reloadToken, setReloadToken] = useState(0);

  // Manual search submission
  const handleSearchSubmit = useCallback(() => {
    setSearchKeyword(keyword.trim());
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, [keyword]);

  // -- Fetch refunds --
  const fetchRefunds = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const queryParams: RefundFilter = {
      page: pageNumber,
      pageSize,
      sortBy: "CreatedAt",
      sortDir: "desc",
      ...(refundStatus !== "" && { refundStatus: refundStatus as RefundStatusType }),
      ...(isOperationalRole(roleName) && { assignmentScope: workTab }),
      ...(searchKeyword && { keyword: searchKeyword }),
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
      ...initialQuery,
    };

    try {
      const response = await refundApi.getAll(queryParams);
      setRefunds(response.items || []);
      setTotalCount(response.totalCount || 0);
    } catch (err: unknown) {
      setError("Failed to load refund list.");
      setRefunds([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, refundStatus, workTab, roleName, searchKeyword, fromDate, toDate, reloadToken, initialQuery]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
  }, []);

  const handleStatusChange = useCallback((value: RefundStatusType | "") => {
    setRefundStatus(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleWorkTabChange = useCallback((tab: RefundWorkTab) => {
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

  const reloadRefunds = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    refunds,
    isLoading,
    error,
    keyword,
    refundStatus,
    workTab,
    fromDate,
    toDate,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    roleName,
    handleKeywordChange,
    handleSearchSubmit,
    handleStatusChange,
    handleWorkTabChange,
    handleFromDateChange,
    handleToDateChange,
    handlePageSizeChange,
    setPageNumber,
    reloadRefunds,
  };
};
