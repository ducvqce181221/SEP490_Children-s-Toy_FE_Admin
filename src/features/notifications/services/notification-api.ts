import axiosClient from "@/configs/axios-client";
import type {
  NotificationListResponse,
  UnreadCountResponse,
} from "../types/notification";

const BASE = "/notifications";

export const notificationApi = {
  /** List bell notifications for the current user. */
  getNotifications: (
    params: { status?: string; page?: number; pageSize?: number } = {},
  ): Promise<NotificationListResponse> =>
    axiosClient.get<NotificationListResponse>(BASE, { params }),

  /** Get the current unread badge count. */
  getUnreadCount: (): Promise<UnreadCountResponse> =>
    axiosClient.get<UnreadCountResponse>(`${BASE}/unread-count`),

  /** Mark a single delivery as read. */
  markRead: (deliveryId: number): Promise<void> =>
    axiosClient.patch<void>(`${BASE}/${deliveryId}/read`),

  /** Mark all unread as read. */
  markAllRead: (): Promise<void> =>
    axiosClient.patch<void>(`${BASE}/mark-all-read`),

  /** Archive a delivery. */
  archive: (deliveryId: number): Promise<void> =>
    axiosClient.patch<void>(`${BASE}/${deliveryId}/archive`),

  /** Record a click action for campaign stats. */
  recordClick: (deliveryId: number): Promise<void> =>
    axiosClient.post<void>(`${BASE}/${deliveryId}/click`),
};
