// ─── Status constants ────────────────────────────────────────────────────────

export const ORDER_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERING: "Delivering",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export type OrderStatusName = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_ID = {
  PENDING: 1,
  CONFIRMED: 2,
  PROCESSING: 3,
  SHIPPED: 4,
  DELIVERING: 5,
  DELIVERED: 6,
  COMPLETED: 7,
  CANCELLED: 8,
} as const;

export const ORDER_STATUS_LABEL: Record<number, string> = {
  1: "Pending",
  2: "Confirmed",
  3: "Processing",
  4: "Shipped",
  5: "Delivering",
  6: "Delivered",
  7: "Completed",
  8: "Cancelled",
};

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const ROLE_NAME = {
  ADMIN: "Admin",
  STAFF: "Staff",
  MERCHANDISE: "Merchandise",
} as const;

/** StatusId mặc định hiển thị theo role (Admin = [] nghĩa là tất cả) */
export const ROLE_DEFAULT_STATUS_IDS: Record<string, number[]> = {
  [ROLE_NAME.STAFF]: [ORDER_STATUS_ID.PENDING, ORDER_STATUS_ID.CONFIRMED],
  [ROLE_NAME.MERCHANDISE]: [ORDER_STATUS_ID.CONFIRMED, ORDER_STATUS_ID.PROCESSING, ORDER_STATUS_ID.SHIPPED],
  [ROLE_NAME.ADMIN]: [],
};

/** GHN provider status → label tiếng Việt */
export const SHIPPING_STATUS_LABEL: Record<string, string> = {
  ready_to_pick: "Ready to Pick",
  picking: "Picking",
  picked: "Picked",
  delivering: "Delivering",
  money_collect_delivering: "Delivering + COD",
  delivered: "Delivered",
  delivery_fail: "Delivery Failed",
  waiting_to_return: "Waiting to Return",
  return: "Return",
  returning: "Returning",
  returned: "Returned",
  cancel: "Cancelled",
};

// ─── List ────────────────────────────────────────────────────────────────────

/** Ánh xạ AdminOrderListItemDto */
export interface OrderListItem {
  orderId: number;
  orderCode: string;
  statusId: number;
  statusName: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  assignedToStaffId: number | null;
  assignedToStaffName: string | null;
  orderDate: string;
  confirmedAt: string | null;
  shippedAt: string | null;
}

// ─── Detail ──────────────────────────────────────────────────────────────────

export interface OrderDetailItem {
  orderDetailId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number | null;
}

export interface OrderStatusHistory {
  statusName: string;
  changedByName: string | null;
  note: string | null;
  createdAt: string;
}

export interface ShippingStatusHistory {
  previousStatus: string;
  newStatus: string;
  source: string;
  processedAt: string;
}

export interface ShippingInfo {
  provider: string;
  trackingNumber: string | null;
  providerOrderCode: string | null;
  serviceType: string | null;
  status: string | null;
  shippingFee: number | null;
  codAmount: number | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  lastErrorMessage: string | null;
}

/** Ánh xạ AdminOrderDetailDto */
export interface OrderDetail {
  orderId: number;
  orderCode: string;
  statusId: number;
  statusName: string;
  orderDate: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  cancelledByName: string | null;
  // Địa chỉ giao hàng
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingWardName: string;
  shippingDistrictName: string;
  shippingProvinceName: string;
  // Sản phẩm
  items: OrderDetailItem[];
  // Tổng tiền
  subTotal: number;
  voucherDiscountAmount: number;
  estimatedShippingFee: number;
  actualShippingFee: number | null;
  totalAmount: number;
  // Thanh toán
  paymentMethod: string;
  paymentStatus: string;
  paidAt: string | null;
  // Phân công
  assignedToStaffId: number | null;
  assignedToStaffName: string | null;
  // Lịch sử đơn hàng
  statusHistory: OrderStatusHistory[];
  // Vận chuyển
  shipping: ShippingInfo | null;
  // Lịch sử shipper (webhook/polling)
  shippingHistory: ShippingStatusHistory[];
}

// ─── Query ────────────────────────────────────────────────────────────────────

export interface OrderQueryParams {
  statusId?: number;
  statusIds?: number[];
  assignedToMe?: boolean;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
  pageNumber: number;
  pageSize: number;
}

// ─── Mutation request/response ────────────────────────────────────────────────

export interface ConfirmOrderRequest {
  note?: string;
}

export interface ConfirmOrderResponse {
  orderId: number;
  statusName: string;
  confirmedAt: string;
}

export interface ProcessOrderRequest {
  note?: string;
}

export interface ProcessOrderResponse {
  orderId: number;
  statusName: string;
}

export interface ShipOrderRequest {
  provider: string;
  serviceType?: string;
  note?: string;
}

export interface ShipOrderResponse {
  trackingNumber: string | null;
  providerOrderCode: string | null;
  estimatedDelivery: string | null;
  shippingFee: number;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface CancelOrderResponse {
  orderId: number;
  cancelledAt: string;
}

export interface AssignOrderRequest {
  targetAccountId: number;
  note?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  code: string;
  message: string;
}

export interface MutationResult {
  success: boolean;
  message: string;
}
