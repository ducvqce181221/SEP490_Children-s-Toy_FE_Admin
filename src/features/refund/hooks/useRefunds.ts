import { useState, useCallback, useEffect } from "react";
import { Refund, RefundFilter } from "../types/refund";
import { refundApi } from "../services/refund-api";

export const useRefunds = (initialQuery?: RefundFilter) => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  const [query, setQuery] = useState<RefundFilter>({
    page: 1,
    pageSize: 10,
    sortDir: "desc",
    sortBy: "CreatedAt",
    ...initialQuery,
  });

  const fetchRefunds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await refundApi.getAll(query);
      setRefunds(response.items || []);
      setTotalCount(response.totalCount || 0);
    } catch (err: unknown) {
      setError("Failed to load refund list.");
      setRefunds([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const updateQuery = useCallback((newQuery: Partial<RefundFilter>) => {
    setQuery((prev) => ({
      ...prev,
      ...newQuery,
      // Reset về trang 1 nếu đổi bộ lọc (trừ khi đang đổi chính page)
      page: newQuery.page ?? 1,
    }));
  }, []);

  return {
    refunds,
    isLoading,
    error,
    totalCount,
    query,
    updateQuery,
    refetch: fetchRefunds,
  };
};
