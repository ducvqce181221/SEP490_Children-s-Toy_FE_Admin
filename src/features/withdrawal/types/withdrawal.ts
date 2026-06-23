export type WithdrawalStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface AdminWithdrawalListItem {
  withdrawalId: number;
  referenceId: string;
  amount: number;
  toBankBin: string;
  toBankName: string;
  toAccountNumber: string;
  toAccountName: string;
  status: WithdrawalStatus;
  createdAt: string;
  accountId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
}

export interface WithdrawalHistoryStep {
  historyId: number;
  fromStatus: WithdrawalStatus | null;
  toStatus: WithdrawalStatus;
  source: string;
  note: string | null;
  createdAt: string;
}

export interface AdminWithdrawalDetail {
  withdrawalId: number;
  walletId: number;
  accountId: number;
  walletTransactionId: number | null;
  referenceId: string;
  amount: number;
  toBankBin: string;
  toBankName: string;
  toAccountNumber: string;
  toAccountName: string;
  payosPayoutId: string | null;
  payosTransactionId: string | null;
  status: WithdrawalStatus;
  failReason: string | null;
  retryCount: number;
  processingAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  statusHistory: WithdrawalHistoryStep[];
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

export interface AdminWithdrawalQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
}
