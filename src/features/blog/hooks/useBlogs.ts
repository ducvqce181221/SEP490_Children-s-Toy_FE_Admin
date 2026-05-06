import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { blogApi } from "../services/blog-api";
import {
  ApiErrorResponse,
  BlogListItem,
  BlogSortBy,
  BlogStatus,
  FeaturedFilter,
  PaginatedResponse,
} from "../types/blog";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

export const useBlogs = () => {
  const { account } = useAuthContext();
  const isAdmin = account?.roleName?.toLowerCase() === "admin";
  const isStaff = account?.roleName?.toLowerCase() === "staff";
  const isAuthorizedRole = isAdmin || isStaff;

  const [blogsResponse, setBlogsResponse] = useState<PaginatedResponse<BlogListItem> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BlogStatus | "all">("all");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>("all");
  const [sortBy, setSortBy] = useState<BlogSortBy>("createdat");
  const [sortDesc, setSortDesc] = useState(true);
  const [pageNumber, setPageNumber] = useState(DEFAULT_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!isAuthorizedRole) {
      return;
    }

    let isCancelled = false;

    const fetchBlogs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = {
          pageNumber,
          pageSize,
          sortBy,
          sortDesc,
          searchTerm: debouncedSearchTerm.length > 0 ? debouncedSearchTerm : undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          featuredOnly: featuredFilter === "featured" ? true : undefined,
        };

        const response = isAdmin
          ? await blogApi.getBlogsForAdmin(params)
          : await blogApi.getBlogsForStaff(params);

        if (!isCancelled) {
          setBlogsResponse(response);
        }
      } catch (error) {
        if (!isCancelled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ??
              "Unable to load blogs. Please try again.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchBlogs();

    return () => {
      isCancelled = true;
    };
  }, [
    isAuthorizedRole,
    isAdmin,
    pageNumber,
    pageSize,
    sortBy,
    sortDesc,
    debouncedSearchTerm,
    statusFilter,
    featuredFilter,
    reloadToken,
  ]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleStatusFilterChange = useCallback((value: BlogStatus | "all") => {
    setStatusFilter(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleSortByChange = useCallback((value: BlogSortBy) => {
    setSortBy(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleFeaturedFilterChange = useCallback((value: FeaturedFilter) => {
    setFeaturedFilter(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handleSortDirectionChange = useCallback((value: boolean) => {
    setSortDesc(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSize(value);
    setPageNumber(DEFAULT_PAGE_NUMBER);
  }, []);

  const reloadBlogs = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  const roleLabel = useMemo(() => {
    if (isAdmin) {
      return "Admin";
    }

    if (isStaff) {
      return "Staff";
    }

    return "Unknown";
  }, [isAdmin, isStaff]);

  const effectiveError = isAuthorizedRole
    ? error
    : "You do not have permission to view blog management.";

  return {
    blogs: blogsResponse?.items ?? [],
    isLoading,
    error: effectiveError,
    searchTerm,
    statusFilter,
    featuredFilter,
    sortBy,
    sortDesc,
    pageNumber,
    pageSize,
    totalCount: blogsResponse?.totalCount ?? 0,
    totalPages: blogsResponse?.totalPages ?? 0,
    roleLabel,
    isAdmin,
    isStaff,
    handleSearchChange,
    handleStatusFilterChange,
    handleFeaturedFilterChange,
    handleSortByChange,
    handleSortDirectionChange,
    handlePageSizeChange,
    setPageNumber,
    reloadBlogs,
  };
};
