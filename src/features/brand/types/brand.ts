export type BrandSortBy = "brandname" | "createdat" | "updatedat" | "status";

export type BrandStatus = "Active" | "Inactive";

export interface BrandListItem {
  brandId: number;
  brandName: string;
  status: BrandStatus;
  createdAt: string;
  updatedAt: string | null;
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

export interface BrandQueryParams {
  pageNumber: number;
  pageSize: number;
  sortBy?: BrandSortBy;
  sortDesc?: boolean;
  searchTerm?: string;
}

export interface BrandFormRequest {
  brandName: string;
  status?: BrandStatus;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  errors: Record<string, string[]>;
}

export interface BrandMutationResult {
  success: boolean;
  message: string;
  validationErrors?: Record<string, string[]>;
  data?: BrandListItem;
}
