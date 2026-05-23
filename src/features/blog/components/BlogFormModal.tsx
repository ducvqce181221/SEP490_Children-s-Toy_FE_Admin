"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type Quill from "quill";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { blogApi } from "../services/blog-api";
import { BlogFormValues, BlogFormInput, blogFormSchema } from "../types/blog.schema";
import {
  ApiErrorResponse,
  BlogCategoryItem,
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
  onOpenAiModal?: (blogPostId: number, title: string, blogContent: string) => void;
  onHideBlog?: (blogPostId: number) => Promise<void>;
  isHidingBlog?: boolean;
}

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const defaultValues: BlogFormInput = {
  blogCategoryId: 0,
  blogTitle: "",
  blogContent: "",
  blogThumbnail: "",
  blogAt: "",
};
const allowedThumbnailMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedThumbnailExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const decodeHtmlEntities = (value: string) => {
  if (typeof window === "undefined") {
    return value;
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const normalizeIncomingBlogContent = (rawValue: unknown) => {
  if (typeof rawValue !== "string") {
    return "";
  }

  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return "";
  }

  // Some legacy records may store escaped HTML.
  if (trimmed.includes("&lt;") && trimmed.includes("&gt;")) {
    return decodeHtmlEntities(trimmed);
  }

  return trimmed;
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
  onOpenAiModal,
  onHideBlog,
  isHidingBlog = false,
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const [blogCategories, setBlogCategories] = useState<BlogCategoryItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isHideConfirmOpen, setIsHideConfirmOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const pendingContentRef = useRef("");
  const isApplyingContentRef = useRef(false);
  const toolbarId = `blog-content-toolbar-${useId().replace(/:/g, "")}`;
  const isEditLoading = mode === "edit" && isLoadingDetail;

  const resetQuillEditor = useCallback(() => {
    quillRef.current = null;
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  }, []);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<BlogFormInput, unknown, BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues,
  });
  const currentThumbnail = useWatch({ control, name: "blogThumbnail" });

  const setQuillContent = useCallback(
    (html: string) => {
      const normalizedContent = normalizeIncomingBlogContent(html);

      if (!quillRef.current) {
        pendingContentRef.current = normalizedContent;
        return;
      }

      isApplyingContentRef.current = true;
      if (normalizedContent.length === 0) {
        quillRef.current.setText("", "api");
      } else {
        const delta = quillRef.current.clipboard.convert({ html: normalizedContent });
        quillRef.current.setContents(delta, "api");
      }
      setValue("blogContent", quillRef.current.root.innerHTML, { shouldValidate: true });
      queueMicrotask(() => {
        isApplyingContentRef.current = false;
      });
    },
    [setValue],
  );

  useEffect(() => {
    let cancelled = false;

    const initializeQuill = async () => {
      if (!isOpen || isEditLoading || !editorRef.current || quillRef.current) {
        return;
      }

      const QuillModule = await import("quill");
      if (cancelled || !editorRef.current || quillRef.current) {
        return;
      }

      const Quill = QuillModule.default;
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: `#${toolbarId}`,
        },
        placeholder: "Write blog content...",
      });

      quill.on("text-change", (_delta, _oldDelta, source) => {
        if (source !== "user" || isApplyingContentRef.current) {
          return;
        }
        setValue("blogContent", quill.root.innerHTML, { shouldValidate: true });
      });

      quillRef.current = quill;
      setQuillContent(pendingContentRef.current);
    };

    void initializeQuill();

    return () => {
      cancelled = true;
    };
  }, [isEditLoading, isOpen, setQuillContent, setValue, toolbarId]);

  useEffect(() => {
    if (!isOpen) {
      resetQuillEditor();
    }
  }, [isOpen, resetQuillEditor]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCancelled = false;
    const fetchBlogCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categories = await blogApi.getBlogCategories();
        if (isCancelled) {
          return;
        }

        setBlogCategories(categories);
        if (mode === "create" && categories.length > 0) {
          setValue("blogCategoryId", categories[0].blogCategoryId, { shouldValidate: true });
        }
      } catch (error) {
        if (!isCancelled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          setFormError(axiosError.response?.data?.message ?? "Unable to load blog categories.");
          setBlogCategories([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingCategories(false);
        }
      }
    };

    void fetchBlogCategories();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, mode, setValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "create") {
      reset(defaultValues);
      setCurrentStatus("");
      pendingContentRef.current = "";
      setQuillContent("");
      return;
    }

    if (!blogPostId) {
      return;
    }

    let isCancelled = false;
    pendingContentRef.current = "";
    setQuillContent("");

    const fetchBlogDetail = async () => {
      setFormError(null);
      setIsLoadingDetail(true);
      try {
        const detail = await blogApi.getBlogById(blogPostId);
        if (!isCancelled) {
          const thumbnailValue = detail.blogThumbnail ?? "";
          const incomingContent = normalizeIncomingBlogContent(
            detail.blogContent ?? (detail as unknown as Record<string, unknown>).content,
          );
          reset({
            blogCategoryId: detail.blogCategoryId,
            blogTitle: detail.blogTitle,
            blogContent: incomingContent,
            blogThumbnail: thumbnailValue,
            blogAt: toDateTimeLocal(detail.blogAt),
          });
          setCurrentStatus(detail.status ?? "");
          pendingContentRef.current = incomingContent;
          setQuillContent(pendingContentRef.current);
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
  }, [blogPostId, isOpen, mode, reset, resetQuillEditor, setQuillContent]);

  useEffect(() => {
    if (!quillRef.current) {
      return;
    }

    quillRef.current.enable(!isEditLoading && !isSubmitting);
  }, [isEditLoading, isSubmitting]);

  const handleThumbnailFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const lowerName = selectedFile.name.toLowerCase();
    const extension = lowerName.lastIndexOf(".") >= 0 ? lowerName.slice(lowerName.lastIndexOf(".")) : "";
    if (!allowedThumbnailExtensions.has(extension)) {
      setFormError("Only JPG, JPEG, PNG, WEBP are supported.");
      event.target.value = "";
      return;
    }

    if (!allowedThumbnailMimeTypes.has(selectedFile.type)) {
      setFormError("Only image/jpeg, image/png, image/webp are supported.");
      event.target.value = "";
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

  const handleHideBlog = async () => {
    if (mode !== "edit" || !blogPostId || !onHideBlog) {
      return;
    }

    setIsHideConfirmOpen(true);
  };

  const handleConfirmHideBlog = async () => {
    if (mode !== "edit" || !blogPostId || !onHideBlog) {
      return;
    }

    await onHideBlog(blogPostId);
    setIsHideConfirmOpen(false);
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

      {isEditLoading && (
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">Loading blog data...</p>
      )}
      <form
        className={`flex flex-col gap-4 ${isEditLoading ? "pointer-events-none opacity-70" : ""}`}
        onSubmit={handleSubmit(handleFormSubmit)}
      >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Thumbnail (Local File)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className={`${inputClassName} h-auto cursor-pointer py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-600 hover:file:bg-brand-100 dark:file:bg-brand-500/15 dark:file:text-brand-300`}
              onChange={handleThumbnailFileChange}
              disabled={isUploadingThumbnail || isEditLoading || isSubmitting}
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
              <div className="mt-3 flex min-h-[220px] w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800 sm:min-h-[280px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentThumbnail}
                  alt="Thumbnail preview"
                  className="h-full max-h-[360px] w-full rounded-md object-contain"
                />
              </div>
            )}
            {errors.blogThumbnail?.message && (
              <p className="mt-1 text-sm text-error-600">{errors.blogThumbnail.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blog Title
            </label>
            <input
              type="text"
              className={inputClassName}
              {...register("blogTitle")}
              disabled={isEditLoading || isSubmitting}
            />
            {errors.blogTitle?.message && (
              <p className="mt-1 text-sm text-error-600">{errors.blogTitle.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blog Category
            </label>
            <select
              className={inputClassName}
              {...register("blogCategoryId")}
              disabled={isEditLoading || isSubmitting || isLoadingCategories || blogCategories.length === 0}
            >
              {blogCategories.map((option) => (
                <option key={option.blogCategoryId} value={option.blogCategoryId}>
                  {option.blogCategoryName}
                </option>
              ))}
            </select>
            {isLoadingCategories && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Loading categories...</p>
            )}
            {errors.blogCategoryId?.message && (
              <p className="mt-1 text-sm text-error-600">{errors.blogCategoryId.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blog Content
            </label>
            <div className="rounded-lg border border-gray-300 dark:border-gray-700">
              <div id={toolbarId} className="border-b border-gray-300 p-2 dark:border-gray-700">
                <span className="ql-formats">
                  <select className="ql-font">
                    <option value="sans-serif">Sans</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Mono</option>
                  </select>
                  <select className="ql-size">
                    <option value="small">Small</option>
                    <option value="">Normal</option>
                    <option value="large">Large</option>
                    <option value="huge">Huge</option>
                  </select>
                </span>
                <span className="ql-formats">
                  <button className="ql-bold" />
                  <button className="ql-italic" />
                  <button className="ql-underline" />
                  <button className="ql-strike" />
                </span>
                <span className="ql-formats">
                  <select className="ql-color" />
                  <select className="ql-background" />
                </span>
                <span className="ql-formats">
                  <button className="ql-list" value="ordered" />
                  <button className="ql-list" value="bullet" />
                </span>
                <span className="ql-formats">
                  <button className="ql-link" />
                  <button className="ql-clean" />
                </span>
              </div>
              <div
                ref={editorRef}
                className="min-h-[180px] text-sm text-gray-800 dark:text-white/90"
              />
            </div>
            <input type="hidden" {...register("blogContent")} />
            {errors.blogContent?.message && (
              <p className="mt-1 text-sm text-error-600">{errors.blogContent.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blog At (schedule)
            </label>
            <input
              type="datetime-local"
              className={inputClassName}
              {...register("blogAt")}
              disabled={isEditLoading || isSubmitting}
            />
            {errors.blogAt?.message && (
              <p className="mt-1 text-sm text-error-600">{errors.blogAt.message}</p>
            )}
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
            {mode === "edit" &&
              typeof onOpenAiModal === "function" &&
              blogPostId &&
              (
                <Button
                  variant="outline"
                  onClick={() =>
                    onOpenAiModal(
                      blogPostId,
                      getValues("blogTitle") ?? "",
                      getValues("blogContent") ?? "",
                    )
                  }
                  disabled={isSubmitting || isEditLoading}
                >
                  Improve with AI
                </Button>
              )}
            {mode === "edit" &&
              currentStatus.toLowerCase() !== "hidden" &&
              typeof onHideBlog === "function" && (
                <Button
                  variant="outline"
                  onClick={handleHideBlog}
                  disabled={isSubmitting || isEditLoading || isHidingBlog}
                >
                  {isHidingBlog ? "Hiding..." : "Hide Blog"}
                </Button>
              )}
            <Button variant="outline" onClick={onClose} disabled={isSubmitting || isEditLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isUploadingThumbnail || isEditLoading}
            >
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Blog" : "Save Blog"}
            </Button>
          </div>
      </form>

      <Modal
        isOpen={isHideConfirmOpen}
        onClose={() => setIsHideConfirmOpen(false)}
        className="max-w-[520px] p-6 lg:p-7"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Confirm Hide Blog
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>Are you sure you want to hide this blog?</p>
            <p>This blog will no longer be visible to customers.</p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsHideConfirmOpen(false)}
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
    </Modal>
  );
};

export default BlogFormModal;

