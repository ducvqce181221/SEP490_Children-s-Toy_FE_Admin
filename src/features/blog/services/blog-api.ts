import axios from "axios";
import axiosClient from "@/configs/axios-client";
import {
  ApproveBlogRequest,
  BlogCommentBanReason,
  BlogReviewPermission,
  BlogReview,
  BlogReviewReply,
  BlogDetail,
  BlogCategoryItem,
  BlogListItem,
  BlogQueryParams,
  CreateBlogRequest,
  PaginatedResponse,
  SubmitBlogRequest,
  UpdateBlogReviewPermissionRequest,
  UpdateBlogRequest,
} from "../types/blog";

export const blogApi = {
  getBlogsForAdmin: async (
    params: BlogQueryParams,
  ): Promise<PaginatedResponse<BlogListItem>> => {
    return axiosClient.get<PaginatedResponse<BlogListItem>>("/admin/blogs", {
      params,
    });
  },

  getBlogsForStaff: async (
    params: BlogQueryParams,
  ): Promise<PaginatedResponse<BlogListItem>> => {
    return axiosClient.get<PaginatedResponse<BlogListItem>>("/admin/blogs/my", {
      params,
    });
  },

  getBlogById: async (blogPostId: number): Promise<BlogDetail> => {
    return axiosClient.get<BlogDetail>(`/admin/blogs/${blogPostId}`);
  },

  getBlogCategories: async (): Promise<BlogCategoryItem[]> => {
    return axiosClient.get<BlogCategoryItem[]>("/admin/blog-categories");
  },

  createBlog: async (payload: CreateBlogRequest): Promise<BlogDetail> => {
    return axiosClient.post<BlogDetail, CreateBlogRequest>("/admin/blogs", payload);
  },

  updateBlog: async (
    blogPostId: number,
    payload: UpdateBlogRequest,
  ): Promise<BlogDetail> => {
    return axiosClient.put<BlogDetail, UpdateBlogRequest>(
      `/admin/blogs/${blogPostId}`,
      payload,
    );
  },

  submitBlog: async (
    blogPostId: number,
    payload: SubmitBlogRequest,
  ): Promise<BlogDetail> => {
    return axiosClient.patch<BlogDetail, SubmitBlogRequest>(
      `/admin/blogs/${blogPostId}/submit`,
      payload,
    );
  },

  approveBlog: async (
    blogPostId: number,
    payload: ApproveBlogRequest,
  ): Promise<BlogDetail> => {
    return axiosClient.patch<BlogDetail, ApproveBlogRequest>(
      `/admin/blogs/${blogPostId}/approval`,
      payload,
    );
  },

  publishNow: async (blogPostId: number): Promise<BlogDetail> => {
    return axiosClient.patch<BlogDetail>(`/admin/blogs/${blogPostId}/publish-now`);
  },

  hideBlog: async (blogPostId: number): Promise<BlogDetail> => {
    return axiosClient.patch<BlogDetail>(`/admin/blogs/${blogPostId}/hide`);
  },

  uploadThumbnail: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7083";
    const normalizedBaseURL = rawBaseURL.replace(/\/+$/, "");
    const apiBaseURL = normalizedBaseURL.endsWith("/api")
      ? normalizedBaseURL
      : `${normalizedBaseURL}/api`;

    const response = await axios.post<{ url: string }>(
      `${apiBaseURL}/admin/blogs/thumbnail/upload`,
      formData,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );

    return response.data;
  },

  getBlogReviewsForManagement: async (params: {
    pageNumber: number;
    pageSize: number;
    searchTerm?: string;
    status?: string;
  }): Promise<PaginatedResponse<BlogReview>> => {
    return axiosClient.get<PaginatedResponse<BlogReview>>("/admin/blog-reviews", {
      params,
    });
  },

  replyToBlogReview: async (
    reviewBlogId: number,
    payload: { comment: string; parentReplyId?: number | null; replyToAccountId?: number | null },
  ): Promise<BlogReviewReply> => {
    return axiosClient.post<
      BlogReviewReply,
      { comment: string; parentReplyId?: number | null; replyToAccountId?: number | null }
    >(`/admin/blog-reviews/${reviewBlogId}/replies`, payload);
  },

  updateBlogReviewStatus: async (
    reviewBlogId: number,
    moderationStatus: "ManualReview" | "Approved" | "Rejected",
    banReasonId?: number,
  ): Promise<BlogReview> => {
    return axiosClient.patch<BlogReview, { moderationStatus: "ManualReview" | "Approved" | "Rejected"; banReasonId?: number }>(
      `/admin/blog-reviews/${reviewBlogId}/status`,
      { moderationStatus, banReasonId },
    );
  },

  getBlogCommentBanReasons: async (): Promise<BlogCommentBanReason[]> => {
    return axiosClient.get<BlogCommentBanReason[]>("/admin/blog-review-ban-reasons");
  },

  updateBlogReplyStatus: async (
    replyBlogId: number,
    moderationStatus: "ManualReview" | "Approved" | "Rejected",
    banReasonId?: number,
  ): Promise<BlogReviewReply> => {
    return axiosClient.patch<BlogReviewReply, { moderationStatus: "ManualReview" | "Approved" | "Rejected"; banReasonId?: number }>(
      `/admin/blog-review-replies/${replyBlogId}/status`,
      { moderationStatus, banReasonId },
    );
  },

  getBlogReviewPermissions: async (params: {
    pageNumber: number;
    pageSize: number;
    searchTerm?: string;
  }): Promise<PaginatedResponse<BlogReviewPermission>> => {
    return axiosClient.get<PaginatedResponse<BlogReviewPermission>>(
      "/admin/blog-review-permissions",
      { params },
    );
  },

  updateBlogReviewPermission: async (
    accountId: number,
    payload: UpdateBlogReviewPermissionRequest,
  ): Promise<BlogReviewPermission> => {
    return axiosClient.patch<
      BlogReviewPermission,
      UpdateBlogReviewPermissionRequest
    >(`/admin/blog-review-permissions/${accountId}`, payload);
  },
};
