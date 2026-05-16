export type WalletStatus = "Active" | "Frozen" | "Closed";

export interface WalletListItem {
  walletId: number;
  account: string;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface WalletQueryParams {
  pageNumber: number;
  pageSize: number;
  account?: string;
  status?: WalletStatus;
}

export interface UpdateWalletStatusRequest {
  status: Extract<WalletStatus, "Active" | "Frozen">;
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

export interface ApiErrorResponse {
  code: string;
  message: string;
}
