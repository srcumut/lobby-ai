import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

export type WsIncomingEvent = {
  type: string;
  payload: unknown;
};

export interface TypingUser {
  userId: string;
  username: string;
  isBot?: boolean;
  avatarUrl?: string | null;
  expiresAt?: number;
}

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

export function useWebSocket(
  lobbyId: string,
  enabled: boolean = true,
  onMessage?: (event: WsIncomingEvent) => void
) {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WsIncomingEvent | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!token || !lobbyId || !enabled) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let isSubscribed = true;

    const connectWs = () => {
      if (!isSubscribed) return;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        wsRef.current.close();
      }

      const baseWsUrl = getWsBaseUrl();
      const wsUrl = `${baseWsUrl}/ws/lobbies/${lobbyId}?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!isSubscribed) {
          ws.close();
          return;
        }
        console.log("WS connected to lobby", lobbyId);
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const data: WsIncomingEvent = JSON.parse(event.data);
          setLastMessage(data);

          // Handle typing events
          const eventType = data.type;
          if (
            eventType === "typing.indicator" ||
            eventType === "user.typing" ||
            eventType === "typing"
          ) {
            const payload = (data.payload as Record<string, unknown>) || {};
            const senderId = (payload.user_id as string) || (payload.userId as string);
            const username = payload.username as string;
            const isTyping = (payload.is_typing as boolean | undefined) ?? true;
            const isBot = (payload.is_bot as boolean | undefined) ?? (payload.isBot as boolean | undefined) ?? false;
            const avatarUrl = (payload.avatar_url as string | null | undefined) ?? (payload.avatarUrl as string | null | undefined) ?? null;

            // Don't show typing indicator for the current user themselves
            if (senderId && senderId !== user?.id && username) {
              setTypingUsers((prev) => {
                if (!isTyping) {
                  return prev.filter((u) => u.userId !== senderId);
                }
                const filtered = prev.filter((u) => u.userId !== senderId);
                return [
                  ...filtered,
                  {
                    userId: senderId,
                    username,
                    isBot,
                    avatarUrl,
                    expiresAt: isBot ? Date.now() + 60000 : Date.now() + 3500,
                  },
                ];
              });
            }
          } else if (eventType === "message.created" && data.payload) {
            // Remove sender from typing list immediately when message is received
            const payload = data.payload as { sender?: { id?: string } };
            const senderId = payload.sender?.id;
            if (senderId) {
              setTypingUsers((prev) => prev.filter((u) => u.userId !== senderId));
            }
          }

          // Directly invoke the synchronous callback so no event is dropped due to React batching
          onMessageRef.current?.(data);
        } catch (err) {
          console.error("Failed to parse WS message", err, event.data);
        }
      };

      ws.onerror = (event) => {
        console.warn("WS Error:", event);
        setError("WebSocket bağlantı hatası");
      };

      ws.onclose = () => {
        if (!isSubscribed) return;
        console.log("WS disconnected from lobby", lobbyId);
        setIsConnected(false);

        // Auto-reconnect after 2 seconds if still mounted and enabled
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isSubscribed) {
            connectWs();
          }
        }, 2000);
      };

      wsRef.current = ws;
    };

    connectWs();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [lobbyId, token, user?.id, enabled]);

  // Periodic expiration cleanup for typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const active = prev.filter((u) => !u.expiresAt || u.expiresAt > now);
        return active.length === prev.length ? prev : active;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message.send",
          payload: { content },
        })
      );
    } else {
      console.error("Cannot send message, WS is not open");
      setError("Not connected to chat");
    }
  }, []);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: isTyping ? "typing.start" : "typing.stop",
            payload: {
              is_typing: isTyping,
              username: user?.username,
            },
          })
        );
      }
    },
    [user?.username]
  );

  const sendGameAction = useCallback((payload: unknown) => {

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "game.action",
          payload,
        })
      );
    }
  }, []);

  return {
    isConnected,
    error,
    lastMessage,
    sendMessage,
    sendTyping,
    sendGameAction,
    typingUsers,
    setTypingUsers,
  };

}
