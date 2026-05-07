import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { campaignApi, PaginatedCampaigns } from "../services/campaign-api";
import type { CampaignFilters } from "../types/campaign";

export type { CampaignFilters };

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_SORT_BY = undefined;
const DEFAULT_SORT_DESC = false;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCampaigns = () => {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewCampaignId, setViewCampaignId] = useState<number | null>(null);
  const [editCampaignId, setEditCampaignId] = useState<number | null>(null);

  // ── Filter / pagination state ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<CampaignFilters>({ status: "", sourceType: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ── Data state ────────────────────────────────────────────────────────────
  const [data, setData] = useState<PaginatedCampaigns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await campaignApi.getCampaigns(
        currentPage,
        itemsPerPage,
        DEFAULT_SORT_BY,
        DEFAULT_SORT_DESC,
        searchQuery || undefined,
        filters.status || undefined,
        filters.sourceType || undefined,
      );
      setData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tải dữ liệu thất bại.";
      setError(message);
      // FIX: toast để user biết fetch lỗi
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, filters.status, filters.sourceType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Reset về trang 1 khi thay đổi search/filter/pageSize
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilters = (newFilters: CampaignFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleItemsPerPage = (n: number) => {
    setItemsPerPage(n);
    setCurrentPage(1);
  };

  return {
    // UI
    isModalOpen,
    setIsModalOpen,
    viewCampaignId,
    setViewCampaignId,
    editCampaignId,
    setEditCampaignId,
    // Filters & pagination
    searchQuery,
    filters,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    handleSearch,
    handleFilters,
    handleItemsPerPage,
    // Data
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};