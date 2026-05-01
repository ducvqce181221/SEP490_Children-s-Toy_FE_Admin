import { useState, useEffect, useCallback } from "react";
import { Template, PaginatedTemplates } from "../types/template";
import { templateApi } from "../services/template-api";

export interface TemplateFilters {
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export const useTemplates = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<TemplateFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy] = useState<string | undefined>(undefined);
  const [sortDesc] = useState(false);

  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [viewTemplate, setViewTemplate] = useState<Template | null>(null);

  const [data, setData] = useState<PaginatedTemplates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await templateApi.getTemplates(
        currentPage,
        itemsPerPage,
        sortBy,
        sortDesc,
        searchQuery || undefined,
        filters.isActive,
        filters.startDate || undefined,
        filters.endDate || undefined
      );
      setData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tải dữ liệu thất bại";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, sortDesc, searchQuery, filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilters = (newFilters: TemplateFilters) => {
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
    editTemplate,
    setEditTemplate,
    viewTemplate,
    setViewTemplate,
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};
