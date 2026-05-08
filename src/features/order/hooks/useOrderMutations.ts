import { AxiosError } from "axios";
import { useState } from "react";
import { orderApi } from "../services/order-api";
import {
  ApiErrorResponse,
  AssignOrderRequest,
  CancelOrderRequest,
  ConfirmOrderRequest,
  MutationResult,
  ProcessOrderRequest,
  ShipOrderRequest,
  ShipOrderResponse,
} from "../types/order";

interface ShipMutationResult extends MutationResult {
  data?: ShipOrderResponse;
}

export const useOrderMutations = (onSuccess?: () => void) => {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [shippingId, setShippingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const extractErrorMessage = (
    err: unknown,
    fallback: string,
  ): string => {
    const axiosError = err as AxiosError<ApiErrorResponse>;
    return axiosError.response?.data?.message ?? fallback;
  };

  // ── Confirm ───────────────────────────────────────────────────────────────
  const confirmOrder = async (
    orderId: number,
    body: ConfirmOrderRequest,
  ): Promise<MutationResult> => {
    setConfirmingId(orderId);
    try {
      await orderApi.confirmOrder(orderId, body);
      onSuccess?.();
      return { success: true, message: "Đơn hàng đã được xác nhận thành công." };
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, "Không thể xác nhận đơn hàng. Vui lòng thử lại."),
      };
    } finally {
      setConfirmingId(null);
    }
  };

  // ── Process ───────────────────────────────────────────────────────────────
  const processOrder = async (
    orderId: number,
    body: ProcessOrderRequest,
  ): Promise<MutationResult> => {
    setProcessingId(orderId);
    try {
      await orderApi.processOrder(orderId, body);
      onSuccess?.();
      return { success: true, message: "Đơn hàng đã chuyển sang trạng thái Đang xử lý." };
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, "Không thể xử lý đơn hàng. Vui lòng thử lại."),
      };
    } finally {
      setProcessingId(null);
    }
  };

  // ── Ship ──────────────────────────────────────────────────────────────────
  const shipOrder = async (
    orderId: number,
    body: ShipOrderRequest,
  ): Promise<ShipMutationResult> => {
    setShippingId(orderId);
    try {
      const data = await orderApi.shipOrder(orderId, body);
      onSuccess?.();
      return {
        success: true,
        message: `Đã tạo đơn vận chuyển. Mã tracking: ${data.trackingNumber ?? "N/A"}`,
        data,
      };
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, "Không thể tạo đơn vận chuyển. Vui lòng thử lại."),
      };
    } finally {
      setShippingId(null);
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const cancelOrder = async (
    orderId: number,
    body: CancelOrderRequest,
  ): Promise<MutationResult> => {
    setCancellingId(orderId);
    try {
      await orderApi.cancelOrder(orderId, body);
      onSuccess?.();
      return { success: true, message: "Đơn hàng đã được hủy thành công." };
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, "Không thể hủy đơn hàng. Vui lòng thử lại."),
      };
    } finally {
      setCancellingId(null);
    }
  };

  // ── Assign ────────────────────────────────────────────────────────────────
  const assignOrder = async (
    orderId: number,
    body: AssignOrderRequest,
  ): Promise<MutationResult> => {
    setAssigningId(orderId);
    try {
      await orderApi.assignOrder(orderId, body);
      onSuccess?.();
      return { success: true, message: "Đơn hàng đã được phân công lại thành công." };
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, "Không thể phân công đơn hàng. Vui lòng thử lại."),
      };
    } finally {
      setAssigningId(null);
    }
  };

  return {
    confirmOrder,
    processOrder,
    shipOrder,
    cancelOrder,
    assignOrder,
    confirmingId,
    processingId,
    shippingId,
    cancellingId,
    assigningId,
  };
};
