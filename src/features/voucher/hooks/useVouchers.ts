import { useState, useEffect, useCallback } from "react";
import { Voucher, PaginatedVouchers } from "../types/voucher";
import { voucherApi } from "../services/voucher-api";

export interface VoucherFilters {
  status: string;
}

export const useVouchers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<VoucherFilters>({ status: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy] = useState<string | undefined>(undefined);
  const [sortDesc] = useState(false);

  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [viewVoucher, setViewVoucher] = useState<Voucher | null>(null);
  const [deleteVoucher, setDeleteVoucher] = useState<Voucher | null>(null);

  const [data, setData] = useState<PaginatedVouchers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await voucherApi.getVouchers(
        currentPage,
        itemsPerPage,
        sortBy,
        sortDesc,
        searchQuery || undefined,
        filters.status || undefined
      );
      setData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      setError(message);
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

  const handleFilters = (newFilters: VoucherFilters) => {
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
    editVoucher,
    setEditVoucher,
    viewVoucher,
    setViewVoucher,
    deleteVoucher,
    setDeleteVoucher,
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};
