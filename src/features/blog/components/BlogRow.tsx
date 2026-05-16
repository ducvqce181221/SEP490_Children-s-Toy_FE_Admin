"use client";

import React, { memo } from "react";
import Badge from "@/components/ui/badge/Badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { CheckLineIcon, EyeCloseIcon, EyeIcon, PencilIcon } from "@/icons/index";
import { BlogListItem } from "../types/blog";

interface BlogRowProps {
  blog: BlogListItem;
  rowNumber: number;
  isAdmin: boolean;
  isStaff: boolean;
  currentAccountId: number | null;
  isSubmitting: boolean;
  isPublishingNow: boolean;
  isHidingBlog: boolean;
  onOpenDetail: (blogPostId: number) => void;
  onOpenEdit: (blogPostId: number) => void;
  onSubmitBlog: (blog: BlogListItem) => void;
  onOpenApproval: (blogPostId: number) => void;
  onPublishNow: (blogPostId: number) => void;
  onHideBlog: (blogPostId: number, blogTitle: string) => void;
  onOpenThumbnailPreview: (imageUrl: string, title: string) => void;
}

const formatDateTime = (dateValue: string | null) => {
  if (!dateValue) {
    return "--";
  }

  const normalized = dateValue.trim();
  const hasTimezone = /z$|[+-]\d{2}:\d{2}$/i.test(normalized);
  const parsedDate = new Date(hasTimezone ? normalized : `${normalized}Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
};

const getStatusColor = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "published" || normalized === "scheduled") return "success";
  if (normalized === "pending" || normalized === "approved") return "warning";
  if (normalized === "rejected") return "error";
  return "light";
};

const BlogRowComponent: React.FC<BlogRowProps> = ({
  blog,
  rowNumber,
  isAdmin,
  isStaff,
  currentAccountId,
  isSubmitting,
  isPublishingNow,
  isHidingBlog,
  onOpenDetail,
  onOpenEdit,
  onSubmitBlog,
  onOpenApproval,
  onPublishNow,
  onHideBlog,
  onOpenThumbnailPreview,
}) => {
  const canEdit = isStaff || isAdmin;
  const isOwnBlog = currentAccountId !== null && blog.accountId === currentAccountId;
  const canSubmitDraft = (isStaff || isAdmin) && isOwnBlog && blog.status.toLowerCase() === "draft";
  const canAdminApprove = isAdmin && blog.status.toLowerCase() === "pending";
  const canPublishNow =
    isAdmin &&
    (blog.status.toLowerCase() === "approved" || blog.status.toLowerCase() === "scheduled");
  const canAdminHideBlog = isAdmin && blog.status.toLowerCase() !== "hidden";

  return (
    <TableRow>
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {rowNumber}
      </TableCell>

      <TableCell className="px-5 py-4 text-start sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-xs font-semibold text-gray-700 transition hover:ring-2 hover:ring-brand-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:ring-brand-700"
            onClick={() =>
              blog.blogThumbnail
                ? onOpenThumbnailPreview(blog.blogThumbnail, blog.blogTitle)
                : undefined
            }
            disabled={!blog.blogThumbnail}
            aria-label={`Preview thumbnail for ${blog.blogTitle}`}
          >
            {blog.blogThumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={blog.blogThumbnail}
                alt={blog.blogTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              "BLOG"
            )}
          </button>
          <div className="min-w-0 max-w-[320px]">
            <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">
              {blog.blogTitle}
            </p>
            <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
              Author: {blog.author}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell className="px-5 py-4 text-start">
        <Badge size="sm" color={getStatusColor(blog.status)}>
          {blog.status}
        </Badge>
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {blog.isFeatured ? "Yes" : "No"}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {formatDateTime(blog.blogAt)}
      </TableCell>

      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {formatDateTime(blog.createdAt)}
      </TableCell>

      <TableCell className="px-5 py-4 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(blog.blogPostId)}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            aria-label={`View blog details for ${blog.blogTitle}`}
          >
            <EyeIcon />
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => onOpenEdit(blog.blogPostId)}
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
              aria-label={`Edit blog ${blog.blogTitle}`}
            >
              <PencilIcon />
            </button>
          )}

          {canSubmitDraft && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onSubmitBlog(blog)}
              className="rounded-lg border border-success-300 p-2 text-success-600 transition-colors hover:border-success-500 hover:text-success-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-success-700 dark:text-success-400"
              aria-label={`Submit blog ${blog.blogTitle}`}
            >
              <CheckLineIcon />
            </button>
          )}

          {canAdminApprove && (
            <button
              type="button"
              onClick={() => onOpenApproval(blog.blogPostId)}
              className="rounded-lg border border-warning-300 p-2 text-warning-600 transition-colors hover:border-warning-500 hover:text-warning-700 dark:border-warning-700 dark:text-warning-400"
              aria-label={`Approve blog ${blog.blogTitle}`}
            >
              <CheckLineIcon />
            </button>
          )}

          {canPublishNow && (
            <button
              type="button"
              disabled={isPublishingNow}
              onClick={() => onPublishNow(blog.blogPostId)}
              className="rounded-lg border border-brand-300 p-2 text-brand-600 transition-colors hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-700 dark:text-brand-400"
              aria-label={`Publish blog ${blog.blogTitle} now`}
            >
              <CheckLineIcon />
            </button>
          )}

          {canAdminHideBlog && (
            <button
              type="button"
              disabled={isHidingBlog}
              onClick={() => onHideBlog(blog.blogPostId, blog.blogTitle)}
              className="rounded-lg border border-error-300 p-2 text-error-600 transition-colors hover:border-error-500 hover:text-error-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-error-700 dark:text-error-400"
              aria-label={`Hide blog ${blog.blogTitle}`}
              title="Hide Blog"
            >
              <EyeCloseIcon />
            </button>
          )}

        </div>
      </TableCell>
    </TableRow>
  );
};

export const BlogRow = memo(BlogRowComponent);
