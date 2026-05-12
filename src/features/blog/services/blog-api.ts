import axios from "axios";
import axiosClient from "@/configs/axios-client";
import {
  ApproveBlogRequest,
  BlogReview,
  BlogReviewReply,
  BlogDetail,
  BlogCategoryItem,
  BlogListItem,
  BlogQueryParams,
  CreateBlogRequest,
  PaginatedResponse,
  SubmitBlogRequest,
  UpdateBlogRequest,
} from "../types/blog";

export const blogApi = {
  getBlogsForAdmin: async (
    params: BlogQueryParams,
  ): Promise<PaginatedResponse<BlogListItem>> => {
    return axiosClient.get<PaginatedResponse<BlogListItem>>("/blogs/admin", {
      params,
    });
  },

  getBlogsForStaff: async (
    params: BlogQueryParams,
  ): Promise<PaginatedResponse<BlogListItem>> => {
    return axiosClient.get<PaginatedResponse<BlogListItem>>("/blogs/staff", {
      params,
    });
  },

  getBlogById: async (blogPostId: number): Promise<BlogDetail> => {
    return axiosClient.get<BlogDetail>(`/blogs/${blogPostId}`);
  },

  getBlogCategories: async (): Promise<BlogCategoryItem[]> => {
    return axiosClient.get<BlogCategoryItem[]>("/blogs/categories");
  },

  createBlog: async (payload: CreateBlogRequest): Promise<BlogDetail> => {
    return axiosClient.post<BlogDetail, CreateBlogRequest>("/blogs", payload);
  },

  updateBlog: async (
    blogPostId: number,
    payload: UpdateBlogRequest,
  ): Promise<BlogDetail> => {
    return axiosClient.put<BlogDetail, UpdateBlogRequest>(
      `/blogs/${blogPostId}`,
      payload,
    );
  },

  submitBlog: async (
    blogPostId: number,
    payload: SubmitBlogRequest,
  ): Promise<BlogDetail> => {
    return axiosClient.patch<BlogDetail, SubmitBlogRequest>(
      `/blogs/${blogPostId}/submit`,
      payload,
    );
  },

  approveBlog: async (
    blogPostId: number,
    payload: ApproveBlogRequest,
  ): Promise<BlogDetail> => {
    return axiosClient.patch<BlogDetail, ApproveBlogRequest>(
      `/blogs/${blogPostId}/approval`,
      payload,
    );
  },

  publishNow: async (blogPostId: number): Promise<BlogDetail> => {
    return axiosClient.patch<BlogDetail>(`/blogs/${blogPostId}/publish-now`);
  },

  hideBlog: async (blogPostId: number): Promise<BlogDetail> => {
    return axiosClient.patch<BlogDetail>(`/blogs/${blogPostId}/hide`);
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
      `${apiBaseURL}/blogs/thumbnail/upload`,
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
    status?: "Visible" | "Hidden";
  }): Promise<PaginatedResponse<BlogReview>> => {
    return axiosClient.get<PaginatedResponse<BlogReview>>("/blogs/reviews/manage", {
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
    >(`/blogs/reviews/${reviewBlogId}/replies`, payload);
  },

  updateBlogReviewStatus: async (
    reviewBlogId: number,
    status: "Visible" | "Hidden",
  ): Promise<BlogReview> => {
    return axiosClient.patch<BlogReview, { status: "Visible" | "Hidden" }>(
      `/blogs/reviews/${reviewBlogId}/status`,
      { status },
    );
  },

  updateBlogReplyStatus: async (
    replyBlogId: number,
    status: "Visible" | "Hidden",
  ): Promise<BlogReviewReply> => {
    return axiosClient.patch<BlogReviewReply, { status: "Visible" | "Hidden" }>(
      `/blogs/reviews/replies/${replyBlogId}/status`,
      { status },
    );
  },
};
