import axiosClient from "@/configs/axios-client";
import {
  AssignOrderRequest,
  ReassignOrderRequest,
  CancelOrderRequest,
  CancelOrderResponse,
  ConfirmOrderRequest,
  ConfirmOrderResponse,
  OrderDetail,
  OrderListItem,
  OrderQueryParams,
  PaginatedResponse,
  ProcessOrderRequest,
  ProcessOrderResponse,
  ShipOrderRequest,
  ShipOrderResponse,
} from "../types/order";

export const orderApi = {
  // ── GET list ──────────────────────────────────────────────────────────────
  getOrders: (
    params: OrderQueryParams,
  ): Promise<PaginatedResponse<OrderListItem>> => {
    const cleanParams: Record<string, unknown> = {};
    (Object.keys(params) as (keyof OrderQueryParams)[]).forEach((key) => {
      if (key === "statusIds") return; // xử lý riêng bên dưới
      const val = params[key];
      if (val !== undefined && val !== "") {
        cleanParams[key] = val;
      }
    });
    // statusIds[] phải serialize thành nhiều query param cùng tên: ?statusIds=1&statusIds=2
    if (params.statusIds && params.statusIds.length > 0) {
      cleanParams["statusIds"] = params.statusIds;
    }
    return axiosClient.get<PaginatedResponse<OrderListItem>>("/admin/orders", {
      params: cleanParams,
      // axios sẽ serialize array thành ?statusIds=1&statusIds=2 theo mặc định với paramsSerializer
    });
  },

  // ── GET detail ────────────────────────────────────────────────────────────
  getOrderById: (id: number): Promise<OrderDetail> =>
    axiosClient.get<OrderDetail>(`/admin/orders/${id}`),

  // ── PATCH confirm ─────────────────────────────────────────────────────────
  confirmOrder: (
    id: number,
    body: ConfirmOrderRequest,
  ): Promise<ConfirmOrderResponse> =>
    axiosClient.patch<ConfirmOrderResponse, ConfirmOrderRequest>(
      `/admin/orders/${id}/confirm`,
      body,
    ),

  // ── PATCH process ─────────────────────────────────────────────────────────
  processOrder: (
    id: number,
    body: ProcessOrderRequest,
  ): Promise<ProcessOrderResponse> =>
    axiosClient.patch<ProcessOrderResponse, ProcessOrderRequest>(
      `/admin/orders/${id}/process`,
      body,
    ),

  // ── PATCH ship ────────────────────────────────────────────────────────────
  shipOrder: (
    id: number,
    body: ShipOrderRequest,
  ): Promise<ShipOrderResponse> =>
    axiosClient.patch<ShipOrderResponse, ShipOrderRequest>(
      `/admin/orders/${id}/ship`,
      body,
    ),

  // ── PATCH cancel ──────────────────────────────────────────────────────────
  cancelOrder: (
    id: number,
    body: CancelOrderRequest,
  ): Promise<CancelOrderResponse> =>
    axiosClient.patch<CancelOrderResponse, CancelOrderRequest>(
      `/admin/orders/${id}/cancel`,
      body,
    ),

  // ── PATCH assign ──────────────────────────────────────────────────────────
  assignOrder: (id: number, body: AssignOrderRequest): Promise<void> =>
    axiosClient.patch<void, AssignOrderRequest>(
      `/admin/orders/${id}/assign`,
      body,
    ),

  reassignOrder: (id: number, body: ReassignOrderRequest): Promise<void> =>
    axiosClient.post<void, ReassignOrderRequest>(`/orders/${id}/reassign`, body),
};


