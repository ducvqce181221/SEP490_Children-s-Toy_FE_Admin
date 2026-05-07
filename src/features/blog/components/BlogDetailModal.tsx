"use client";

import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { blogApi } from "../services/blog-api";
import { ApiErrorResponse, BlogDetail } from "../types/blog";

interface BlogDetailModalProps {
  blogPostId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const inputClassName =
  "w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white/90";

const formatDateTime = (dateValue: string | null) => {
  if (!dateValue) return "--";
  const normalized = dateValue.trim();
  const hasTimezone = /z$|[+-]\d{2}:\d{2}$/i.test(normalized);
  const parsedDate = new Date(hasTimezone ? normalized : `${normalized}Z`);
  if (Number.isNaN(parsedDate.getTime())) return "--";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
};

const BlogDetailModal: React.FC<BlogDetailModalProps> = ({
  blogPostId,
  isOpen,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blogDetail, setBlogDetail] = useState<BlogDetail | null>(null);

  useEffect(() => {
    if (!isOpen || !blogPostId) {
      return;
    }

    let isCancelled = false;

    const fetchBlogDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await blogApi.getBlogById(blogPostId);
        if (!isCancelled) {
          setBlogDetail(response);
        }
      } catch (error) {
        if (!isCancelled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          setError(
            axiosError.response?.data?.message ?? "Unable to load blog details.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchBlogDetail();

    return () => {
      isCancelled = true;
    };
  }, [blogPostId, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] max-w-[840px] overflow-y-auto p-5 lg:p-8"
    >
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Blog Detail</h2>
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading blog details...</p>
      )}

      {!isLoading && error && (
        <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </p>
      )}

      {!isLoading && !error && blogDetail && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Thumbnail
            </label>
            <div className="flex min-h-[220px] w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800 sm:min-h-[280px]">
              {blogDetail.blogThumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blogDetail.blogThumbnail}
                  alt={blogDetail.blogTitle}
                  className="h-full max-h-[360px] w-full rounded-md object-contain"
                />
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">No thumbnail</span>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Blog ID</label>
            <input className={`${inputClassName} h-11`} value={blogDetail.blogPostId} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <input className={`${inputClassName} h-11`} value={blogDetail.blogCategoryName} readOnly />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input className={`${inputClassName} h-11`} value={blogDetail.blogTitle} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <input className={`${inputClassName} h-11`} value={blogDetail.status} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Featured</label>
            <input className={`${inputClassName} h-11`} value={blogDetail.isFeatured ? "Yes" : "No"} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Author</label>
            <input className={`${inputClassName} h-11`} value={blogDetail.author} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Created At</label>
            <input className={`${inputClassName} h-11`} value={formatDateTime(blogDetail.createdAt)} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Blog At</label>
            <input className={`${inputClassName} h-11`} value={formatDateTime(blogDetail.blogAt)} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Updated At</label>
            <input className={`${inputClassName} h-11`} value={formatDateTime(blogDetail.updatedAt)} readOnly />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
            <div
              className={`${inputClassName} min-h-[160px] whitespace-normal`}
            >
              <div
                className="ql-editor p-0"
              dangerouslySetInnerHTML={{ __html: blogDetail.blogContent || "<p>--</p>" }}
              />
            </div>
          </div>

          {blogDetail.reason && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
              <textarea
                className={`${inputClassName} min-h-[96px] resize-y`}
                value={blogDetail.reason}
                readOnly
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default BlogDetailModal;
