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
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const partnerTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeFriendIdRef = useRef<string | null>(activeFriendId);
  useEffect(() => {
    activeFriendIdRef.current = activeFriendId;
  }, [activeFriendId]);

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
      setError(err.response?.data?.error?.message || "Mesajlar yüklenemedi");
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
    return () => {
      setPartnerIsTyping(false);
      if (partnerTypingTimeoutRef.current) {
        clearTimeout(partnerTypingTimeoutRef.current);
      }
    };
  }, [activeFriendId, isAuthenticated, loadMessages]);

  // Listen to real-time incoming DMs and typing events from global WebSocket
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
        // Clear typing indicator since new message arrived
        setPartnerIsTyping(false);
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

    const handleDirectMessageTyping = (e: Event) => {
      const customEvent = e as CustomEvent<{ sender_id: string; is_typing: boolean }>;
      const { sender_id, is_typing } = customEvent.detail || {};
      if (sender_id && activeFriendIdRef.current === sender_id) {
        setPartnerIsTyping(Boolean(is_typing));
        if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
        if (is_typing) {
          partnerTypingTimeoutRef.current = setTimeout(() => {
            setPartnerIsTyping(false);
          }, 3500);
        }
      }
    };

    const handleDirectMessageReaction = (e: Event) => {
      const customEvent = e as CustomEvent<{ message_id: string; reactions: DirectMessage['reactions'] }>;
      const { message_id, reactions } = customEvent.detail || {};
      if (message_id && reactions) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message_id ? { ...m, reactions } : m))
        );
      }
    };

    window.addEventListener("lobby-ai:direct-message", handleDirectMessage);
    window.addEventListener("lobby-ai:direct-message-typing", handleDirectMessageTyping);
    window.addEventListener("lobby-ai:direct-message-reaction", handleDirectMessageReaction);
    return () => {
      window.removeEventListener("lobby-ai:direct-message", handleDirectMessage);
      window.removeEventListener("lobby-ai:direct-message-typing", handleDirectMessageTyping);
      window.removeEventListener("lobby-ai:direct-message-reaction", handleDirectMessageReaction);
    };
  }, [user?.id, fetchConversations]);

  // Send typing event over global WebSocket
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!activeFriendId || typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("lobby-ai:send-global-ws", {
        detail: {
          type: "direct_message.typing",
          event_type: "direct_message.typing",
          payload: {
            receiver_id: activeFriendId,
            is_typing: isTyping,
          },
        },
      })
    );
  }, [activeFriendId]);

  // Send a direct message
  const sendMessage = async (content: string) => {
    if (!activeFriendId || !content.trim() || isSending) return;
    setIsSending(true);
    sendTyping(false);
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

  // Toggle a reaction on a direct message
  const toggleReaction = async (messageId: string, reaction: string) => {
    try {
      const res = await directMessagesApi.toggleReaction(messageId, reaction);
      if (res && res.reactions) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: res.reactions } : m))
        );
      }
    } catch (err: any) {
      console.error("Failed to toggle reaction", err);
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
    partnerIsTyping,
    sendTyping,
    error,
    sendMessage,
    toggleReaction,
    refreshConversations: fetchConversations,
  };
}