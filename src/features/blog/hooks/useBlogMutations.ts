import { AxiosError } from "axios";
import { useState } from "react";
import { blogApi } from "../services/blog-api";
import {
  ApiErrorResponse,
  ApproveBlogResult,
  BlogDetail,
  CreateBlogRequest,
  CreateOrUpdateBlogResult,
  UpdateBlogRequest,
  ValidationErrorResponse,
} from "../types/blog";

interface SubmitResult {
  success: boolean;
  message: string;
  data?: BlogDetail;
}

export const useBlogMutations = (onSuccess?: () => void) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmittingBlog, setIsSubmittingBlog] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const createBlog = async (
    payload: CreateBlogRequest,
  ): Promise<CreateOrUpdateBlogResult> => {
    setIsCreating(true);

    try {
      const createdBlog = await blogApi.createBlog(payload);
      onSuccess?.();

      return {
        success: true,
        message: "Blog created successfully.",
        data: createdBlog,
      };
    } catch (error) {
      const axiosError = error as AxiosError<
        ValidationErrorResponse | ApiErrorResponse
      >;

      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data &&
        "errors" in axiosError.response.data
      ) {
        return {
          success: false,
          message: axiosError.response.data.message,
          validationErrors: axiosError.response.data.errors,
        };
      }

      return {
        success: false,
        message:
          axiosError.response?.data?.message ??
          "Unable to create blog. Please try again.",
      };
    } finally {
      setIsCreating(false);
    }
  };

  const updateBlog = async (
    blogPostId: number,
    payload: UpdateBlogRequest,
  ): Promise<CreateOrUpdateBlogResult> => {
    setIsUpdating(true);

    try {
      const updatedBlog = await blogApi.updateBlog(blogPostId, payload);
      onSuccess?.();

      return {
        success: true,
        message: "Blog updated successfully.",
        data: updatedBlog,
      };
    } catch (error) {
      const axiosError = error as AxiosError<
        ValidationErrorResponse | ApiErrorResponse
      >;

      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data &&
        "errors" in axiosError.response.data
      ) {
        return {
          success: false,
          message: axiosError.response.data.message,
          validationErrors: axiosError.response.data.errors,
        };
      }

      return {
        success: false,
        message:
          axiosError.response?.data?.message ??
          "Unable to update blog. Please try again.",
      };
    } finally {
      setIsUpdating(false);
    }
  };

  const submitBlog = async (blogPostId: number): Promise<SubmitResult> => {
    setIsSubmittingBlog(true);

    try {
      const updatedBlog = await blogApi.submitBlog(blogPostId, { status: "Pending" });
      onSuccess?.();

      return {
        success: true,
        message: "Blog submitted for approval successfully.",
        data: updatedBlog,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ??
          "Unable to submit blog. Please try again.",
      };
    } finally {
      setIsSubmittingBlog(false);
    }
  };

  const approveBlog = async (
    blogPostId: number,
    decision: "Approved" | "Rejected",
    reason?: string,
  ): Promise<ApproveBlogResult> => {
    setIsApproving(true);

    try {
      const updatedBlog = await blogApi.approveBlog(blogPostId, {
        decision,
        reason: reason?.trim() || null,
      });
      onSuccess?.();

      return {
        success: true,
        message:
          decision === "Approved"
            ? "Blog approved successfully."
            : "Blog rejected successfully.",
        data: updatedBlog,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      return {
        success: false,
        message:
          axiosError.response?.data?.message ??
          "Unable to process approval. Please try again.",
      };
    } finally {
      setIsApproving(false);
    }
  };

  return {
    createBlog,
    updateBlog,
    submitBlog,
    approveBlog,
    isCreating,
    isUpdating,
    isSubmittingBlog,
    isApproving,
  };
};
