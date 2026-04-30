export const blogStatuses = [
  "Draft",
  "Pending",
  "Approved",
  "Scheduled",
  "Rejected",
  "Published",
] as const;

export type BlogStatus = (typeof blogStatuses)[number];

export type BlogSortBy =
  | "blogtitle"
  | "status"
  | "blogat"
  | "createdat"
  | "updatedat";

export interface BlogListItem {
  blogPostId: number;
  blogCategoryId: number;
  blogTitle: string;
  blogThumbnail: string | null;
  status: string;
  isFeatured: boolean;
  blogAt: string | null;
  author: string;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface BlogDetail extends BlogListItem {
  blogContent: string;
  reason: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface BlogQueryParams {
  pageNumber: number;
  pageSize: number;
  sortBy?: BlogSortBy;
  sortDesc?: boolean;
  searchTerm?: string;
  status?: string;
}

export interface CreateBlogRequest {
  blogCategoryId: number;
  blogTitle: string;
  blogContent: string;
  blogThumbnail: string | null;
  isFeatured: boolean;
  blogAt: string | null;
}

export interface UpdateBlogRequest extends CreateBlogRequest {
  status?: "Draft";
  blogAt: string | null;
}

export interface SubmitBlogRequest {
  status: "Pending";
}

export interface ApproveBlogRequest {
  decision: "Approved" | "Rejected";
  reason?: string | null;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  errors: Record<string, string[]>;
}

export interface MutationResult {
  success: boolean;
  message: string;
}

export interface CreateOrUpdateBlogResult extends MutationResult {
  data?: BlogDetail;
  validationErrors?: Record<string, string[]>;
}

export interface ApproveBlogResult extends MutationResult {
  data?: BlogDetail;
}
