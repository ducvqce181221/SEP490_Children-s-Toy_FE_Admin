import { AxiosError } from "axios";
import { useState } from "react";
import { orderApi } from "../services/order-api";
import {
  ApiErrorResponse,
  ReassignOrderRequest,
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
    if (err instanceof AxiosError) {
      const data = err.response?.data as {
        message?: string;
        errorMessage?: string;
        code?: string;
        errorCode?: string;
        errors?: Record<string, string[]>;
      } | undefined;

      if (data?.errors) {
        const first = Object.values(data.errors).flat().find(Boolean);
        if (first) return first;
      }
      return data?.errorMessage ?? data?.message ?? fallback;
    }
    return fallback;
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
      return { success: true, message: "Order confirmed successfully." };
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, "Could not confirm order. Please try again."),
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
      return { success: true, message: "Order status updated to Processing." };
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, "Could not process order. Please try again."),
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
        message: `Shipping waybill created. Tracking No: ${data.trackingNumber ?? "N/A"}`,
        data,
      };
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, "Could not create shipping waybill. Please try again."),
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
      return { success: true, message: "Order cancelled successfully." };
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, "Could not cancel order. Please try again."),
      };
    } finally {
      setCancellingId(null);
    }
  };

  // ── Assign ────────────────────────────────────────────────────────────────
  const assignOrder = async (
    orderId: number,
    body: ReassignOrderRequest,
  ): Promise<MutationResult> => {
    setAssigningId(orderId);
    try {
      await orderApi.reassignOrder(orderId, body);
      onSuccess?.();
      return { success: true, message: "Order reassigned successfully." };
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, "Could not reassign order. Please try again."),
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
