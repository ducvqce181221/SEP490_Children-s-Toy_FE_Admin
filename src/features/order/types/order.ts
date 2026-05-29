// ─── Status constants (phải khớp CHÍNH XÁC với OrderStatus.cs enum và StatusOrders DB) ────
//
// ID mapping (theo enum backend):
//  1=Pending, 2=Confirmed, 3=Processing, 4=Shipped, 5=Delivering
//  6=Delivered, 7=Completed, 8=Cancelled, 9=Refunded
//  10=Returning, 11=ReturnCompleted
//  12=DeliveryFailed, 13=WaitingReturn, 14=ReturnFailed, 15=Lost, 16=Damaged

export const ORDER_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERING: "Delivering",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  RETURNING: "Returning",
  RETURN_COMPLETED: "ReturnCompleted",
  DELIVERY_FAILED: "DeliveryFailed",
  WAITING_RETURN: "WaitingReturn",
  RETURN_FAILED: "ReturnFailed",
  LOST: "Lost",
  DAMAGED: "Damaged",
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
  REFUNDED: 9,
  RETURNING: 10,
  RETURN_COMPLETED: 11,
  DELIVERY_FAILED: 12,
  WAITING_RETURN: 13,
  RETURN_FAILED: 14,
  LOST: 15,
  DAMAGED: 16,
} as const;

/** Label hiển thị cho Admin — khớp với fulfillmentLabel từ backend */
export const ORDER_STATUS_LABEL: Record<number, string> = {
  1:  "Pending",
  2:  "Confirmed",
  3:  "Processing",
  4:  "Shipped",
  5:  "Delivering (incl. return flow)",
  6:  "Delivered",
  7:  "Completed",
  8:  "Cancelled",
  9:  "Refunded",
  10: "Returning to warehouse",
  11: "Return Completed",
  12: "Delivery Failed",
  13: "Waiting Return",
  14: "Return Failed",
  15: "Lost",
  16: "Damaged",
};

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  COD_PENDING: "COD_PENDING",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
} as const;

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending payment",
  PAID: "Paid",
  FAILED: "Payment failed",
  EXPIRED: "Payment expired",
  CANCELLED: "Payment cancelled",
  COD_PENDING: "Pay on delivery",
  REFUNDED: "Refunded to wallet",
  PARTIALLY_REFUNDED: "Partially refunded to wallet",
};

/** PAID + Cancelled order: refund may still be pending admin action */
export function isPaidCancelledAnomaly(
  paymentStatus: string,
  statusId: number,
): boolean {
  return (
    paymentStatus === PAYMENT_STATUS.PAID &&
    statusId === ORDER_STATUS_ID.CANCELLED
  );
}

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
  return_transporting: "Return transporting",
  return_sorting: "Return sorting",
  returning: "Returning",
  return_fail: "Return failed",
  returned: "Returned",
  cancel: "Cancelled",
};

export function formatGhnShippingLabel(status: string | null | undefined): string {
  if (!status) return "";
  const key = status.toLowerCase();
  return SHIPPING_STATUS_LABEL[key] ?? status;
}

export function isGhnReturnFlowStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const key = status.toLowerCase();
  return [
    "waiting_to_return",
    "return",
    "return_transporting",
    "return_sorting",
    "returning",
    "return_fail",
    "returned",
  ].includes(key);
}

// ─── List ────────────────────────────────────────────────────────────────────

/** Ánh xạ AdminOrderListItemDto */
export interface OrderListItem {
  orderId: number;
  orderCode: string;
  statusId: number;
  statusName: string;
  fulfillmentLabel?: string;
  ghnShippingStatus?: string | null;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  assignedToStaffId: number | null;
  assignedToStaffName: string | null;
  assignedToMerchId: number | null;
  assignedToMerchName: string | null;
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
  fulfillmentLabel?: string;
  ghnShippingStatus?: string | null;
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
  assignedToMerchId: number | null;
  assignedToMerchName: string | null;
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
