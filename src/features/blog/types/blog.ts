export const blogStatuses = [
  "Draft",
  "Pending",
  "Approved",
  "Scheduled",
  "Rejected",
  "Published",
  "Hidden",
] as const;

export type BlogStatus = (typeof blogStatuses)[number];

export type BlogSortBy =
  | "blogtitle"
  | "status"
  | "blogat"
  | "createdat"
  | "updatedat";

export type FeaturedFilter = "all" | "featured";

export interface BlogListItem {
  blogPostId: number;
  accountId: number;
  blogCategoryId: number;
  blogCategoryName: string;
  blogTitle: string;
  blogThumbnail: string | null;
  status: string;
  isHidden: boolean;
  isFeatured: boolean;
  blogAt: string | null;
  author: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface BlogDetail extends BlogListItem {
  blogContent: string;
  reason: string | null;
}

export interface BlogCategoryItem {
  blogCategoryId: number;
  blogCategoryName: string;
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
  featuredOnly?: boolean;
}

export interface CreateBlogRequest {
  blogCategoryId: number;
  blogTitle: string;
  blogContent: string;
  blogThumbnail: string | null;
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
  decision: "ApprovePublishNow" | "ApproveKeepSchedule" | "Rejected";
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

export interface BlogReviewReply {
  replyBlogId: number;
  reviewBlogId: number;
  accountId: number;
  accountName: string;
  accountImageUrl: string | null;
  parentReplyId: number | null;
  replyToAccountId: number | null;
  replyToAccountName: string | null;
  comment: string;
  status: "Visible" | "Hidden";
  moderationStatus: BlogReviewModerationStatus;
  isHidden: boolean;
  banReasonId: number | null;
  banReasonContent: string | null;
  createdAt: string;
  updatedAt: string | null;
  replies: BlogReviewReply[];
}

export type BlogReviewModerationStatus = "ManualReview" | "Approved" | "Rejected";

export interface BlogCommentBanReason {
  banReasonId: number;
  content: string;
  createdAt: string;
}

export interface BlogReview {
  reviewBlogId: number;
  blogPostId: number;
  blogTitle: string;
  accountId: number;
  accountName: string;
  accountImageUrl: string | null;
  comment: string;
  status: "Visible" | "Hidden";
  moderationStatus: BlogReviewModerationStatus;
  isHidden: boolean;
  banReasonId: number | null;
  banReasonContent: string | null;
  createdAt: string;
  updatedAt: string | null;
  replies: BlogReviewReply[];
}
