export type RefundStatusType = 
  | "RefundRequested" 
  | "RefundApproved" 
  | "RefundPickupCreated" 
  | "RefundShipping" 
  | "RefundReceived" 
  | "RefundInspectionPending" 
  | "RefundCompleted" 
  | "RefundCancelled" 
  | "RefundRejected";

export interface RefundDetailItem {
  productId: number;
  productName: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
}

export interface RefundStatusHistoryItem {
  statusName: string;
  changedByName?: string | null;
  note?: string | null;
  createdAt: string;
}

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
  refundCode?: string | null;
  shippingOrderCode?: string | null;
  shippingFee?: number;
  subTotal?: number;
  totalAmount?: number;
  adminNote?: string | null;
  details?: RefundDetailItem[];
  statusHistory?: RefundStatusHistoryItem[];
  assignedToStaffName?: string | null;
  assignedToMerchName?: string | null;
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
  assignedToMe?: boolean;
  keyword?: string;
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
