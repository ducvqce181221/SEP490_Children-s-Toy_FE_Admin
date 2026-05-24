import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Voucher, PaginatedVouchers } from "../types/voucher";
import { voucherApi } from "../services/voucher-api";

export interface VoucherFilters {
  status: string;
}

export const useVouchers = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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

  useEffect(() => {
    const vid = searchParams.get("voucherId");
    const vcode = searchParams.get("voucherCode");
    
    if (vid) {
      const fetchAndOpenVoucher = async () => {
        try {
          const v = await voucherApi.getVoucherById(Number(vid));
          setViewVoucher(v);
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.delete("voucherId");
          router.replace(`${pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`, { scroll: false });
        } catch (err) {
          console.error("Failed to load voucher detail from URL", err);
        }
      };
      fetchAndOpenVoucher();
    } else if (vcode) {
      const fetchAndOpenVoucherByCode = async () => {
        try {
          const res = await voucherApi.getVouchers(1, 10, undefined, false, vcode);
          const v = res.items.find((item) => item.voucherCode.toLowerCase() === vcode.toLowerCase());
          if (v) {
            setViewVoucher(v);
          } else if (res.items.length > 0) {
            setViewVoucher(res.items[0]);
          }
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.delete("voucherCode");
          router.replace(`${pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`, { scroll: false });
        } catch (err) {
          console.error("Failed to load voucher detail by code from URL", err);
        }
      };
      fetchAndOpenVoucherByCode();
    }
  }, [searchParams, pathname, router]);

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
