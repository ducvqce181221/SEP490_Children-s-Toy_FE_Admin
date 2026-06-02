"use client";

import { useAuthContext } from "@/context/AuthContext";
import { getNotificationHubUrl } from "@/lib/api-origin";
import { notificationApi } from "@/features/notifications/services/notification-api";
import { notificationHub } from "@/features/notifications/services/notification-hub";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";

type NotificationRealtimeValue = {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
};

const NotificationRealtimeContext =
  createContext<NotificationRealtimeValue | null>(null);

export function NotificationRealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isInitialized } = useAuthContext();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const { count } = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      /* axios đã toast lỗi */
    }
  }, []);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) {
      void notificationHub.disconnect();
      setUnreadCount(0);
      return;
    }

    const hubUrl = getNotificationHubUrl();
    const getToken = () =>
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    notificationHub.setCallbacks({
      onReceiveNotification: (n) => {
        setUnreadCount(n.unreadCount);
        toast.success(
          <div>
            <p className="font-semibold">{n.title}</p>
            <p className="text-sm opacity-90">{n.message}</p>
          </div>,
          { duration: 4000, id: `notif-${n.deliveryId}` },
        );
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("realtime-notification", { detail: n }));
        }
      },
      onUnreadCountUpdated: setUnreadCount,
      onNotificationRead: () => {
        void refreshUnread();
      },
    });

    void (async () => {
      try {
        await notificationHub.connect(hubUrl, getToken);
        await refreshUnread();
      } catch {
        void refreshUnread();
      }
    })();

    return () => {
      void notificationHub.disconnect();
    };
  }, [isAuthenticated, isInitialized, refreshUnread]);

  return (
    <NotificationRealtimeContext.Provider
      value={{ unreadCount, refreshUnread }}
    >
      {children}
    </NotificationRealtimeContext.Provider>
  );
}

export function useNotificationRealtime() {
  const ctx = useContext(NotificationRealtimeContext);
  if (!ctx)
    throw new Error(
      "useNotificationRealtime must be used within NotificationRealtimeProvider",
    );
  return ctx;
}
