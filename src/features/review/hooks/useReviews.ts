import { useState, useCallback, useEffect } from "react";
import { Review, ReviewQuery } from "../types/review";
import { reviewApi } from "../services/review-api";

export const useReviews = (initialQuery?: ReviewQuery) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  const [query, setQuery] = useState<ReviewQuery>({
    pageNumber: 1,
    pageSize: 10,
    sortDesc: true,
    sortBy: "CreatedAt",
    ...initialQuery,
  });

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reviewApi.getAll(query);
      setReviews(response.items || []);
      setTotalCount(response.totalCount || 0);
    } catch (err: unknown) {
      setError("Không thể tải danh sách đánh giá.");
      setReviews([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const updateQuery = useCallback((newQuery: Partial<ReviewQuery>) => {
    setQuery((prev) => ({
      ...prev,
      ...newQuery,
      // Reset về trang 1 nếu đổi bộ lọc (trừ khi đang đổi chính pageNumber)
      pageNumber: newQuery.pageNumber ?? 1,
    }));
  }, []);

  return {
    reviews,
    isLoading,
    error,
    totalCount,
    query,
    updateQuery,
    refetch: fetchReviews,
  };
};
