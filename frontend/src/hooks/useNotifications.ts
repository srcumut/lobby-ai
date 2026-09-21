"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "./useAuth";
import { notificationsApi } from "@/lib/api/notifications";
import { NotificationResponse } from "@/types";
import { toast } from "@/components/ui/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

function getWsBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname || "localhost";
    return `${protocol}//${hostname}:8080`;
  }
  return "ws://localhost:8080";
}

export function useNotifications() {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeOverrides, setRealtimeOverrides] = useState<Map<string, NotificationResponse>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // TanStack Query for server notifications (automatically refetches on window focus)
  const {
    data: serverNotifications = [],
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationsApi.getNotifications(),
    enabled: Boolean(isAuthenticated),
  });

  // Combine server data with realtime events/optimistic updates
  const notifications = useMemo(() => {
    const map = new Map<string, NotificationResponse>();

    // Put server items first
    serverNotifications.forEach((n) => map.set(n.id, n));

    // Apply any realtime additions/updates
    realtimeOverrides.forEach((val, key) => {
      map.set(key, val);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [serverNotifications, realtimeOverrides]);

  // WebSocket connection for real-time notifications with auto-reconnect
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let isSubscribed = true;

    const connectWs = () => {
      if (!isSubscribed) return;

      const baseWsUrl = getWsBaseUrl();
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

            setRealtimeOverrides((prev) => {
              const next = new Map(prev);
              next.set(newNotif.id, newNotif);
              return next;
            });

            // Invalidate query cache so server state catches up
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

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
          } else if (eventType === "direct_message.typing" && data.payload) {
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("lobby-ai:direct-message-typing", { detail: data.payload })
              );
            }
          } else if (eventType === "direct_message.reaction_updated" && data.payload) {
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("lobby-ai:direct-message-reaction", { detail: data.payload })
              );
            }
          }
        } catch (err: unknown) {
          console.error("Failed to parse notification WS message", err);
        }
      };

      ws.onerror = (err: Event) => {
        console.warn("Notification WS error", err);
      };

      ws.onclose = () => {
        if (isSubscribed) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWs();
          }, 3000);
        }
      };

      wsRef.current = ws;
    };

    const handleSendGlobalWs = (e: Event) => {
      const customEvent = e as CustomEvent<{ type?: string; event_type?: string; payload: any }>;
      const detail = customEvent.detail;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && detail) {
        const payloadToSend = {
          type: detail.type || detail.event_type,
          payload: detail.payload,
        };
        wsRef.current.send(JSON.stringify(payloadToSend));
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("lobby-ai:send-global-ws", handleSendGlobalWs);
    }

    connectWs();

    return () => {
      isSubscribed = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("lobby-ai:send-global-ws", handleSendGlobalWs);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, token, queryClient]);

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setRealtimeOverrides((prev) => {
        const next = new Map(prev);
        const current = next.get(id) || serverNotifications.find((n) => n.id === id);
        if (current) {
          next.set(id, { ...current, is_read: true });
        }
        return next;
      });

      try {
        await notificationsApi.markAsRead(id);
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      } catch (err: unknown) {
        console.error("Failed to mark notification as read", err);
      }
    },
    [serverNotifications, queryClient]
  );

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setRealtimeOverrides((prev) => {
      const next = new Map(prev);
      notifications.forEach((n) => {
        next.set(n.id, { ...n, is_read: true });
      });
      return next;
    });

    try {
      await notificationsApi.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    } catch (err: unknown) {
      console.error("Failed to mark all notifications as read", err);
    }
  }, [notifications, queryClient]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error: queryError ? String(queryError) : null,
    refresh: refetch,
    markAsRead,
    markAllAsRead,
  };
}
