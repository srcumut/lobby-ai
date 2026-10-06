// ============================================================================
// TARGET_DESTINATION: frontend/src/app/lobby/[id]/page.tsx
// PURPOSE: Real-time Lobby Chat page with avatar thumbnails for users and AI bots
// ============================================================================

"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { lobbiesApi, MessageResponse } from "@/lib/api/lobbies";
import { useWebSocket, WsIncomingEvent } from "@/hooks/useWebSocket";
import { Lobby, LobbyMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Ban, UserMinus, MicOff, Mic, Settings, Bot, Gamepad2, Swords, Dices, Coins, Sparkles, BarChart2, Pencil, Trash2, Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LobbySettingsDialog } from "@/components/lobby/LobbySettingsDialog";
import { LobbyXpBar } from "@/components/lobby/LobbyXpBar";
import { LobbyGamesBar } from "@/components/lobby/LobbyGamesBar";
import { LobbyGameCard, isLobbyGameMessage } from "@/components/lobby/LobbyGameCard";
import { LobbySlotSpinner } from "@/components/lobby/LobbySlotSpinner";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { MembersList } from "@/components/lobby/MembersList";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { LobbyTrivia } from "@/components/lobby/LobbyTrivia";
import { LobbyRpsDuel } from "@/components/lobby/LobbyRpsDuel";
import { LobbyActivityMenu } from "@/components/lobby/LobbyActivityMenu";
import { RichGameCard, isRichGameMessage } from "@/components/chat/RichGameCard";
import { getRandomIcebreaker } from "@/lib/icebreakers";
import { CreatePollModal } from "@/components/lobby/CreatePollModal";
import { LobbyPollCard } from "@/components/lobby/LobbyPollCard";
import { LobbyPollsDialog } from "@/components/lobby/LobbyPollsDialog";
import { pollsApi, Poll } from "@/lib/api/polls";
import { toast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getAvatarUrl } from "@/lib/avatar";
import { getLobbyTheme } from "@/lib/lobbyThemes";
import { trackQuestAction } from "@/data/dailyQuests";
import { getEquippedCosmetics, getLobbyThemeStyles } from "@/lib/cosmetics";



