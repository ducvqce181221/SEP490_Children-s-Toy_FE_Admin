import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { promotionApi } from "../services/promotion-api";
import { PromotionListDto, Promotion, PaginatedResponse, ApiErrorResponse } from "../types/promotion";
import { AxiosError } from "axios";

export interface PromotionFilters {
  status: string;
}

export const usePromotions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<PromotionFilters>({ status: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy] = useState<string | undefined>(undefined);
  const [sortDesc] = useState(false);

  const [deletePromotion, setDeletePromotion] = useState<PromotionListDto | null>(null);

  const [data, setData] = useState<PaginatedResponse<PromotionListDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await promotionApi.getAll({
        pageNumber: currentPage,
        pageSize: itemsPerPage,
        sortBy,
        sortDesc,
        searchTerm: searchQuery || undefined,
        status: filters.status || undefined
      }) as unknown as PaginatedResponse<PromotionListDto>;
      setData(response);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message || axiosError.message || "Failed to load promotion list";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, sortDesc, searchQuery, filters.status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilters = (newFilters: PromotionFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleItemsPerPage = (n: number) => {
    setItemsPerPage(n);
    setCurrentPage(1);
  };

  return {
    searchQuery,
    filters,
    handleSearch,      
    handleFilters,     
    handleItemsPerPage,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    deletePromotion,
    setDeletePromotion,
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};

export const usePromotionDetail = (id?: number) => {
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const fetchPromotion = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await promotionApi.getById(id) as unknown as Promotion;
        if (!cancelled) setPromotion(response);
      } catch (err: unknown) {
        if (!cancelled) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          const message = axiosError.response?.data?.message || axiosError.message || "Failed to load promotion info";
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPromotion();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { promotion, isLoading, error };
};
