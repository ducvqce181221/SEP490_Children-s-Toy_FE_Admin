export type SuperCategorySortBy = "supercategoryname" | "createdat" | "status";

export type SuperCategoryStatus = "Active" | "Inactive";

export interface SuperCategoryListItem {
  superCategoryId: number;
  superCategoryName: string;
  status: SuperCategoryStatus;
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

export interface SuperCategoryQueryParams {
  pageNumber: number;
  pageSize: number;
  sortBy?: SuperCategorySortBy;
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

export interface SuperCategoryMutationResult {
  success: boolean;
  message: string;
  validationErrors?: Record<string, string[]>;
  data?: SuperCategoryListItem;
}
