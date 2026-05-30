import axiosClient from "@/configs/axios-client";

export interface OrderQueueItem {
  queueId: number;
  orderId: number;
  orderCode: string;
  queuedAt: string;
  reason: string;
  isResolved: boolean;
  resolvedAt: string | null;
}

export interface AssignQueueOrderRequest {
  staffScheduleId: number;
  merchScheduleId: number;
  notes?: string;
}

export const orderQueueApi = {
  getQueue: (): Promise<OrderQueueItem[]> =>
    axiosClient.get<OrderQueueItem[]>("/order-queue"),

  assignQueue: (queueId: number, body: AssignQueueOrderRequest): Promise<void> =>
    axiosClient.post<void, AssignQueueOrderRequest>(`/order-queue/${queueId}/assign`, body),
};
