// ============================================================================
// TARGET_DESTINATION: frontend/src/hooks/useDirectMessages.ts
// PURPOSE: Hook for managing real-time direct messages and conversations
// ============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Conversation, DirectMessage } from "@/types";
import { directMessagesApi } from "@/lib/api/direct_messages";
import { useAuth } from "./useAuth";

export function useDirectMessages(initialFriendId?: string | null) {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeFriendId, setActiveFriendId] = useState<string | null>(initialFriendId || null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFriendIdRef = useRef<string | null>(activeFriendId);
  activeFriendIdRef.current = activeFriendId;

  // Load conversations list
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await directMessagesApi.getConversations();
      setConversations(data);
    } catch (err: any) {
      console.error("Failed to load conversations", err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when active friend changes
  const loadMessages = useCallback(async (friendId: string) => {
    setIsLoadingMessages(true);
    setError(null);
    try {
      const data = await directMessagesApi.getMessages(friendId);
      setMessages(data);
      // Reset unread count for this friend in conversations list
      setConversations((prev) =>
        prev.map((c) =>
          c.friend.id === friendId ? { ...c, unread_count: 0 } : c
        )
      );
    } catch (err: any) {
      console.error("Failed to load messages", err);
      setError(err.response?.data?.error?.message || "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeFriendId && isAuthenticated) {
      loadMessages(activeFriendId);
    } else {
      setMessages([]);
    }
  }, [activeFriendId, isAuthenticated, loadMessages]);

  // Listen to real-time incoming DMs from global WebSocket
  useEffect(() => {
    const handleDirectMessage = (e: Event) => {
      const customEvent = e as CustomEvent<DirectMessage>;
      const newMsg = customEvent.detail;
      if (!newMsg) return;

      const currentFriendId = activeFriendIdRef.current;
      const otherUserId = newMsg.sender_id === user?.id ? newMsg.receiver_id : newMsg.sender_id;

      // If this message belongs to currently open conversation
      if (currentFriendId && otherUserId === currentFriendId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }

      // Update conversations list with the new last message
      setConversations((prev) => {
        const exists = prev.some((c) => c.friend.id === otherUserId);
        if (!exists) {
          // New conversation appeared; refetch
          fetchConversations();
          return prev;
        }

        return prev.map((c) => {
          if (c.friend.id === otherUserId) {
            const isCurrentChat = currentFriendId === otherUserId;
            return {
              ...c,
              last_message: newMsg,
              unread_count: isCurrentChat || newMsg.sender_id === user?.id ? c.unread_count : c.unread_count + 1,
            };
          }
          return c;
        });
      });
    };

    window.addEventListener("lobby-ai:direct-message", handleDirectMessage);
    return () => {
      window.removeEventListener("lobby-ai:direct-message", handleDirectMessage);
    };
  }, [user?.id, fetchConversations]);

  // Send a direct message
  const sendMessage = async (content: string) => {
    if (!activeFriendId || !content.trim() || isSending) return;
    setIsSending(true);
    try {
      const newMsg = await directMessagesApi.sendMessage(activeFriendId, content.trim());
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Update conversations preview
      setConversations((prev) =>
        prev.map((c) =>
          c.friend.id === activeFriendId ? { ...c, last_message: newMsg } : c
        )
      );
      return newMsg;
    } catch (err: any) {
      console.error("Failed to send direct message", err);
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  return {
    conversations,
    activeFriendId,
    setActiveFriendId,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    error,
    sendMessage,
    refreshConversations: fetchConversations,
  };
}