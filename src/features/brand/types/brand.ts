export type BrandSortBy = "brandname" | "createdat";

export interface BrandListItem {
  brandId: number;
  brandName: string;
  createdAt: string;
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
