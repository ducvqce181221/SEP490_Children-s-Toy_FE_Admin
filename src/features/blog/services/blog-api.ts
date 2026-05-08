import axios from "axios";
import axiosClient from "@/configs/axios-client";
import {
  ApproveBlogRequest,
  BlogReview,
  BlogReviewReply,
  BlogDetail,
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
    const response = await axiosClient.get<PaginatedResponse<BlogListItem>>("/blogs/admin", {
      params,
    });
    return response.data;
  },

  getBlogsForStaff: async (
    params: BlogQueryParams,
  ): Promise<PaginatedResponse<BlogListItem>> => {
    const response = await axiosClient.get<PaginatedResponse<BlogListItem>>("/blogs/staff", {
      params,
    });
    return response.data;
  },

  getBlogById: async (blogPostId: number): Promise<BlogDetail> => {
    const response = await axiosClient.get<BlogDetail>(`/blogs/${blogPostId}`);
    return response.data;
  },

  createBlog: async (payload: CreateBlogRequest): Promise<BlogDetail> => {
    const response = await axiosClient.post<BlogDetail>("/blogs", payload);
    return response.data;
  },

  updateBlog: async (
    blogPostId: number,
    payload: UpdateBlogRequest,
  ): Promise<BlogDetail> => {
    const response = await axiosClient.put<BlogDetail>(
      `/blogs/${blogPostId}`,
      payload,
    );
    return response.data;
  },

  submitBlog: async (
    blogPostId: number,
    payload: SubmitBlogRequest,
  ): Promise<BlogDetail> => {
    const response = await axiosClient.patch<BlogDetail>(
      `/blogs/${blogPostId}/submit`,
      payload,
    );
    return response.data;
  },

  approveBlog: async (
    blogPostId: number,
    payload: ApproveBlogRequest,
  ): Promise<BlogDetail> => {
    const response = await axiosClient.patch<BlogDetail>(
      `/blogs/${blogPostId}/approval`,
      payload,
    );
    return response.data;
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
    return axiosClient.get<PaginatedResponse<BlogReview>>("/blogs/reviews/manage", { params });
  },

  replyToBlogReview: async (
    reviewBlogId: number,
    payload: { comment: string; parentReplyId?: number | null; replyToAccountId?: number | null },
  ): Promise<BlogReviewReply> => {
    return axiosClient.post<BlogReviewReply>(`/blogs/reviews/${reviewBlogId}/replies`, payload);
  },

  updateBlogReviewStatus: async (
    reviewBlogId: number,
    status: "Visible" | "Hidden",
  ): Promise<BlogReview> => {
    return axiosClient.patch<BlogReview>(`/blogs/reviews/${reviewBlogId}/status`, { status });
  },

  updateBlogReplyStatus: async (
    replyBlogId: number,
    status: "Visible" | "Hidden",
  ): Promise<BlogReviewReply> => {
    return axiosClient.patch<BlogReviewReply>(`/blogs/reviews/replies/${replyBlogId}/status`, { status });
  },
};
