import { useState, useCallback, useEffect } from "react";
import { Refund } from "../types/refund";
import { refundApi } from "../services/refund-api";

export const useRefundDetail = (refundId: number | null) => {
  const [refundDetail, setRefundDetail] = useState<Refund | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!refundId) {
      setRefundDetail(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await refundApi.getById(refundId);
      setRefundDetail(data);
    } catch (err: unknown) {
      setError("Không thể tải chi tiết hoàn tiền.");
      setRefundDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [refundId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    refundDetail,
    isLoading,
    error,
    refetch: fetchDetail,
  };
};
