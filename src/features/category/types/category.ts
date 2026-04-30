export type CategorySortBy = "categoryname" | "createdat" | "supercategoryname";

export interface CategoryListItem {
  categoryId: number;
  categoryName: string;
  superCategoryId: number;
  superCategoryName: string;
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

export interface CategoryQueryParams {
  pageNumber: number;
  pageSize: number;
  sortBy?: CategorySortBy;
  sortDesc?: boolean;
  searchTerm?: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  errors: Record<string, string[]>;
}

export interface CategoryMutationResult {
  success: boolean;
  message: string;
  validationErrors?: Record<string, string[]>;
  data?: CategoryListItem;
}
