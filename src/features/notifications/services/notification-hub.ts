import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import type { BellNotification } from "../types/notification";

export type NotificationHubCallbacks = {
  onReceiveNotification?: (notification: BellNotification) => void;
  onNotificationRead?: (deliveryId: number) => void;
  onUnreadCountUpdated?: (count: number) => void;
};

class NotificationHubService {
  private connection: HubConnection | null = null;
  private callbacks: NotificationHubCallbacks = {};

  /** Build and start the hub connection. */
  async connect(hubUrl: string, getToken: () => string | null): Promise<void> {
    if (
      this.connection &&
      this.connection.state !== HubConnectionState.Disconnected
    ) {
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getToken() ?? "",
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) =>
          // Exponential backoff: 0, 2s, 10s, 30s, 60s, 60s…
          [0, 2000, 10000, 30000, 60000][Math.min(ctx.previousRetryCount, 4)],
      })
      .configureLogging(LogLevel.None)
      .build();

    this.connection.on("ReceiveNotification", (payload: BellNotification) => {
      this.callbacks.onReceiveNotification?.(payload);
    });

    this.connection.on("NotificationRead", (deliveryId: number) => {
      this.callbacks.onNotificationRead?.(deliveryId);
    });

    this.connection.on("UnreadCountUpdated", (count: number) => {
      this.callbacks.onUnreadCountUpdated?.(count);
    });

    this.connection.onreconnected(async () => {
      // Sync unread count from REST after reconnect
      try {
        const { notificationApi } = await import("./notification-api");
        const { count } = await notificationApi.getUnreadCount();
        this.callbacks.onUnreadCountUpdated?.(count);
      } catch {
        // best effort
      }
    });

    await this.connection.start();
  }

  /** Register event callbacks. Call before connect or immediately after. */
  setCallbacks(callbacks: NotificationHubCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /** Tell the server to mark a delivery as read and sync all tabs. */
  async markAsRead(deliveryId: number): Promise<void> {
    if (
      !this.connection ||
      this.connection.state !== HubConnectionState.Connected
    ) {
      return;
    }
    await this.connection.invoke("MarkAsRead", deliveryId);
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  get isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}

/** Singleton hub instance for use across the app. */
export const notificationHub = new NotificationHubService();
