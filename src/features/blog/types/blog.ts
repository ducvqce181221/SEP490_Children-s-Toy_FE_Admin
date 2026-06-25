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
export type BlogManagementStatus = "Pending" | "Published" | "Scheduled";

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
  description?: string | null;
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
  accountRoleName: string;
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
  accountRoleName: string;
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

export interface BlogReviewPermission {
  accountId: number;
  accountName: string;
  email: string;
  accountImageUrl: string | null;
  violationCount: number;
  isCommentBanned: boolean;
  bannedAt: string | null;
  banExpiresAt: string | null;
  unbannedAt: string | null;
  unbannedBy: number | null;
  unbannedByName: string | null;
  lastViolatedAt: string | null;
  updatedAt: string | null;
}

export interface UpdateBlogReviewPermissionRequest {
  isCommentBanned: boolean;
}

export interface AiPromptTemplateItem {
  templateId: number;
  templateName: string;
  description: string | null;
  promptStructure: string;
  defaultTone: string | null;
  defaultCategoryId: number | null;
  defaultCategoryName: string | null;
  isActive: boolean;
}

export interface AiBlogGenerateRequest {
  blogPostId?: number;
  action?: "Generate" | "Improve" | "Rewrite";
  title: string;
  description?: string | null;
  promptStructure: string;
  defaultTone?: string | null;
  defaultCategoryId: number;
  isActive?: boolean;
  sourceContent?: string | null;
}

export interface AiBlogGenerateResult {
  blogPostId: number;
  historyId?: number | null;
  title: string;
  blogContent: string;
  blogCategoryId: number;
  promptData: string;
  aiStatus: string;
  aiError?: string | null;
}

export type AiBlockedViolationType = "brand_external" | "topic_restricted" | "out_of_scope" | "unsafe_content";

export interface AiBlockedResponse {
  status: "blocked";
  violation_type: AiBlockedViolationType;
  violated_keyword: string;
  reason: string;
  suggestions: string[];
}
