"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { blogApi } from "../services/blog-api";
import { BlogFormValues, blogFormSchema } from "../types/blog.schema";
import {
  ApiErrorResponse,
  CreateBlogRequest,
  CreateOrUpdateBlogResult,
  UpdateBlogRequest,
} from "../types/blog";

interface BlogFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  blogPostId?: number | null;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (payload: CreateBlogRequest) => Promise<CreateOrUpdateBlogResult>;
  onUpdate: (
    blogPostId: number,
    payload: UpdateBlogRequest,
  ) => Promise<CreateOrUpdateBlogResult>;
}

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const defaultValues: BlogFormValues = {
  blogCategoryId: 1,
  blogTitle: "",
  blogContent: "",
  blogThumbnail: "",
  isFeatured: false,
  blogAt: "",
};

const toDateTimeLocal = (dateValue: string | null) => {
  if (!dateValue) {
    return "";
  }

  const normalized = dateValue.trim();
  if (normalized.length === 0) {
    return "";
  }

  // If backend returns a naive datetime, interpret it as UTC.
  const hasTimezone = /z$|[+-]\d{2}:\d{2}$/i.test(normalized);
  const date = new Date(hasTimezone ? normalized : `${normalized}Z`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const toApiDateTime = (dateValue?: string) => {
  if (!dateValue || dateValue.trim().length === 0) {
    return null;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  // Send UTC ISO string so backend persists a normalized UTC timestamp.
  return parsed.toISOString();
};

const BlogFormModal: React.FC<BlogFormModalProps> = ({
  isOpen,
  mode,
  blogPostId,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues,
  });
  const currentThumbnail = useWatch({ control, name: "blogThumbnail" });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "create") {
      reset(defaultValues);
      return;
    }

    if (!blogPostId) {
      return;
    }

    let isCancelled = false;

    const fetchBlogDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const detail = await blogApi.getBlogById(blogPostId);
        if (!isCancelled) {
          const thumbnailValue = detail.blogThumbnail ?? "";
          reset({
            blogCategoryId: detail.blogCategoryId,
            blogTitle: detail.blogTitle,
            blogContent: detail.blogContent,
            blogThumbnail: thumbnailValue,
            isFeatured: detail.isFeatured,
            blogAt: toDateTimeLocal(detail.blogAt),
          });
        }
      } catch (error) {
        if (!isCancelled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          setFormError(
            axiosError.response?.data?.message ?? "Unable to load blog details.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDetail(false);
        }
      }
    };

    fetchBlogDetail();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, mode, blogPostId, reset]);

  const handleThumbnailFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setFormError(null);
    setIsUploadingThumbnail(true);

    blogApi
      .uploadThumbnail(selectedFile)
      .then((response) => {
        setValue("blogThumbnail", response.url, { shouldValidate: true });
      })
      .catch((error) => {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const serverMessage =
          typeof axiosError.response?.data === "object" &&
          axiosError.response?.data &&
          "message" in axiosError.response.data
            ? (axiosError.response.data.message as string)
            : null;
        setFormError(
          serverMessage ??
            `Unable to upload thumbnail. Please try again.${axiosError.response?.status ? ` (HTTP ${axiosError.response.status})` : ""}`,
        );
      })
      .finally(() => {
        setIsUploadingThumbnail(false);
      });
  };

  const handleFormSubmit = async (values: BlogFormValues) => {
    setFormError(null);

    const basePayload = {
      blogCategoryId: Number(values.blogCategoryId),
      blogTitle: values.blogTitle.trim(),
      blogContent: values.blogContent.trim(),
      blogThumbnail: values.blogThumbnail.trim() === "" ? null : values.blogThumbnail.trim(),
      isFeatured: values.isFeatured,
      blogAt: toApiDateTime(values.blogAt),
    };

    let result: CreateOrUpdateBlogResult;

    if (mode === "create") {
      result = await onCreate(basePayload);
    } else {
      if (!blogPostId) {
        setFormError("Invalid blog ID.");
        return;
      }

      const payload: UpdateBlogRequest = {
        ...basePayload,
      };
      result = await onUpdate(blogPostId, payload);
    }

    if (!result.success) {
      if (result.validationErrors) {
        Object.entries(result.validationErrors).forEach(([field, messages]) => {
          const lowerField = field.toLowerCase();
          if (messages.length === 0) {
            return;
          }

          if (lowerField === "blogcategoryid") {
            setError("blogCategoryId", { type: "server", message: messages[0] });
          } else if (lowerField === "blogtitle") {
            setError("blogTitle", { type: "server", message: messages[0] });
          } else if (lowerField === "blogcontent") {
            setError("blogContent", { type: "server", message: messages[0] });
          } else if (lowerField === "blogthumbnail") {
            setError("blogThumbnail", { type: "server", message: messages[0] });
          } else if (lowerField === "blogat") {
            setError("blogAt", { type: "server", message: messages[0] });
          }
        });
        return;
      }

      setFormError(result.message);
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] max-w-[760px] overflow-y-auto p-5 lg:p-8"
    >
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Add New Blog" : "Edit Blog"}
        </h2>
      </div>

      {isLoadingDetail ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading blog data...</p>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(handleFormSubmit)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blog Category ID
            </label>
            <input type="number" className={inputClassName} {...register("blogCategoryId")} />
            {errors.blogCategoryId?.message && (
              <p className="mt-1 text-sm text-error-600">{errors.blogCategoryId.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blog Title
            </label>
            <input type="text" className={inputClassName} {...register("blogTitle")} />
            {errors.blogTitle?.message && (
              <p className="mt-1 text-sm text-error-600">{errors.blogTitle.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blog Content
            </label>
            <textarea
              rows={6}
              className={`${inputClassName} h-auto min-h-[140px] resize-y`}
              {...register("blogContent")}
            />
            {errors.blogContent?.message && (
              <p className="mt-1 text-sm text-error-600">{errors.blogContent.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Thumbnail (Local File)
            </label>
            <input
              type="file"
              accept="image/*"
              className={`${inputClassName} h-auto cursor-pointer py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-600 hover:file:bg-brand-100 dark:file:bg-brand-500/15 dark:file:text-brand-300`}
              onChange={handleThumbnailFileChange}
              disabled={isUploadingThumbnail}
            />
            <input type="hidden" {...register("blogThumbnail")} />
            {currentThumbnail && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Thumbnail URL: {currentThumbnail}
              </p>
            )}
            {isUploadingThumbnail && (
              <p className="mt-2 text-xs text-brand-600 dark:text-brand-400">
                Uploading thumbnail...
              </p>
            )}
            {currentThumbnail && (
              <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentThumbnail}
                  alt="Thumbnail preview"
                  className="h-36 w-full object-cover"
                />
              </div>
            )}
            {errors.blogThumbnail?.message && (
              <p className="mt-1 text-sm text-error-600">{errors.blogThumbnail.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Blog At (schedule)
              </label>
              <input type="datetime-local" className={inputClassName} {...register("blogAt")} />
              {errors.blogAt?.message && (
                <p className="mt-1 text-sm text-error-600">{errors.blogAt.message}</p>
              )}
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input type="checkbox" className="h-4 w-4" {...register("isFeatured")} />
                Mark as featured
              </label>
            </div>
          </div>

          {mode === "edit" && (
            <p className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
              Keep Blog At in future when blog has been approved, so backend can move it to Scheduled.
            </p>
          )}

          {formError && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
              {formError}
            </p>
          )}

          <div className="mt-3 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || isUploadingThumbnail}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Blog" : "Save Blog"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default BlogFormModal;
