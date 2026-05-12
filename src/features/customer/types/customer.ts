export type CustomerSortBy =
  | "accountname"
  | "phonenumber"
  | "email"
  | "isactive"
  | "createdat";

export interface CustomerListItem {
  accountId: number;
  accountName: string;
  phoneNumber: string | null;
  email: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CustomerDetail {
  accountId: number;
  roleId: number;
  roleName: string;
  accountName: string;
  phoneNumber: string | null;
  email: string;
  dob: string | null;
  sexId: number | null;
  sexName: string | null;
  imageUrl: string | null;
  isActive: boolean;
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

export interface CustomerQueryParams {
  pageNumber: number;
  pageSize: number;
  sortBy?: CustomerSortBy;
  sortDesc?: boolean;
  searchTerm?: string;
}

export interface UpdateCustomerRequest {
  isActive: boolean;
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

export interface UpdateCustomerResult extends MutationResult {
  validationErrors?: Record<string, string[]>;
  data?: CustomerDetail;
}
