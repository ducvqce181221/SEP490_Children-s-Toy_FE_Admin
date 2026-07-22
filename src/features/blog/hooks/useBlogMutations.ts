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
  const [isPublishingNow, setIsPublishingNow] = useState(false);
  const [isHidingBlog, setIsHidingBlog] = useState(false);

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
    decision: "ApprovePublishNow" | "ApproveKeepSchedule" | "Rejected",
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
          decision === "Rejected"
            ? "Blog rejected successfully."
            : decision === "ApprovePublishNow"
            ? "Blog approved and published now successfully."
            : "Blog approved and kept on schedule successfully.",
        data: updatedBlog,
      };
    } catch (error) {
      const axiosError = error as AxiosError<
        ValidationErrorResponse | ApiErrorResponse
      >;
      const responseData = axiosError.response?.data;
      const validationMessage =
        (responseData &&
        "errors" in responseData &&
        Object.values(responseData.errors).flat()[0]) || undefined;

      return {
        success: false,
        message:
          validationMessage ??
          responseData?.message ??
          "Unable to process approval. Please try again.",
      };
    } finally {
      setIsApproving(false);
    }
  };

  const publishNow = async (blogPostId: number): Promise<SubmitResult> => {
    setIsPublishingNow(true);

    try {
      const updatedBlog = await blogApi.publishNow(blogPostId);
      onSuccess?.();

      return {
        success: true,
        message: "Blog published successfully.",
        data: updatedBlog,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ??
          "Unable to publish blog now. Please try again.",
      };
    } finally {
      setIsPublishingNow(false);
    }
  };

  const hideBlog = async (blogPostId: number): Promise<SubmitResult> => {
    setIsHidingBlog(true);

    try {
      const updatedBlog = await blogApi.hideBlog(blogPostId);
      onSuccess?.();

      return {
        success: true,
        message: "Blog hidden successfully.",
        data: updatedBlog,
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ??
          "Unable to hide blog. Please try again.",
      };
    } finally {
      setIsHidingBlog(false);
    }
  };

  return {
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
  };
};
