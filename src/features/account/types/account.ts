export type AccountSortBy =
  | "accountname"
  | "phonenumber"
  | "email"
  | "rolename"
  | "isactive"
  | "createdat";

export interface AccountListItem {
  accountId: number;
  accountName: string;
  phoneNumber: string | null;
  email: string;
  imageUrl: string | null;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface AccountDetail {
  accountId: number;
  roleId: number;
  roleName: string;
  employeeCode: string | null;
  accountName: string;
  phoneNumber: string | null;
  email: string;
  imageUrl?: string | null;
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

export interface AccountQueryParams {
  pageNumber: number;
  pageSize: number;
  sortBy?: AccountSortBy;
  sortDesc?: boolean;
  searchTerm?: string;
  roleId?: number;
}

export interface CreateAccountRequest {
  roleId: number;
  accountName: string;
  phoneNumber: string | null;
  email: string;
  password: string;
}

export interface UpdateAccountInfoRequest {
  accountName: string;
  phoneNumber: string | null;
  isActive: boolean;
}

export interface UpdateAccountStatusRequest {
  isActive: boolean;
}

export interface UpdateAccountPasswordRequest {
  newPassword: string;
  confirmNewPassword: string;
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

export interface CreateAccountResult extends MutationResult {
  validationErrors?: Record<string, string[]>;
}

export interface UpdateAccountInfoResult extends MutationResult {
  validationErrors?: Record<string, string[]>;
  data?: AccountDetail;
}
