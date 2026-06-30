export type RefundStatusType =
  | "RefundRequested"
  | "RefundApproved"
  | "RefundPickupCreated"
  | "RefundShipping"
  | "RefundReceived"
  | "RefundInspectionPending"
  | "RefundCompleted"
  | "RefundCancelled"
  | "RefundRejected"
  | "RefundDamage"
  | "RefundReturnShipmentCreated"
  | "RefundReturningToCustomer"
  | "RefundReturnedToCustomer"
  | "RefundReturnToCustomerFailed";

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
  customerAddress?: string | null;
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
  returnShippingOrderCode?: string | null;
  inspectionPassed?: boolean | null;
  inspectionNote?: string | null;
  shippingFee?: number;
  subTotal?: number;
  totalAmount?: number;
  adminNote?: string | null;
  details?: RefundDetailItem[];
  statusHistory?: RefundStatusHistoryItem[];
  shippingHistory?: {
    previousStatus: string;
    newStatus: string;
    source: string;
    processedAt: string;
  }[];
  assignedToStaffName?: string | null;
  assignedToMerchName?: string | null;
  refundSource?: string;
  isSystemReturn?: boolean;
  /** ResponsibleParty của RefundReason — dùng để suggest bên chịu phí ship hoàn trả */
  refundReasonResponsibleParty?: "Store" | "Customer";
  // --- Return shipping fee fields ---
  returnShippingFee?: number;
  returnShippingFeeBy?: "Store" | "Customer";
  returnShippingFeeNote?: string | null;
  finalRefundAmount?: number;
  damageResponsibility?: "Customer" | "Carrier" | null;
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
  assignmentScope?: string;
}

export const REFUND_WORK_TAB = {
  IN_PROGRESS: "inProgress",
  COMPLETED: "completed",
} as const;

export type RefundWorkTab =
  (typeof REFUND_WORK_TAB)[keyof typeof REFUND_WORK_TAB];

export const REFUND_WORK_TAB_LABEL: Record<RefundWorkTab, string> = {
  [REFUND_WORK_TAB.IN_PROGRESS]: "In progress",
  [REFUND_WORK_TAB.COMPLETED]: "Completed",
};

export interface RefundPaginatedResponse {
  items: Refund[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
