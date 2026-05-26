export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export type ModerationStatusType = "Approved" | "Pending" | "Rejected" | "ManualReview";

export interface ReviewImage {
  imageId: number;
  imageUrl: string;
  moderationStatus: string;
  createdAt: string;
}

export interface ReviewReply {
  replyProductId: number;
  staffId: number;
  staffName: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface ModerationLog {
  logId: number;
  moderatorType: "AI" | "Staff" | "System";
  moderatedById: number | null;
  moderatedByName: string | null;
  action: string;
  targetType: "Text" | "Image";
  imageId: number | null;
  reason: string | null;
  aiModelVersion: string | null;
  aiConfidenceScore: number | null;
  createdAt: string;
}


export interface Review {
  reviewId: number;
  accountId: number;
  accountEmail: string;
  productId: number;
  productName: string;
  orderId: number;
  orderCode: string;
  rating: number;
  comment: string | null;
  moderationStatus: ModerationStatusType;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string | null;
  imagesCount: number;
  repliesCount: number;
}

export interface ReviewDetail extends Omit<Review, "imagesCount" | "repliesCount"> {
  accountName: string;
  images: ReviewImage[];
  replies: ReviewReply[];
  moderationLogs: ModerationLog[];
}

export interface ReviewQuery {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDesc?: boolean;
  moderationStatus?: ModerationStatusType | "";
  productId?: number;
  accountId?: number;
  orderId?: number;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
  isDeleted?: boolean;
}

export type ReviewPaginatedResponse = PaginatedResponse<Review>;