export default function LobbyChatPage({ params }: { params: Promise<{ id: string }> }) {
  // Use React.use to unwrap params in Next.js 15+
  const resolvedParams = use(params);
  const lobbyId = resolvedParams.id;
  
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [unreadMessages, setUnreadMessages] = useState(false);
  const [quickGamePending, setQuickGamePending] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Mention system state
  const [lobbyMembers, setLobbyMembers] = useState<LobbyMember[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const handleOpenProfile = (userId: string) => {
    setSelectedProfileId(userId);
    setProfileOpen(true);
  };

  const [isMemberVerified, setIsMemberVerified] = useState(false);
  const [equippedLobbyTheme, setEquippedLobbyTheme] = useState<string | null>(null);

  useEffect(() => {
    const cosmetics = getEquippedCosmetics();
    setEquippedLobbyTheme(cosmetics.lobby_theme || null);

    const handleCosmeticsUpdate = (e: any) => {
      setEquippedLobbyTheme(e.detail?.lobby_theme || null);
    };

    window.addEventListener("lobby:cosmetics_updated", handleCosmeticsUpdate);
    return () => window.removeEventListener("lobby:cosmetics_updated", handleCosmeticsUpdate);
  }, []);

  const lobbyChatTheme = getLobbyThemeStyles(equippedLobbyTheme);

  // Role detection
  const myLobbyMember = lobbyMembers.find((m) => m.user_id === user?.id);
  const myRole = lobby?.owner_id === user?.id ? "OWNER" : (myLobbyMember?.role || "MEMBER");
  const canModerate = myRole === "OWNER" || myRole === "MODERATOR";

  // Party Game States
  const [triviaActive, setTriviaActive] = useState(false);
  const [incomingGameEvent, setIncomingGameEvent] = useState<{
    sender_id: string;
    sender_username: string;
    data?: any;
  } | null>(null);


  const [rpsDuelState, setRpsDuelState] = useState<{
    isOpen: boolean;
    opponentId: string;
    opponentUsername: string;
    isInitiator: boolean;
    opponentIsBot?: boolean;
  }>({
    isOpen: false,
    opponentId: "",
    opponentUsername: "",
    isInitiator: false,
    opponentIsBot: false,
  });

  const [pendingRpsChallenge, setPendingRpsChallenge] = useState<{
    fromUserId: string;
    fromUsername: string;
  } | null>(null);

  // Poll States
  const [polls, setPolls] = useState<Poll[]>([]);
  const [createPollOpen, setCreatePollOpen] = useState(false);
  const [pollsDialogOpen, setPollsDialogOpen] = useState(false);
  const [isPollsBannerDismissed, setIsPollsBannerDismissed] = useState(false);
  const [isPollCollapsed, setIsPollCollapsed] = useState(false);


  // Edit & Delete Message States
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStartEdit = (msg: MessageResponse) => {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleSaveEdit = async (msgId: string) => {
    const trimmed = editingContent.trim();
    if (!trimmed) {
      toast.add({
        title: "Hata",
        description: "Mesaj içeriği boş bırakılamaz.",
        type: "error",
      });
      return;
    }
    setIsSubmittingEdit(true);
    try {
      const updated = await lobbiesApi.updateMessage(lobbyId, msgId, trimmed);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, ...updated } : m))
      );
      setEditingMessageId(null);
      setEditingContent("");
      toast.add({
        title: "Mesaj Güncellendi",
        description: "Mesajınız başarıyla düzenlendi.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Düzenleme Başarısız",
        description: err.response?.data?.error?.message || "Mesaj düzenlenemedi.",
        type: "error",
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMessageId) return;
    setIsDeleting(true);
    try {
      await lobbiesApi.deleteMessage(lobbyId, deletingMessageId);
      setMessages((prev) => prev.filter((m) => m.id !== deletingMessageId));
      toast.add({
        title: "Mesaj Silindi",
        description: "Mesaj odadan kaldırıldı.",
        type: "info",
      });
      setDeletingMessageId(null);
    } catch (err: any) {
      toast.add({
        title: "Silme Başarısız",
        description: err.response?.data?.error?.message || "Mesaj silinemedi.",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Typing state refs
  const lastTypingSentRef = useRef<number>(0);
  const stopTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket hook - only connects once membership is verified
  const handleIncomingWsEvent = useCallback((event: WsIncomingEvent) => {

    if (event.type === "message.created") {
      const newMsg = event.payload as MessageResponse;
      if (newMsg.sender.id === user?.id && /^(🎲 Zar attı:|🪙 Yazı-tura attı:|🎰 \[SLOT\])/.test(newMsg.content)) {
        setQuickGamePending(null);
      }
      if (newMsg.content.startsWith("🎰 [SLOT]:")) setQuickGamePending(null);
      if (newMsg.content.startsWith("🎰 [SLOT]:") && newMsg.content.includes("JACKPOT!")) {
        setShowConfetti(true);
        window.setTimeout(() => setShowConfetti(false), 1800);
      }
      setMessages((prev) => {
        // If an optimistic temp message exists matching content and sender, replace it
        const tempIndex = prev.findIndex(
          (m) => m.id.startsWith("temp-") && m.sender.id === newMsg.sender.id && m.content === newMsg.content
        );
        if (tempIndex !== -1) {
          const next = [...prev];
          next[tempIndex] = newMsg;
          return next;
        }
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } else if (event.type === "bomb.expired") {
      const payload = event.payload as { target?: number };
      setMessages((prev) => [...prev, {
        id: `sys-bomb-${Date.now()}`,
        lobby_id: lobbyId,
        sender: { id: "system", username: "Sistem", display_name: null, avatar_url: null },
        content: `💣 [BOMBA]: Süre doldu! Bomba sayısı ${payload.target ?? "?"} idi.`,
        is_bot: true,
        created_at: new Date().toISOString(),
      }]);
    } else if (event.type === "lobby.xp.updated") {
      const payload = event.payload as { xp?: number };
      const xp = payload.xp;
      if (typeof xp === "number") setLobby((prev) => prev ? { ...prev, xp } : prev);
    } else if (event.type === "message.updated") {
      const updatedMsg = event.payload as MessageResponse;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg))
      );
    } else if (event.type === "message.deleted") {
      const payload = event.payload as { message_id?: string };
      if (payload?.message_id) {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.message_id));
      }
    } else if (event.type === "user.joined") {
      const payload = event.payload as { user?: { username?: string; id?: string } } | undefined;
      const username = payload?.user?.username || "Bir kullanıcı";
      if (payload?.user?.id !== user?.id) {
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}-${Math.random()}`,
            lobby_id: lobbyId,
            sender: { id: "system", username: "Sistem", display_name: null, avatar_url: null },
            content: `${username} odaya katıldı.`,
            is_bot: true,
            created_at: new Date().toISOString(),
          },
        ]);
        // Immediately fetch fresh member list so new joiner appears in real-time
        lobbiesApi.getMembers(lobbyId).then((freshMembers) => {
          setLobbyMembers(freshMembers);
          setLobby((prev) => prev ? { ...prev, member_count: freshMembers.length } : prev);
        }).catch(console.error);
        queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.members(lobbyId) });
      }
    } else if (event.type === "user.left") {
      const payload = event.payload as { user?: { username?: string; id?: string } } | undefined;
      const username = payload?.user?.username || "Bir kullanıcı";
      const leftUserId = payload?.user?.id;
      if (leftUserId && leftUserId !== user?.id) {
        setLobbyMembers((prev) => prev.filter((m) => m.user_id !== leftUserId));
        setLobby((prev) => prev ? { ...prev, member_count: Math.max(0, prev.member_count - 1) } : prev);
        queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.members(lobbyId) });
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}-${Math.random()}`,
            lobby_id: lobbyId,
            sender: { id: "system", username: "Sistem", display_name: null, avatar_url: null },
            content: `${username} odadan ayrıldı.`,
            is_bot: true,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } else if (event.type === "moderation.event") {
      const { action, target_user_id, duration_minutes, role: newRole } =
        (event.payload as { action?: string; target_user_id?: string; duration_minutes?: number; role?: string } || {});

      // Immediate real-time member list sync on moderation actions
      if (action === "kick" || action === "ban") {
        if (target_user_id) {
          setLobbyMembers((prev) => prev.filter((m) => m.user_id !== target_user_id));
          setLobby((prev) => prev ? { ...prev, member_count: Math.max(0, prev.member_count - 1) } : prev);
          queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.members(lobbyId) });
        }

        if (target_user_id === user?.id) {
          toast.add({
            title: action === "kick" ? "Lobiden Atıldınız" : "Lobiden Yasaklandınız",
            description: action === "kick" ? "Lobi yöneticisi sizi bu lobiden çıkardı." : "Lobi yöneticisi sizi bu lobiden yasakladı.",
            type: "error",
          });
          router.push("/lobbies");
          return;
        }
      } else if (action === "role_update") {
        if (target_user_id && newRole) {
          setLobbyMembers((prev) =>
            prev.map((m) => (m.user_id === target_user_id ? { ...m, role: newRole } : m))
          );
          queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.members(lobbyId) });

          if (target_user_id === user?.id) {
            const roleName = newRole === "MODERATOR" ? "Moderatör" : "Üye";
            toast.add({
              title: "Rolünüz Güncellendi",
              description: `Bu lobideki yetkiniz "${roleName}" olarak güncellendi.`,
              type: "info",
            });
          }
        }
      }

      if (target_user_id === user?.id) {
        if (action === "mute") {
          const durationStr = duration_minutes ? `${duration_minutes} dakika` : "süresiz olarak";
          setMessages((prev) => [
            ...prev,
            {
              id: `sys-${Date.now()}`,
              lobby_id: lobbyId,
              sender: { id: "system", username: "Sistem", display_name: null, avatar_url: null },
              content: `Moderatörler tarafından ${durationStr} susturuldunuz.`,
              is_bot: true,
              created_at: new Date().toISOString(),
            },
          ]);
        } else if (action === "unmute") {
          setMessages((prev) => [
            ...prev,
            {
              id: `sys-${Date.now()}`,
              lobby_id: lobbyId,
              sender: { id: "system", username: "Sistem", display_name: null, avatar_url: null },
              content: `Susturmanız kaldırıldı, artık mesaj yazabilirsiniz.`,
              is_bot: true,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } else {
        // Someone else was moderated
        setMessages((prev) => {
          const prevMsg = prev.find((m) => m.sender.id === target_user_id);
          const username = prevMsg ? prevMsg.sender.username : "Bir kullanıcı";

          let sysContent = "";
          if (action === "kick") sysContent = `${username} lobiden atıldı.`;
          if (action === "ban") sysContent = `${username} lobiden yasaklandı.`;
          if (action === "mute") sysContent = `${username} susturuldu.`;
          if (action === "unmute") sysContent = `${username} susturması kaldırıldı.`;
          if (action === "role_update") sysContent = `${username} rolü güncellendi: ${newRole === "MODERATOR" ? "Moderatör" : "Üye"}.`;

          if (!sysContent) return prev;

          return [
            ...prev,
            {
              id: `sys-${Date.now()}`,
              lobby_id: lobbyId,
              sender: { id: "system", username: "Sistem", display_name: null, avatar_url: null },
              content: sysContent,
              is_bot: true,
              created_at: new Date().toISOString(),
            },
          ];
        });
      }
    } else if (event.type === "user.role_updated") {
      const payload = event.payload as { user_id?: string; role?: string; lobby_id?: string } | undefined;
      const targetId = payload?.user_id;
      const newRole = payload?.role;
      if (targetId && newRole) {
        setLobbyMembers((prev) =>
          prev.map((m) => (m.user_id === targetId ? { ...m, role: newRole } : m))
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.members(lobbyId) });

        if (targetId === user?.id) {
          const roleName = newRole === "MODERATOR" ? "Moderatör" : "Üye";
          toast.add({
            title: "Rolünüz Güncellendi",
            description: `Bu lobideki yetkiniz "${roleName}" olarak güncellendi.`,
            type: "info",
          });
        }
      }
    } else if (event.type === "game.event") {
      const payload = event.payload as {
        sender_id: string;
        sender_username: string;
        data: any;
      };
      setIncomingGameEvent(payload);

      const actionData = payload?.data;
      if (actionData.type === "slot_spin") {
        setQuickGamePending("/slot");
        window.setTimeout(() => setQuickGamePending(null), 1800);
      } else if (actionData.type === "trivia_session_start") {
        setTriviaActive(true);
      } else if (actionData.gameType === "rps" && actionData.type === "rps_challenge" && actionData.targetId === user?.id) {
        toast.add({
          title: "✊ Taş-Kağıt-Makas Meydan Okuma!",
          description: `${payload.sender_username} seninle Taş-Kağıt-Makas oynamak istiyor!`,
          type: "info",
        });
        setPendingRpsChallenge({
          fromUserId: payload.sender_id,
          fromUsername: payload.sender_username,
        });
      } else if (actionData.gameType === "rps" && actionData.type === "rps_accept" && actionData.targetId === user?.id) {
        setRpsDuelState({
          isOpen: true,
          opponentId: payload.sender_id,
          opponentUsername: payload.sender_username,
          isInitiator: true,
          opponentIsBot: false,
        });
        setPendingRpsChallenge(null);
      } else if (actionData.gameType === "rps" && actionData.type === "rps_decline" && actionData.targetId === user?.id) {
        toast.add({
          title: "Meydan Okuma Reddedildi",
          description: `${payload.sender_username} Taş-Kağıt-Makas düellosunu reddetti.`,
          type: "info",
        });
      }
    } else if (event.type === "poll.created") {
      const newPoll = event.payload as Poll;
      if (newPoll && newPoll.id) {
        setPolls((prev) => [newPoll, ...prev.filter((p) => p.id !== newPoll.id)]);
      }
    } else if (event.type === "poll.updated") {
      const updatedPoll = event.payload as Poll;
      if (updatedPoll && updatedPoll.id) {
        setPolls((prev) => prev.map((p) => (p.id === updatedPoll.id ? updatedPoll : p)));
      }
    }
  }, [user?.id, lobbyId, router]);


  const {
    isConnected,
    error: wsError,
    sendMessage: rawSendMessage,
    sendTyping,
    sendGameAction,
    typingUsers,
    setTypingUsers,
  } = useWebSocket(lobbyId, isMemberVerified, handleIncomingWsEvent);

  const sendMessage = useCallback((content: string) => {
    if (content.startsWith("/zar")) {
      trackQuestAction("dice_rolled");
    } else if (content.startsWith("/tkm") || content.includes("Taş-Kağıt-Makas")) {
      trackQuestAction("rps_played");
    } else if (content.startsWith("/soru") || content.includes("[GÜNÜN TARTIŞMA SORUSU]")) {
      trackQuestAction("icebreaker_sent");
    } else {
      trackQuestAction("message_sent");
    }

    if (content.includes("@")) {
      trackQuestAction("ai_chat");
    }

    rawSendMessage(content);
  }, [rawSendMessage]);

  const runQuickGame = useCallback((command: string) => {
    if (!isConnected) return;
    if (["/zar", "/yazitura", "/slot"].includes(command)) {
      setQuickGamePending(command);
      window.setTimeout(() => setQuickGamePending(null), 5000);
    }
    if (command === "/slot") {
      sendGameAction({ type: "slot_spin" });
      window.setTimeout(() => sendMessage(command), 1000);
    } else {
      sendMessage(command);
    }
  }, [isConnected, sendMessage, sendGameAction]);


  // Fetch initial data
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    
    const loadData = async () => {
      try {
        // Step 1: Load lobby details and members first
        const [lobbyData, initialMembers] = await Promise.all([
          lobbiesApi.getLobbyById(lobbyId),
          lobbiesApi.getMembers(lobbyId),
        ]);

        let currentMembers = initialMembers;
        const isMember = currentMembers.some((m) => m.user_id === user?.id) || lobbyData.owner_id === user?.id;

        // Step 2: If user is not yet recorded as a member, automatically attempt to join.
        // This succeeds immediately for users with an APPROVED invitation/request or in public lobbies!
        if (!isMember) {
          try {
            await lobbiesApi.joinLobby(lobbyId, {});
            // Re-fetch members to include the newly joined user
            currentMembers = await lobbiesApi.getMembers(lobbyId);
          } catch (joinErr: any) {
            // If already a member (409 conflict), proceed
            if (joinErr.response?.status !== 409) {
              throw joinErr;
            }
          }
        }

        setIsMemberVerified(true);
        setLobby(lobbyData);
        setLobbyMembers(currentMembers);
        trackQuestAction("lobby_visited");

        // Step 3: Now that membership is active, load messages safely
        const messagesData = await lobbiesApi.getMessages(lobbyId);
        // Backend might return messages descending (newest first). Let's reverse to show oldest first at top
        setMessages(messagesData.reverse());

        // Step 4: Load polls for this lobby
        try {
          const pollsData = await pollsApi.getPolls(lobbyId);
          setPolls(pollsData);
        } catch (e) {
          console.error("Failed to load polls:", e);
        }

        // Save to recently visited lobbies in localStorage

        try {
          const RECENT_KEY = "lobby-ai:recent-lobbies";
          const raw = localStorage.getItem(RECENT_KEY);
          const currentList = raw ? JSON.parse(raw) : [];
          const updatedList = [
            {
              id: lobbyData.id,
              name: lobbyData.name,
              description: lobbyData.description,
              member_count: lobbyData.member_count,
              visitedAt: Date.now(),
            },
            ...currentList.filter((item: any) => item.id !== lobbyData.id),
          ].slice(0, 8);
          localStorage.setItem(RECENT_KEY, JSON.stringify(updatedList));
        } catch (e) {
          console.error("Failed to record recent lobby:", e);
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Lobi yüklenemedi");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [lobbyId, isAuthenticated, user?.id]);

  // Handle incoming WS events
  const refreshMembers = async () => {
    try {
      const membersData = await lobbiesApi.getMembers(lobbyId);
      setLobbyMembers(membersData);
    } catch (err) {
      console.error(err);
    }
  };

  // Keep members and roles fresh on tab focus and periodic interval
  useEffect(() => {
    if (!isAuthenticated || !lobbyId) return;

    const onFocus = () => {
      refreshMembers();
    };

    window.addEventListener("focus", onFocus);

    const interval = setInterval(() => {
      refreshMembers();
    }, 10000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [isAuthenticated, lobbyId]);

  const scrollToLatest = useCallback(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    isNearBottomRef.current = true;
    setUnreadMessages(false);
  }, []);

  // Follow the conversation only while the reader is already at the bottom.
  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    if (isNearBottomRef.current) container.scrollTop = container.scrollHeight;
    else setUnreadMessages(true);
  }, [messages]);

  useEffect(() => {
    if (quickGamePending && isNearBottomRef.current && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [quickGamePending]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputMessage.trim();
    if (!content || !isConnected || !user) return;
    
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }
    sendTyping(false);

    if (content === "/trivia") {
      setTriviaActive(true);
      setInputMessage("");
      return;
    }

    if (content === "/anket" || content === "/poll") {
      setCreatePollOpen(true);
      setInputMessage("");
      return;
    }

    if (["/zar", "/yazitura", "/slot", "/bomba", "/dvc"].includes(content)) {
      runQuickGame(content);
      setInputMessage("");
      return;
    }



    // Optimistically add user's message immediately so it's always rendered right away
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMsg: MessageResponse = {
      id: tempId,
      lobby_id: lobbyId,
      sender: {
        id: user.id,
        username: user.username,
        display_name: user.display_name || null,
        avatar_url: user.avatar_url || null,
      },
      content,
      is_bot: false,
      created_at: new Date().toISOString(),
    };
    if (!/^\d{1,3}$/.test(content) && !content.startsWith("/dvc ")) {
      setMessages((prev) => [...prev, optimisticMsg]);
    }

    sendMessage(content);
    setInputMessage("");
    setMentionQuery(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputMessage(val);

    if (val.trim()) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 2000) {
        sendTyping(true);
        lastTypingSentRef.current = now;
      }
      if (stopTypingTimeoutRef.current) {
        clearTimeout(stopTypingTimeoutRef.current);
      }
      stopTypingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 2500);
    } else {
      sendTyping(false);
    }

    const cursor = e.target.selectionStart;
    if (cursor === null) return;

    // Find if we are typing a mention
    const textBeforeCursor = val.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const filteredMentions = mentionQuery !== null 
    ? lobbyMembers.filter(m => m.username.toLowerCase().includes(mentionQuery.toLowerCase()) && m.user_id !== user?.id)
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery !== null && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMentions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMentions[mentionIndex].username);
      } else if (e.key === "Escape") {
        setMentionQuery(null);
      }
    }
  };

  const insertMention = (username: string) => {
    const cursor = (document.activeElement as HTMLInputElement)?.selectionStart || inputMessage.length;
    const textBeforeCursor = inputMessage.slice(0, cursor);
    const textAfterCursor = inputMessage.slice(cursor);
    
    const newTextBefore = textBeforeCursor.replace(/@[a-zA-Z0-9_]*$/, `@${username} `);
    setInputMessage(newTextBefore + textAfterCursor);
    setMentionQuery(null);
  };

  const handleModeration = async (action: 'kick' | 'mute' | 'unmute' | 'ban', targetUserId: string, durationMinutes?: number | null) => {
    try {
      await lobbiesApi.moderateUser(lobbyId, action, targetUserId, durationMinutes);
      const actionLabels: Record<string, string> = {
        kick: "Lobiden atıldı",
        ban: "Lobiden yasaklandı",
        mute: "Susturuldu",
        unmute: "Susturması kaldırıldı",
      };
      toast.add({
        title: "İşlem Başarılı",
        description: `Kullanıcı başarıyla ${actionLabels[action] || action}.`,
        type: "success",
      });
    } catch (e: any) {
      console.error("Moderation error:", e.response?.data || e);
      toast.add({
        title: "İşlem Başarısız",
        description: e.response?.data?.error?.message || "Moderasyon işlemi uygulanamadı.",
        type: "error",
      });
    }
  };


  const handleChallengeRps = (targetId: string, targetUsername: string, isBot?: boolean) => {
    if (!isConnected || !user) return;
    if (isBot) {
      setRpsDuelState({
        isOpen: true,
        opponentId: targetId,
        opponentUsername: targetUsername,
        isInitiator: true,
        opponentIsBot: true,
      });
      sendMessage(`✊ @${targetUsername} ile Taş-Kağıt-Makas düellosu başlattım! 🤖`);
      return;
    }
    sendGameAction({
      gameType: "rps",
      type: "rps_challenge",
      targetId,
    });
    toast.add({
      title: "Taş-Kağıt-Makas Meydan Okuması",
      description: `${targetUsername} kullanıcısına meydan okuma gönderildi.`,
      type: "info",
    });
  };

  const handleAcceptRpsChallenge = () => {
    if (!pendingRpsChallenge || !user) return;
    sendGameAction({
      gameType: "rps",
      type: "rps_accept",
      targetId: pendingRpsChallenge.fromUserId,
    });
    setRpsDuelState({
      isOpen: true,
      opponentId: pendingRpsChallenge.fromUserId,
      opponentUsername: pendingRpsChallenge.fromUsername,
      isInitiator: false,
      opponentIsBot: false,
    });
    setPendingRpsChallenge(null);
  };

  const handleDeclineRpsChallenge = () => {
    if (!pendingRpsChallenge) return;
    sendGameAction({
      gameType: "rps",
      type: "rps_decline",
      targetId: pendingRpsChallenge.fromUserId,
    });
    setPendingRpsChallenge(null);
  };

  // Handle global accept event dispatched from RichGameCard challenge box
  useEffect(() => {
    const handleRpsGlobalAccept = (e: Event) => {
      const customEvent = e as CustomEvent<{ challengerUsername: string }>;
      const challengerUsername = customEvent.detail?.challengerUsername;
      if (!challengerUsername || !user) return;

      const challenger = lobbyMembers.find(
        (m) => m.username.toLowerCase() === challengerUsername.toLowerCase()
      );
      if (!challenger || challenger.user_id === user.id) return;

      setRpsDuelState({
        isOpen: true,
        opponentId: challenger.user_id,
        opponentUsername: challenger.username,
        opponentIsBot: challenger.is_bot,
        isInitiator: false,
      });

      sendGameAction({
        gameType: "rps",
        type: "rps_accept",
        targetId: challenger.user_id,
      });

      sendMessage(`⚔️ @${user.username}, @${challenger.username} tarafından açılan Taş-Kağıt-Makas meydan okumasını kabul etti!`);
    };

    window.addEventListener("lobby:rps_accept_challenge", handleRpsGlobalAccept);
    return () => {
      window.removeEventListener("lobby:rps_accept_challenge", handleRpsGlobalAccept);
    };
  }, [lobbyMembers, user, sendGameAction, sendMessage]);

  const handleDropIcebreaker = () => {
    const q = getRandomIcebreaker();
    sendMessage(`❄️ [GÜNÜN TARTIŞMA SORUSU]: ${q}`);
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    try {
      const updated = await pollsApi.votePoll(lobbyId, pollId, optionId);
      setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      trackQuestAction("poll_voted");
    } catch (err: any) {
      toast.add({
        title: "Hata",
        description: err.response?.data?.error?.message || "Oy verilemedi.",
        type: "error",
      });
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      const updated = await pollsApi.closePoll(lobbyId, pollId);
      setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.add({
        title: "Anket Sonlandırıldı",
        description: "Anket başarıyla kapatıldı.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Hata",
        description: err.response?.data?.error?.message || "Anket kapatılamadı.",
        type: "error",
      });
    }
  };

  const renderMessageContent = (content: string, currentUsername?: string) => {


    const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@") && part.length > 1) {
        const mentionedName = part.slice(1);
        const isMe = currentUsername && mentionedName.toLowerCase() === currentUsername.toLowerCase();
        return (
          <span
            key={index}
            className={`inline-block font-bold rounded px-1.5 py-0.5 text-xs mx-0.5 border ${
              isMe
                ? "bg-[#FEF08A] text-black border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                : "bg-blue-100 text-blue-900 border-blue-400"
            }`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const activePollsCount = polls.filter((p) => !p.is_closed).length;
  const latestActivePoll = polls.find((p) => !p.is_closed);

  if (isLoading) {

    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl font-bold animate-pulse">Lobi yükleniyor...</div>
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="bg-destructive/20 text-destructive brutal-border p-6 rounded-sm max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-2">Hata</h2>
          <p className="font-medium">{error || "Lobi bulunamadı"}</p>
        </div>
        <Button onClick={() => router.push("/lobbies")}>Odalara Dön</Button>
      </div>
    );
  }

  const lobbyThemeConfig = getLobbyTheme(lobby.theme);

  return (
    <ProtectedRoute>
    <div className="flex h-full min-h-0 w-full bg-[#f8fafc] border-4 border-black brutal-shadow rounded-sm overflow-hidden animate-fade-in">
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center text-5xl animate-bounce" aria-label="Slot jackpot kutlaması">
          🎉 ✨ 🎊 💎 🎉
        </div>
      )}
      
      {/* Center Column: Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 ${lobbyThemeConfig.chatBg} h-full`}>
            {/* Header */}
            <div className={`lobby-header-banner ${equippedLobbyTheme ? lobbyChatTheme.headerGradient : lobbyThemeConfig.headerGradient} border-b-4 border-black p-4 flex justify-between items-center z-10 shrink-0 transition-colors ${lobby.xp >= 100 ? "animate-fade-in" : ""}`}>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="w-9 h-9 rounded-sm bg-white border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0_0_#000] shrink-0" title="Lobi İkonu">
                    {lobby.icon || "💬"}
                  </span>
                  <h1 className={`text-2xl font-black tracking-tight ${equippedLobbyTheme ? lobbyChatTheme.headerTitleClass : "text-black"}`}>{lobby.name}</h1>
                  <LobbyXpBar xp={lobby.xp} />
                  <Badge variant={lobby.visibility === "PRIVATE" ? "destructive" : "default"} className="bg-black text-white border-black font-bold">
                    {lobby.visibility === "PRIVATE" ? "ÖZEL" : "HERKESE AÇIK"}
                  </Badge>
                  {isConnected ? (
                    <Badge className="bg-[#4ade80] text-black font-black">Canlı</Badge>
                  ) : isMemberVerified ? (
                    <Badge variant="destructive" className="font-bold animate-pulse">Bağlantı kuruluyor...</Badge>
                  ) : (
                    <Badge variant="outline" className="font-bold bg-[#FEF08A] text-black border-black animate-pulse">Odaya giriliyor...</Badge>
                  )}
                </div>
                <p className={`text-sm font-bold ${equippedLobbyTheme ? lobbyChatTheme.headerSubtitleClass : "text-black/75"}`}>{lobby.description || "Açıklama bulunmuyor"}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Party Games Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" className="bg-[#06B6D4] hover:bg-[#0891B2] text-black border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                        <Gamepad2 className="w-4 h-4 mr-1.5" /> Parti Oyunları
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="bg-white brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-1.5 font-bold z-50 text-xs w-52">
                    <DropdownMenuItem
                      onClick={() => setTriviaActive(true)}
                      className="flex items-center gap-2 p-2 hover:bg-[#FEF08A] cursor-pointer rounded-none font-bold"
                    >
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Canlı Trivia Başlat</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setCreatePollOpen(true)}
                      className="flex items-center gap-2 p-2 hover:bg-[#FEF08A] cursor-pointer rounded-none font-bold"
                    >
                      <BarChart2 className="w-4 h-4 text-emerald-600" />
                      <span>Yeni Anket Oluştur</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => runQuickGame("/zar")}
                      className="flex items-center gap-2 p-2 hover:bg-[#FEF08A] cursor-pointer rounded-none font-bold"
                    >
                      <Dices className="w-4 h-4 text-blue-600" />
                      <span>Zar At (/zar)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => runQuickGame("/yazitura")}
                      className="flex items-center gap-2 p-2 hover:bg-[#FEF08A] cursor-pointer rounded-none font-bold"
                    >
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>Yazı-Tura At (/yazitura)</span>
                    </DropdownMenuItem>
                    {["/bomba", "/dvc", "/slot"].map((command) => (
                      <DropdownMenuItem key={command} onClick={() => runQuickGame(command)} className="flex items-center gap-2 p-2 hover:bg-[#FEF08A] cursor-pointer rounded-none font-bold">
                        {command === "/bomba" ? "💣 Sohbet Bombası" : command === "/dvc" ? "🎭 Doğruluk mu Cesaret mi?" : "🎰 Şans Slotu"}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Polls Hub Button */}
                <Button
                  variant="outline"
                  className="bg-[#FEF08A] hover:bg-[#FDE047] text-black border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5"
                  onClick={() => setPollsDialogOpen(true)}
                >
                  <BarChart2 className="w-4 h-4 text-black" />
                  <span>Anketler</span>
                  {activePollsCount > 0 && (
                    <span className="bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {activePollsCount}
                    </span>
                  )}
                </Button>

                <Button data-testid="lobby-room-settings-btn" variant="outline" className="bg-white hover:bg-[#FEF08A] text-black border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all" onClick={() => setSettingsOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" /> Ayarlar
                </Button>
                <Button variant="outline" className="bg-white hover:bg-[#FFE4E6] text-black border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all" onClick={() => router.push("/lobbies")}>
                  Ayrıl
                </Button>
              </div>
            </div>

            {/* Pinned Lobby Announcement Banner */}
            {lobby.announcement && (
              <div className="bg-[#FEF9C3] border-b-4 border-black px-4 py-2.5 flex items-center gap-2.5 shrink-0 shadow-[0_2px_0_0_rgba(0,0,0,1)] z-15">
                <span className="text-xs font-black uppercase tracking-wider bg-black text-[#FEF08A] px-2 py-0.5 rounded-sm shrink-0 flex items-center gap-1">
                  📢 DUYURU
                </span>
                <p className="text-xs font-black text-black truncate flex-1">
                  {lobby.announcement}
                </p>
              </div>
            )}

            {/* Pending 1v1 RPS Challenge Banner */}
      {pendingRpsChallenge && (
        <div className="bg-[#FED7AA] border-b-4 border-black p-3 px-4 flex items-center justify-between shrink-0 animate-fade-in shadow-[0_2px_0_0_rgba(0,0,0,1)] z-20">
          <div className="flex items-center gap-2 font-black text-sm text-black">
            <span className="text-xl animate-bounce">✊</span>
            <span><strong>{pendingRpsChallenge.fromUsername}</strong> seninle Taş-Kağıt-Makas oynamak istiyor!</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAcceptRpsChallenge} className="bg-[#4ADE80] hover:bg-[#22C55E] text-black font-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer">
              Kabul Et
            </Button>
            <Button size="sm" variant="outline" onClick={handleDeclineRpsChallenge} className="bg-white hover:bg-red-100 text-black font-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer">
              Reddet
            </Button>
          </div>
        </div>
      )}

      {/* Pinned Active Poll Banner */}
      {latestActivePoll && !isPollsBannerDismissed && user && (
        <div className="bg-[#FEF08A] border-b-4 border-black p-3 px-4 shrink-0 transition-all shadow-[0_2px_0_0_rgba(0,0,0,1)] z-15">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-sm shrink-0">
                📊 GÜNCEL ANKET
              </span>
              {isPollCollapsed ? (
                <span className="text-xs font-bold text-black truncate">
                  : {latestActivePoll.question}
                </span>
              ) : activePollsCount > 1 ? (
                <span className="text-xs font-bold text-black/75 shrink-0">
                  (+{activePollsCount - 1} anket daha)
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsPollCollapsed((prev) => !prev)}
                className="text-xs font-black bg-white hover:bg-neutral-100 border border-black px-2 py-0.5 rounded-sm shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
                title={isPollCollapsed ? "Anketi Genişlet" : "Anketi Kısalt"}
              >
                {isPollCollapsed ? "Genişlet ▼" : "Kısalt ▲"}
              </button>
              <button
                onClick={() => setPollsDialogOpen(true)}
                className="text-xs font-black underline hover:text-blue-700 cursor-pointer hidden sm:inline"
              >
                Tüm Anketler ({polls.length})
              </button>
              <button
                onClick={() => setIsPollsBannerDismissed(true)}
                className="w-5 h-5 bg-white hover:bg-gray-200 border border-black rounded-sm flex items-center justify-center text-xs font-black cursor-pointer shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
                title="Bu oturumda gizle"
              >
                ✕
              </button>
            </div>
          </div>
          {!isPollCollapsed && (
            <LobbyPollCard
              poll={latestActivePoll}
              currentUserId={user.id}
              isModeratorOrOwner={canModerate}
              onVote={handleVotePoll}
              onClosePoll={handleClosePoll}
              compact={true}
            />
          )}
        </div>
      )}

      {/* Live Trivia Arena */}
      {triviaActive && user && (
        <LobbyTrivia
          lobbyId={lobbyId}
          currentUserId={user.id}
          currentUsername={user.username}
          isActive={triviaActive}
          onClose={() => setTriviaActive(false)}
          sendGameAction={sendGameAction}
          incomingGameEvent={incomingGameEvent}
          onAnnounceToChat={(msg) => sendMessage(msg)}
        />
      )}

      
      {wsError && (
        <div className="bg-destructive text-destructive-foreground p-2 text-sm font-bold text-center border-b-[3px] border-black">
          {wsError}
        </div>
      )}


      {/* Chat Area */}
      <div 
        ref={chatScrollRef} 
        data-chat-theme={equippedLobbyTheme || "default"}
        onScroll={(event) => {
          const element = event.currentTarget;
          isNearBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
          if (isNearBottomRef.current) setUnreadMessages(false);
        }} 
        className={`flex-1 min-h-0 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 transition-colors ${lobbyChatTheme.chatContainerClass}`}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-foreground/50 font-medium">
            Henüz mesaj yok. İlk mesajı siz yazın!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === user?.id;
            const isEditing = editingMessageId === msg.id;
            const wasEdited = Boolean(
              msg.updated_at &&
              msg.created_at &&
              new Date(msg.updated_at).getTime() - new Date(msg.created_at).getTime() > 1000
            );
            
            // Equipped Theme or Calmer Neo-Brutalist bubbles
            const bubbleClass = msg.is_bot
              ? "bg-[#cffafe] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bot-bubble"
              : isMe
              ? `${lobbyChatTheme.myBubbleClass} my-bubble`
              : `${lobbyChatTheme.otherBubbleClass} other-bubble`;
            const alignmentClass = isMe ? "self-end" : "self-start";
            
            return (
              <div key={msg.id} className={`flex flex-col max-w-[85%] md:max-w-[70%] ${alignmentClass} animate-fade-in-up group`}>
                <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'justify-end' : ''}`}>
                  {!isMe && (
                    <>
                      <span 
                        className={`font-bold text-sm cursor-pointer hover:underline ${
                          equippedLobbyTheme === "lobby_theme_cyber_neon"
                            ? "text-[#38BDF8]"
                            : equippedLobbyTheme === "lobby_theme_matrix_hacker"
                            ? "text-[#4ADE80]"
                            : "text-current"
                        }`} 
                        onClick={() => handleOpenProfile(msg.sender.id)}
                      >
                        {msg.sender.username}
                      </span>
                      {msg.is_bot && (
                        <Badge className="bg-black text-white text-[9px] h-4 py-0 px-1 border-none shadow-none font-bold uppercase tracking-wider">
                          BOT
                        </Badge>
                      )}
                    </>
                  )}
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    equippedLobbyTheme === "lobby_theme_cyber_neon" || equippedLobbyTheme === "lobby_theme_matrix_hacker"
                      ? "text-slate-400"
                      : "text-gray-500"
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {wasEdited && (
                      <span
                        className="text-[10px] text-gray-400 font-medium italic select-none"
                        title={`Düzenlendi: ${new Date(msg.updated_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        (düzenlendi)
                      </span>
                    )}
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  {/* Sender Avatar Thumbnail */}
                  <div
                    className={`w-8 h-8 rounded-full border-2 border-black overflow-hidden flex items-center justify-center font-black text-xs shrink-0 cursor-pointer shadow-[1px_1px_0_0_rgba(0,0,0,1)] ${
                      msg.is_bot ? "bg-[#FEF08A] text-black" : "bg-gradient-to-br from-[#FB923C] to-[#F472B6] text-white"
                    } ${isMe ? "order-last" : ""}`}
                    onClick={() => !isMe && handleOpenProfile(msg.sender.id)}
                    title={msg.sender.username}
                  >
                    {msg.sender.avatar_url ? (
                      <img
                        src={getAvatarUrl(msg.sender.avatar_url)}
                        alt={msg.sender.username}
                        className="w-full h-full object-cover"
                      />
                    ) : msg.is_bot ? (
                      <Bot className="w-4 h-4 text-black" />
                    ) : (
                      msg.sender.username.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Message Content Bubble or Inline Edit */}
                  {isEditing ? (
                    <div className="w-full min-w-[240px] sm:min-w-[320px] max-w-full space-y-2 bg-white p-3 border-2 border-black rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit(msg.id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        rows={2}
                        autoFocus
                        className="w-full p-2 text-sm font-medium border-2 border-black rounded-sm focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 resize-y"
                        placeholder="Mesajınızı düzenleyin..."
                      />
                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-gray-500">
                        <span>Enter: kaydet • Esc: iptal</span>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSubmittingEdit}
                            className="h-7 px-2 text-xs font-black border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
                          >
                            <X className="w-3 h-3 mr-1" /> İptal
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(msg.id)}
                            disabled={isSubmittingEdit}
                            className="h-7 px-2 text-xs font-black bg-[#4ADE80] text-black hover:bg-[#22c55e] border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
                          >
                            <Check className="w-3 h-3 mr-1" /> {isSubmittingEdit ? "..." : "Kaydet"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : isLobbyGameMessage(msg.content) ? (
                    <LobbyGameCard content={msg.content} onChoose={(choice) => sendMessage(`/dvc ${choice}`)} />
                  ) : isRichGameMessage(msg.content) ? (
                    <RichGameCard
                      content={msg.content}
                      senderName={msg.sender.username}
                      isMe={isMe}
                      onAnnounceToChat={(text) => sendMessage(text)}
                    />
                  ) : (
                    <div className={`${bubbleClass} px-4 py-2.5 rounded-sm group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow`}>
                      <p className="whitespace-pre-wrap font-medium break-words leading-relaxed text-inherit">
                        {renderMessageContent(msg.content, user?.username)}
                      </p>
                    </div>
                  )}
                  
                  {/* Action Bar for Message Owner or Moderators */}
                  {!isEditing && !msg.is_bot && !msg.id.startsWith("sys-") && !msg.id.startsWith("temp-") && (
                    <div className={`opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity flex items-center gap-1 ${isMe ? 'order-first' : ''}`}>
                      {isMe && !isLobbyGameMessage(msg.content) && (
                        <button
                          onClick={() => handleStartEdit(msg)}
                          title="Mesajı Düzenle"
                          className="w-7 h-7 rounded-sm border border-black bg-white hover:bg-[#FEF08A] text-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(isMe || canModerate) && (
                        <button
                          onClick={() => setDeletingMessageId(msg.id)}
                          title="Mesajı Sil"
                          className="w-7 h-7 rounded-sm border border-black bg-white hover:bg-red-500 hover:text-white text-red-600 shadow-[1px_1px_0_0_rgba(0,0,0,1)] flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isMe && canModerate && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-black bg-white hover:bg-gray-100 text-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-colors outline-none focus:ring-2 focus:ring-black cursor-pointer">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isMe ? "end" : "start"} className="brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-48 bg-white">
                            <div className="px-2 py-1.5 text-sm font-bold">Moderasyon</div>
                            <DropdownMenuSeparator className="bg-black" />
                            <DropdownMenuItem onClick={() => handleModeration('mute', msg.sender.id, 15)} className="font-bold cursor-pointer text-orange-600 focus:bg-orange-100 focus:text-orange-700">
                              <MicOff className="mr-2 h-4 w-4" />
                              Kullanıcıyı Sustur (15 dk)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleModeration('mute', msg.sender.id, 60)} className="font-bold cursor-pointer text-orange-600 focus:bg-orange-100 focus:text-orange-700">
                              <MicOff className="mr-2 h-4 w-4" />
                              Kullanıcıyı Sustur (1 sa)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleModeration('unmute', msg.sender.id)} className="font-bold cursor-pointer text-green-600 focus:bg-green-100 focus:text-green-700">
                              <Mic className="mr-2 h-4 w-4" />
                              Susturmayı Kaldır
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-black" />
                            <DropdownMenuItem onClick={() => handleModeration('kick', msg.sender.id)} className="font-bold cursor-pointer text-red-600 focus:bg-red-100 focus:text-red-700">
                              <UserMinus className="mr-2 h-4 w-4" />
                              Lobiden At
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleModeration('ban', msg.sender.id)} className="font-bold cursor-pointer text-red-700 focus:bg-red-200 focus:text-red-800">
                              <Ban className="mr-2 h-4 w-4" />
                              Lobiden Yasakla
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {/* Active Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} />
        {quickGamePending && (
          <div className="max-w-xs bg-[#EDE9FE] border-2 border-black shadow-[3px_3px_0_0_#000] px-3 py-2 font-black text-sm animate-pulse">
            {quickGamePending === "/slot" ? <LobbySlotSpinner /> : quickGamePending === "/zar" ? "🎲 Zar dönüyor..." : "🪙 Para dönüyor..."}
          </div>
        )}
        {/* End of messages */}
      </div>

      {unreadMessages && (
        <button type="button" onClick={scrollToLatest} className="self-center -mt-3 mb-1 z-10 bg-[#06B6D4] border-2 border-black shadow-[2px_2px_0_0_#000] px-3 py-1 text-xs font-black cursor-pointer">
          Yeni mesajlar ↓
        </button>
      )}

      {/* Input Area */}
      <div className={`${lobbyChatTheme.inputBarClass} border-t-4 border-black p-4 shrink-0 relative transition-colors`}>
        <LobbyGamesBar disabled={!isConnected} onPlay={runQuickGame} />
        {mentionQuery !== null && filteredMentions.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 bg-white brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-sm overflow-hidden z-50 min-w-[220px] max-h-48 overflow-y-auto">
            <div className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Üyeden Bahset</span>
              <span className="text-[10px] text-gray-300">{filteredMentions.length} eşleşme</span>
            </div>
            {filteredMentions.map((m, i) => (
              <div 
                key={m.user_id}
                className={`px-3 py-2 cursor-pointer font-bold border-b border-gray-200 last:border-0 flex items-center justify-between ${i === mentionIndex ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                onMouseDown={(e) => { e.preventDefault(); insertMention(m.username); }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border border-black overflow-hidden bg-gray-200 text-[10px] flex items-center justify-center shrink-0">
                    {m.avatar_url ? (
                      <img src={getAvatarUrl(m.avatar_url)} alt={m.username} className="w-full h-full object-cover" />
                    ) : (
                      m.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm">@{m.username}</span>
                </div>
                <Badge className={`text-[9px] h-4 py-0 px-1 border-none shadow-none font-bold uppercase ${m.is_bot ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}>
                  {m.is_bot ? 'BOT' : 'KULLANICI'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Quick Slash Commands Popup */}
        {inputMessage.startsWith("/") && mentionQuery === null && (
          <div className="absolute bottom-full left-4 mb-2 bg-white brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-sm overflow-hidden z-50 min-w-[220px]">
            <div className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>🎮 Parti Komutları</span>
              <span className="text-[10px] text-gray-300">Tıkla veya Gönder</span>
            </div>
            <div
              className="px-3 py-2 cursor-pointer font-bold border-b border-gray-200 hover:bg-[#FEF08A] flex items-center justify-between transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                sendMessage("/zar");
                setInputMessage("");
              }}
            >
              <span className="flex items-center gap-1.5">🎲 /zar</span>
              <span className="text-xs text-gray-500 font-normal">1-100 Zar At</span>
            </div>
            <div
              className="px-3 py-2 cursor-pointer font-bold border-b border-gray-200 hover:bg-[#FEF08A] flex items-center justify-between transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                sendMessage("/yazitura");
                setInputMessage("");
              }}
            >
              <span className="flex items-center gap-1.5">🪙 /yazitura</span>
              <span className="text-xs text-gray-500 font-normal">Yazı-Tura At</span>
            </div>
            <div
              className="px-3 py-2 cursor-pointer font-bold hover:bg-[#FEF08A] flex items-center justify-between transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                setTriviaActive(true);
                setInputMessage("");
              }}
            >
              <span className="flex items-center gap-1.5">🧠 /trivia</span>
              <span className="text-xs text-gray-500 font-normal">Canlı Bilgi Yarışması</span>
            </div>
            <div
              className="px-3 py-2 cursor-pointer font-bold hover:bg-[#FEF08A] flex items-center justify-between transition-colors border-t border-gray-200"
              onMouseDown={(e) => {
                e.preventDefault();
                setCreatePollOpen(true);
                setInputMessage("");
              }}
            >
              <span className="flex items-center gap-1.5">📊 /anket</span>
              <span className="text-xs text-gray-500 font-normal">Anket Başlat</span>
            </div>
            <div
              className="px-3 py-2 cursor-pointer font-bold hover:bg-[#FEF08A] flex items-center justify-between transition-colors border-t border-gray-200"
              onMouseDown={(e) => {
                e.preventDefault();
                handleDropIcebreaker();
                setInputMessage("");
              }}
            >
              <span className="flex items-center gap-1.5">❄️ /soru</span>
              <span className="text-xs text-gray-500 font-normal">Buz Kırıcı Tartışma</span>
            </div>
            <div
              className="px-3 py-2 cursor-pointer font-bold hover:bg-[#FEF08A] flex items-center justify-between transition-colors border-t border-gray-200"
              onMouseDown={(e) => {
                e.preventDefault();
                sendMessage("/tkm");
                setInputMessage("");
              }}
            >
              <span className="flex items-center gap-1.5">✊ /tkm</span>
              <span className="text-xs text-gray-500 font-normal">Taş-Kağıt-Makas</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2.5" autoComplete="off">
          <LobbyActivityMenu
            disabled={!isConnected}
            onStartTrivia={() => setTriviaActive(true)}
            onOpenPoll={() => setCreatePollOpen(true)}
            onOpenRps={() => {
              if (user) {
                sendMessage(`⚔️ [RPS MEYDAN OKUMASI]: @${user.username} herkesi Taş-Kağıt-Makas düellosuna davet etti!`);
              }
            }}
            onDropIcebreaker={handleDropIcebreaker}
            onRollDice={() => sendMessage("/zar")}
            onFlipCoin={() => sendMessage("/yazitura")}
          />

          <Input 
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı yazın... (bahsetmek için @, komutlar için / yazın)"
            autoComplete="off"
            className="flex-1 bg-white h-12 text-base font-medium brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] transition-all"
            disabled={!isConnected}
          />
          <Button 
            type="submit" 
            disabled={!isConnected || !inputMessage.trim()}
            className="h-12 px-8 bg-[#06B6D4] hover:bg-[#0891B2] text-black font-black text-lg brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all cursor-pointer"
          >
            GÖNDER
          </Button>
        </form>
      </div>
      </div>

      {/* Right Column: Members List */}
      <MembersList 
        members={lobbyMembers} 
        onMemberClick={handleOpenProfile} 
        lobbyId={lobbyId}
        currentUserId={user?.id}
        currentUserRole={myRole}
        isLobbyOwner={lobby?.owner_id === user?.id}
        onActionSuccess={refreshMembers}
        onChallengeRps={handleChallengeRps}
        themeStyles={lobbyChatTheme}
      />
    </div>

    <LobbySettingsDialog 
      lobby={lobby} 
      isOpen={settingsOpen} 
      onClose={() => setSettingsOpen(false)} 
      myRole={myRole}
      currentUserId={user?.id}
      onUserProfileClick={handleOpenProfile}
      onLobbyUpdated={setLobby}
      onMembersUpdated={refreshMembers}
    />
    
    <UserProfileDialog
      userId={selectedProfileId}
      isOpen={profileOpen}
      onClose={() => setProfileOpen(false)}
    />

    {rpsDuelState.isOpen && user && (
      <LobbyRpsDuel
        isOpen={rpsDuelState.isOpen}
        onClose={() => setRpsDuelState((prev) => ({ ...prev, isOpen: false }))}
        lobbyId={lobbyId}
        currentUserId={user.id}
        currentUsername={user.username}
        opponentId={rpsDuelState.opponentId}
        opponentUsername={rpsDuelState.opponentUsername}
        opponentIsBot={rpsDuelState.opponentIsBot}
        sendGameAction={sendGameAction}
        incomingGameEvent={incomingGameEvent}
        onAnnounceToChat={(msg) => sendMessage(msg)}
      />
    )}

    <CreatePollModal
      isOpen={createPollOpen}
      onClose={() => setCreatePollOpen(false)}
      lobbyId={lobbyId}
      onPollCreated={(newPoll) => {
        setPolls((prev) => [newPoll, ...prev.filter((p) => p.id !== newPoll.id)]);
      }}
    />

    <LobbyPollsDialog
      isOpen={pollsDialogOpen}
      onClose={() => setPollsDialogOpen(false)}
      polls={polls}
      currentUserId={user?.id || ""}
      isModeratorOrOwner={canModerate}
      onVote={handleVotePoll}
      onClosePoll={handleClosePoll}
      onOpenCreateModal={() => setCreatePollOpen(true)}
    />

    {/* Delete Message Confirmation Dialog */}
    <AlertDialog open={!!deletingMessageId} onOpenChange={(open) => !open && setDeletingMessageId(null)}>
      <AlertDialogContent className="brutal-border border-4 brutal-shadow bg-white p-6 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black uppercase text-black flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" /> Mesajı Sil
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-bold text-gray-700">
            Bu mesajı odadan silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 pt-4">
          <AlertDialogCancel className="font-bold border-2 border-black uppercase text-xs cursor-pointer">
            Vazgeç
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="font-black bg-red-600 text-white border-2 border-black uppercase text-xs hover:bg-red-700 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
          >
            {isDeleting ? "Siliniyor..." : "Evet, Sil"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    </ProtectedRoute>

  );
}
