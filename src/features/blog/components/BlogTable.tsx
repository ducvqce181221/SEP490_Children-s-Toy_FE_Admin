"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Pagination from "@/components/common/Pagination";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useBlogMutations } from "../hooks/useBlogMutations";
import { useBlogs } from "../hooks/useBlogs";
import { CreateBlogRequest, UpdateBlogRequest } from "../types/blog";
import BlogApprovalModal from "./BlogApprovalModal";
import BlogDetailModal from "./BlogDetailModal";
import BlogFormModal from "./BlogFormModal";
import { BlogRow } from "./BlogRow";
import BlogThumbnailPreviewModal from "./BlogThumbnailPreviewModal";
import BlogToolbar from "./BlogToolbar";

const headerCellClassName =
  "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";

const pageSizeOptions = [5, 10, 20, 50];

const footerSelectClassName =
  "h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

const BlogTable = () => {
  const {
    blogs,
    isLoading,
    error,
    searchTerm,
    statusFilter,
    featuredFilter,
    sortBy,
    sortDesc,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
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
  } = useBlogs();

  const {
    createBlog,
    updateBlog,
    submitBlog,
    approveBlog,
    publishNow,
    hideBlog,
    isCreating,
    isUpdating,
    isSubmittingBlog,
    isApproving,
    isPublishingNow,
    isHidingBlog,
  } = useBlogMutations(reloadBlogs);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetailBlogId, setSelectedDetailBlogId] = useState<number | null>(null);
  const [selectedEditBlogId, setSelectedEditBlogId] = useState<number | null>(null);
  const [selectedApprovalBlogId, setSelectedApprovalBlogId] = useState<number | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<{
    imageUrl: string;
    title: string;
  } | null>(null);
  const [hideTarget, setHideTarget] = useState<{ blogPostId: number; blogTitle: string } | null>(
    null,
  );

  const pageRangeText = useMemo(() => {
    if (totalCount === 0) {
      return "No data available";
    }

    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);

    return `Showing ${start} - ${end} / ${totalCount} blogs`;
  }, [pageNumber, pageSize, totalCount]);

  const hasBlogs = blogs.length > 0;
  const showInitialLoading = isLoading && !hasBlogs;
  const showRefreshing = isLoading && hasBlogs;

  const handleCreateBlog = async (payload: CreateBlogRequest) => {
    const result = await createBlog(payload);

    if (result.success) {
      toast.success(result.message);
      setIsCreateModalOpen(false);
      return result;
    }

    if (!result.validationErrors) {
      toast.error(result.message);
    }

    return result;
  };

  const handleUpdateBlog = async (blogPostId: number, payload: UpdateBlogRequest) => {
    const result = await updateBlog(blogPostId, payload);

    if (result.success) {
      toast.success(result.message);
      setSelectedEditBlogId(null);
      return result;
    }

    if (!result.validationErrors) {
      toast.error(result.message);
    }

    return result;
  };

  const handleSubmitBlog = async (blogPostId: number) => {
    const result = await submitBlog(blogPostId);

    if (result.success) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  };

  const handleApprove = async () => {
    if (!selectedApprovalBlogId) {
      return;
    }

    const result = await approveBlog(selectedApprovalBlogId, "Approved");
    if (result.success) {
      toast.success(result.message);
      setSelectedApprovalBlogId(null);
      return;
    }

    toast.error(result.message);
  };

  const handleReject = async (reason: string) => {
    if (!selectedApprovalBlogId) {
      return;
    }

    const result = await approveBlog(selectedApprovalBlogId, "Rejected", reason);
    if (result.success) {
      toast.success(result.message);
      setSelectedApprovalBlogId(null);
      return;
    }

    toast.error(result.message);
  };

  const handlePublishNow = async (blogPostId: number) => {
    const result = await publishNow(blogPostId);

    if (result.success) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  };

  const handleHideBlog = async (blogPostId: number, blogTitle: string) => {
    setHideTarget({ blogPostId, blogTitle });
  };

  const handleHideBlogByStaff = async (blogPostId: number) => {
    const result = await hideBlog(blogPostId);

    if (result.success) {
      toast.success(result.message);
      setSelectedEditBlogId(null);
      return;
    }

    toast.error(result.message);
  };

  const handleConfirmHideBlog = async () => {
    if (!hideTarget) {
      return;
    }

    const { blogPostId } = hideTarget;
    const result = await hideBlog(blogPostId);

    if (result.success) {
      toast.success(result.message);
      setHideTarget(null);
      return;
    }

    toast.error(result.message);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <BlogToolbar
        roleLabel={roleLabel}
        canAdd={isStaff}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        featuredFilter={featuredFilter}
        sortBy={sortBy}
        sortDesc={sortDesc}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onFeaturedFilterChange={handleFeaturedFilterChange}
        onSortByChange={handleSortByChange}
        onSortDirectionChange={handleSortDirectionChange}
        onAddClick={() => setIsCreateModalOpen(true)}
      />

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[980px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={headerCellClassName}>#</TableCell>
                <TableCell isHeader className={headerCellClassName}>Blog</TableCell>
                <TableCell isHeader className={headerCellClassName}>Status</TableCell>
                <TableCell isHeader className={headerCellClassName}>Featured</TableCell>
                <TableCell isHeader className={headerCellClassName}>Blog At</TableCell>
                <TableCell isHeader className={headerCellClassName}>Created At</TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {showInitialLoading && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading blog list...
                  </TableCell>
                </TableRow>
              )}

              {!showInitialLoading && error && (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-error-600">
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!showInitialLoading && !error && blogs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No matching blogs found.
                  </TableCell>
                </TableRow>
              )}

              {!error &&
                blogs.length > 0 &&
                blogs.map((blog, index) => (
                  <BlogRow
                    key={blog.blogPostId}
                    blog={blog}
                    rowNumber={(pageNumber - 1) * pageSize + index + 1}
                    isAdmin={isAdmin}
                    isStaff={isStaff}
                    isSubmitting={isSubmittingBlog}
                    isPublishingNow={isPublishingNow}
                    isHidingBlog={isHidingBlog}
                    onOpenDetail={setSelectedDetailBlogId}
                    onOpenEdit={setSelectedEditBlogId}
                    onSubmitBlog={handleSubmitBlog}
                    onOpenApproval={setSelectedApprovalBlogId}
                    onPublishNow={handlePublishNow}
                    onHideBlog={handleHideBlog}
                    onOpenThumbnailPreview={(imageUrl, title) =>
                      setThumbnailPreview({ imageUrl, title })
                    }
                  />
                ))}
            </TableBody>
          </Table>
          {showRefreshing && (
            <div className="border-t border-gray-100 px-5 py-2 text-right text-xs text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
              Updating table...
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center dark:border-white/[0.05]">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{pageRangeText}</span>
          <label htmlFor="blog-page-size" className="font-medium">
            Rows per page
          </label>
          <select
            id="blog-page-size"
            className={footerSelectClassName}
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {totalPages > 0 && (
          <Pagination
            currentPage={pageNumber}
            totalPages={totalPages}
            onPageChange={setPageNumber}
          />
        )}
      </div>

      {isStaff && (
        <BlogFormModal
          isOpen={isCreateModalOpen}
          mode="create"
          isSubmitting={isCreating}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateBlog}
          onUpdate={handleUpdateBlog}
        />
      )}

      <BlogDetailModal
        blogPostId={selectedDetailBlogId}
        isOpen={selectedDetailBlogId !== null}
        onClose={() => setSelectedDetailBlogId(null)}
      />

      {isStaff && (
        <BlogFormModal
          isOpen={selectedEditBlogId !== null}
          mode="edit"
          blogPostId={selectedEditBlogId}
          isSubmitting={isUpdating}
          isHidingBlog={isHidingBlog}
          onClose={() => setSelectedEditBlogId(null)}
          onCreate={handleCreateBlog}
          onUpdate={handleUpdateBlog}
          onHideBlog={handleHideBlogByStaff}
        />
      )}

      {isAdmin && (
        <BlogApprovalModal
          isOpen={selectedApprovalBlogId !== null}
          isSubmitting={isApproving}
          onClose={() => setSelectedApprovalBlogId(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      <BlogThumbnailPreviewModal
        isOpen={thumbnailPreview !== null}
        imageUrl={thumbnailPreview?.imageUrl ?? null}
        title={thumbnailPreview?.title ?? "Thumbnail"}
        onClose={() => setThumbnailPreview(null)}
      />

      <Modal
        isOpen={hideTarget !== null}
        onClose={() => setHideTarget(null)}
        className="max-w-[520px] p-6 lg:p-7"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Confirm Hide Blog
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>Are you sure you want to hide this blog?</p>
            <p>This blog will no longer be visible to customers.</p>
            {hideTarget?.blogTitle && (
              <p className="font-medium text-gray-800 dark:text-white/90">
                Title: {hideTarget.blogTitle}
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setHideTarget(null)}
              disabled={isHidingBlog}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmHideBlog}
              disabled={isHidingBlog}
            >
              {isHidingBlog ? "Hiding..." : "Confirm Hide"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BlogTable;
