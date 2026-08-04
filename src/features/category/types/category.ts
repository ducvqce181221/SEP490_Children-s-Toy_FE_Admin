export type CategorySortBy = "categoryname" | "createdat" | "supercategoryname" | "status";

export type CategoryStatus = "Active" | "Inactive";

export interface CategoryListItem {
  categoryId: number;
  categoryName: string;
  superCategoryId: number;
  superCategoryName: string;
  status: CategoryStatus;
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

export interface CategoryQueryParams {
  pageNumber: number;
  pageSize: number;
  sortBy?: CategorySortBy;
  sortDesc?: boolean;
  searchTerm?: string;
}

export interface ApiErrorResponse {
  code?: string;
  message?: string;
  errorMessage?: string;
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
