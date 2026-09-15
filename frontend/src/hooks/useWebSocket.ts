import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

export type WsIncomingEvent = {
  type: string;
  payload: any;
};

export function useWebSocket(lobbyId: string) {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WsIncomingEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token || !lobbyId) return;

    // Connect to WebSocket
    const wsUrl = `ws://localhost:8080/ws/lobbies/${lobbyId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WS connected to lobby", lobbyId);
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data: WsIncomingEvent = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.error("Failed to parse WS message", event.data);
      }
    };

    ws.onerror = (event) => {
      console.error("WS Error:", event);
      setError("WebSocket connection error");
    };

    ws.onclose = () => {
      console.log("WS disconnected from lobby", lobbyId);
      setIsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [lobbyId, token]);

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

  return {
    isConnected,
    error,
    lastMessage,
    sendMessage,
  };
}
