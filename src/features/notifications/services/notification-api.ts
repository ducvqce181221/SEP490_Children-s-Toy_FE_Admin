import axiosClient from "@/configs/axios-client";
import type {
  NotificationListResponse,
  UnreadCountResponse,
} from "../types/notification";

const BASE = "/notifications";

export const notificationApi = {
  /** List bell notifications for the current user. */
  getNotifications: async (
    params: { status?: string; page?: number; pageSize?: number } = {},
  ): Promise<NotificationListResponse> => {
    const res = await axiosClient.get<{ data: any }>(BASE, { params });
    // Backend returns ApiResponse<PaginatedResponse<NotificationListDto>> 
    // which is { data: { items: [], totalCount: 0, ... } }
    return {
      items: res.data.items,
      total: res.data.totalCount,
      unreadCount: 0, // Unread count is in GetUnreadCount
      page: res.data.pageNumber,
      pageSize: res.data.pageSize,
    };
  },

  /** Get the current unread badge count. */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const res = await axiosClient.get<{ data: number }>(`${BASE}/unread-count`);
    // Backend returns ApiResponse<int> which is { data: count }
    return { count: res.data };
  },

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
