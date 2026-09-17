"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { notificationsApi } from "@/lib/api/notifications";
import { NotificationResponse } from "@/types";
import { toast } from "@/components/ui/toast";

export function useNotifications() {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch notifications", err);
      setError("Failed to fetch notifications");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, fetchNotifications]);

  // WebSocket connection for real-time notifications with auto-reconnect
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let isSubscribed = true;

    const connectWs = () => {
      if (!isSubscribed) return;

      const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
      const wsUrl = `${baseWsUrl}/ws/notifications?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Connected to notification stream
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const eventType = data.type || data.event_type;

          if (eventType === "notification.new" && data.payload) {
            const payload = data.payload;
            const newNotif: NotificationResponse = {
              id: payload.id,
              type: payload.type || payload["r#type"] || "NOTIFICATION",
              title: payload.title,
              message: payload.message,
              related_entity_id: payload.related_entity_id,
              is_read: payload.is_read ?? false,
              created_at: payload.created_at || new Date().toISOString(),
            };

            setNotifications((prev) => {
              const filtered = prev.filter((n) => n.id !== newNotif.id);
              return [newNotif, ...filtered];
            });

            // Instant visual feedback via toast
            toast.add({
              title: newNotif.title,
              description: newNotif.message,
              type: "info",
            });
          } else if (eventType === "direct_message.created" && data.payload) {
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("lobby-ai:direct-message", { detail: data.payload })
              );
            }
          }
        } catch (err) {
          console.error("Failed to parse notification WS message", err);
        }
      };

      ws.onerror = (err) => {
        console.warn("Notification WS error", err);
      };

      ws.onclose = () => {
        if (isSubscribed) {
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWs();
          }, 3000);
        }
      };

      wsRef.current = ws;
    };

    connectWs();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, token]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await notificationsApi.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await notificationsApi.markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
