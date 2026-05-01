import { useState, useEffect, useCallback } from "react";
import { CampaignListItem } from "../types/campaign";
import { campaignApi, PaginatedCampaigns } from "../services/campaign-api";

export interface CampaignFilters {
  status: string;
  sourceType: string;
}

export const useCampaigns = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<CampaignFilters>({ status: "", sourceType: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy] = useState<string | undefined>(undefined);
  const [sortDesc] = useState(false);

  // Store only IDs for modal; full data fetched lazily inside modal
  const [viewCampaignId, setViewCampaignId] = useState<number | null>(null);
  const [editCampaignId, setEditCampaignId] = useState<number | null>(null);

  const [data, setData] = useState<PaginatedCampaigns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await campaignApi.getCampaigns(
        currentPage,
        itemsPerPage,
        sortBy,
        sortDesc,
        searchQuery || undefined,
        filters.status || undefined,
        filters.sourceType || undefined
      );
      setData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tải dữ liệu thất bại";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, sortDesc, searchQuery, filters.status, filters.sourceType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    isModalOpen,
    setIsModalOpen,
    searchQuery,
    filters,
    handleSearch,
    handleFilters,
    handleItemsPerPage,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    viewCampaignId,
    setViewCampaignId,
    editCampaignId,
    setEditCampaignId,
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};
