export type NotificationStatus = "Unread" | "Read" | "Archived";
export type NotificationType = "ORDER" | "PROMOTION" | "SYSTEM" | "BLOG" | "STOCK";

export interface BellNotification {
  deliveryId: number;
  notificationType: NotificationType;
  title: string;
  message: string;
  imageUrl?: string;
  actionType?: string;
  actionTarget?: string;
  createdAt: string;
  unreadCount: number;
}

export interface NotificationListItem {
  deliveryId: number;
  notificationType: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  imageUrl?: string;
  actionType?: string;
  actionTarget?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationListResponse {
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  items: NotificationListItem[];
}

export interface UnreadCountResponse {
  count: number;
}
