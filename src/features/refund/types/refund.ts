export type RefundStatusType = "Requested" | "Approved" | "Completed" | "Rejected" | "Cancelled";

export interface Refund {
  refundId: number;
  orderId: number;
  orderCode: string;
  refundReasonId: number | null;
  refundReasonContent: string | null;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  requestedBy: number | null;
  requestedByName: string | null;
  approvedBy: number | null;
  reasonDetails: string | null;
  approvedAmount: number;
  refundStatus: RefundStatusType;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string | null;
  images: string[];
}

export interface RefundFilter {
  refundStatus?: RefundStatusType;
  orderId?: number;
  customerId?: number;
  refundReasonId?: number;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface RefundPaginatedResponse {
  items: Refund[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
