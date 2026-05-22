import { useState, useCallback, useEffect } from "react";
import { ReviewDetail } from "../types/review";
import { reviewApi } from "../services/review-api";

export const useReviewDetail = (reviewId: number | null) => {
  const [reviewDetail, setReviewDetail] = useState<ReviewDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!reviewId) {
      setReviewDetail(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await reviewApi.getById(reviewId);
      setReviewDetail(data);
    } catch (err: unknown) {
      setError("Failed to load review details.");
      setReviewDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    reviewDetail,
    isLoading,
    error,
    refetch: fetchDetail,
  };
};
