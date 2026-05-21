"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { PencilIcon } from "@/icons";
import { blogApi } from "../services/blog-api";
import { BlogReviewPermission } from "../types/blog";

const headerCellClassName = "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";

const toDateTimeText = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  return parts.slice(-2).map((part) => part[0]?.toUpperCase() ?? "").join("");
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
  ) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback;
  }

  return fallback;
};

export function BlogReviewPermissionManagement() {
  const [items, setItems] = useState<BlogReviewPermission[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<BlogReviewPermission | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await blogApi.getBlogReviewPermissions({
        pageNumber,
        pageSize,
        searchTerm: submittedSearch || undefined,
      });
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load locked blog comment accounts."));
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, submittedSearch]);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  const pageRangeText = useMemo(() => {
    if (totalCount === 0) return "No locked accounts";
    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);
    return `Showing ${start} - ${end} / ${totalCount} locked accounts`;
  }, [pageNumber, pageSize, totalCount]);

  const handleSearchSubmit = () => {
    setSubmittedSearch(searchTerm.trim());
    setPageNumber(1);
  };

  const restorePermission = async () => {
    if (!editTarget) return;

    setIsSubmitting(true);
    try {
      await blogApi.updateBlogReviewPermission(editTarget.accountId, {
        isCommentBanned: false,
      });
      toast.success("Blog comment permission restored.");
      setEditTarget(null);
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Cannot restore blog comment permission."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white text-black dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-white">
      <div className="px-5 py-5 sm:px-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Blog Review Permissions</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View, search, and restore accounts locked from blog comments.</p>
        </div>
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            onKeyDown={(event) => event.key === "Enter" && handleSearchSubmit()}
            placeholder="Search account, email, ID... (Enter)"
          />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[1040px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={headerCellClassName}>#</TableCell>
                <TableCell isHeader className={headerCellClassName}>Account</TableCell>
                <TableCell isHeader className={headerCellClassName}>Email</TableCell>
                <TableCell isHeader className={headerCellClassName}>Violations</TableCell>
                <TableCell isHeader className={headerCellClassName}>Status</TableCell>
                <TableCell isHeader className={headerCellClassName}>Banned At</TableCell>
                <TableCell isHeader className={headerCellClassName}>Expires At</TableCell>
                <TableCell isHeader className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading locked accounts...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No locked review accounts found.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && items.map((item, index) => (
                <TableRow key={item.accountId}>
                  <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {(pageNumber - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                        {getInitials(item.accountName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90" title={item.accountName}>{item.accountName}</p>
                        <p className="text-xs text-gray-500">ID: {item.accountId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{item.email}</TableCell>
                  <TableCell className="px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-200">{item.violationCount}</TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color="error">Comment Banned</Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{toDateTimeText(item.bannedAt)}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{toDateTimeText(item.banExpiresAt)}</TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setEditTarget(item)}
                        className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
                        aria-label={`Edit blog review permission for ${item.accountName}`}
                        title="Edit permission"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} className="max-w-[560px] p-5 lg:p-6">
        <div className="space-y-5">
          <div>
            <h4 className="text-base font-semibold text-black dark:text-white">Edit Blog Review Permission</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{editTarget?.accountName} will be able to comment on blogs again.</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">Comment permission</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Current status: locked</p>
              </div>
              <Badge size="sm" color="success">Restore</Badge>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditTarget(null)} disabled={isSubmitting}>Cancel</Button>
            <Button size="sm" onClick={() => void restorePermission()} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Restore Permission"}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center dark:border-white/[0.05]">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{pageRangeText}</span>
          <label htmlFor="blog-review-permission-page-size" className="font-medium">Rows per page</label>
          <select
            id="blog-review-permission-page-size"
            className="rounded-md border border-gray-300 px-2 py-1 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageNumber(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        {totalPages > 0 && <Pagination currentPage={pageNumber} totalPages={totalPages} onPageChange={setPageNumber} />}
      </div>
    </div>
  );
}
