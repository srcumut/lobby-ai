// ============================================================================
// TARGET_DESTINATION: frontend/src/app/messages/page.tsx
// PURPOSE: Feature-rich Direct Messages Page with:
//          1. Real-time PostgreSQL-persisted emoji reactions
//          2. Reorderable conversation tabs (Up, Down, Pin to Top)
//          3. Close conversation tab with 'X' & reopen from 'Tüm Arkadaşlar' list
//          4. Interactive 'Lobiye Davet Et' modal to select and send room invite
//          5. In-chat search, typing dots & conversation starters
// ============================================================================

"use client";

import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { useAuth } from "@/hooks/useAuth";
import { getAvatarUrl } from "@/lib/avatar";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { friendsApi } from "@/lib/api/friends";
import { lobbiesApi } from "@/lib/api/lobbies";
import { Lobby, UserInfo } from "@/types";
import { getEquippedCosmetics, getDmThemeStyles, setEquippedCosmetic } from "@/lib/cosmetics";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Send, 
  Search, 
  ArrowLeft, 
  User as UserIcon, 
  Loader2,
  Check,
  CheckCheck,
  Info,
  X,
  Smile,
  ShieldCheck,
  Bot,
  BellOff,
  Share2,
  Sparkles,
  Palette,
  ChevronRight,
  Users,
  Pin,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  DoorOpen,
  Download,
  Dices,
} from "lucide-react";

const EMOJI_REACTIONS = ["👍", "❤️", "🔥", "😂", "🎉", "🚀"];
const EMOJI_CATEGORIES: Record<string, string[]> = {
  "Popüler": ["😊", "😂", "🔥", "🚀", "✨", "❤️", "🎉", "👍", "💯", "💪", "👀", "🙌"],
  "Oyun & Sosyal": ["🎮", "👾", "🎲", "🏆", "☕", "🍕", "⚡", "💬", "🤖", "🛡️", "🎯", "💎"]
};
const CONVERSATION_STARTERS = [
  "👋 Merhaba, nasılsın?",
  "🎮 Müsait misin, lobiye geçelim mi?",
  "🤖 Hangi AI ajanını önerirsin?",
  "🚀 Bugün yeni bir lobi kuralım mı?"
];

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");

  const { user } = useAuth();
  const {
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
  } = useDirectMessages(initialUserId);

  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Tabs & Reordering & Close States
  const [leftTab, setLeftTab] = useState<"chats" | "all_friends">("chats");
  const [allFriends, setAllFriends] = useState<UserInfo[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [closedChatIds, setClosedChatIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("lobby-ai:closed-dms") || "[]");
    } catch {
      return [];
    }
  });
  const [customOrder, setCustomOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("lobby-ai:dm-order") || "[]");
    } catch {
      return [];
    }
  });

  const [equippedDmTheme, setEquippedDmTheme] = useState<string | null>(null);

  useEffect(() => {
    const cosmetics = getEquippedCosmetics();
    setEquippedDmTheme(cosmetics.dm_theme || null);

    const handleCosmeticsUpdate = (e: any) => {
      setEquippedDmTheme(e.detail?.dm_theme || null);
    };

    window.addEventListener("lobby:cosmetics_updated", handleCosmeticsUpdate);
    return () => window.removeEventListener("lobby:cosmetics_updated", handleCosmeticsUpdate);
  }, []);

  const dmChatTheme = getDmThemeStyles(equippedDmTheme);

  // Lobby Invite Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [availableLobbies, setAvailableLobbies] = useState<Lobby[]>([]);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(false);

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [dmThemeModalOpen, setDmThemeModalOpen] = useState(false);

  const handleSwitchDmTheme = (themeId: string | null) => {
    setEquippedCosmetic("dm_theme", themeId);
    setEquippedDmTheme(themeId);
    toast.add({
      title: "DM Teması Değiştirildi ✨",
      description: "Özel mesajlaşma pencereniz anında seçtiğiniz temaya uyarlandı.",
      type: "success",
    });
    setDmThemeModalOpen(false);
  };

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // If userId param changes, switch active conversation and unhide if closed
  useEffect(() => {
    if (initialUserId) {
      setClosedChatIds((prev) => {
        const next = prev.filter((id) => id !== initialUserId);
        localStorage.setItem("lobby-ai:closed-dms", JSON.stringify(next));
        return next;
      });
      setActiveFriendId(initialUserId);
    }
  }, [initialUserId, setActiveFriendId]);

  // Load all friends for the "Tüm Arkadaşlar" tab
  useEffect(() => {
    if (user) {
      setIsLoadingFriends(true);
      friendsApi.getFriends()
        .then(setAllFriends)
        .catch(console.error)
        .finally(() => setIsLoadingFriends(false));
    }
  }, [user]);

  // Scroll to bottom on messages change
  useEffect(() => {
    if (chatScrollRef.current && !chatSearchQuery) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, chatSearchQuery]);

  // Visible conversations after filtering closed ones and sorting by custom order
  const visibleConversations = useMemo(() => {
    const openChats = conversations.filter((c) => !closedChatIds.includes(c.friend.id));
    return [...openChats].sort((a, b) => {
      const idxA = customOrder.indexOf(a.friend.id);
      const idxB = customOrder.indexOf(b.friend.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [conversations, closedChatIds, customOrder]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return visibleConversations;
    const q = searchQuery.toLowerCase();
    return visibleConversations.filter((c) => {
      const name = (c.friend.display_name || c.friend.username).toLowerCase();
      const uname = c.friend.username.toLowerCase();
      return name.includes(q) || uname.includes(q);
    });
  }, [visibleConversations, searchQuery]);

  const activeConversation = conversations.find(
    (c) => c.friend.id === activeFriendId
  );

  // Filter messages based on in-chat search query
  const displayedMessages = useMemo(() => {
    if (!chatSearchQuery.trim()) return messages;
    const q = chatSearchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, chatSearchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputMessage(val);
    sendTyping(val.trim().length > 0);
  };

  const isDifferentDay = (d1: string, d2?: string) => {
    if (!d2) return true;
    const date1 = new Date(d1).toDateString();
    const date2 = new Date(d2).toDateString();
    return date1 !== date2;
  };

  const formatDateDivider = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (d.toDateString() === today) return "Bugün";
    if (d.toDateString() === yesterday) return "Dün";
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  };

  const renderHighlightedText = (content: string, query: string) => {
    if (!query.trim()) return content;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = content.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-[#FEF08A] text-black font-black px-0.5 rounded-none border border-black">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
    setEmojiPickerOpen(false);
  };

  const handleQuickAction = async (action: "dice" | "coin" | "invite") => {
    if (action === "invite") {
      handleOpenInviteModal();
      return;
    }
    if (action === "dice") {
      const roll = Math.floor(Math.random() * 6) + 1;
      const text = `🎲 [ZAR ATILDI]: ${roll} geldi!`;
      await handleSend(undefined, text);
    } else if (action === "coin") {
      const result = Math.random() < 0.5 ? "Yazı" : "Tura";
      const text = `🪙 [YAZI-TURA]: Para fırlatıldı ve "${result}" geldi!`;
      await handleSend(undefined, text);
    }
  };

  const handleExportChat = () => {
    if (!activeConversation || messages.length === 0) {
      toast.add({
        title: "Dışa Aktarılacak Mesaj Yok",
        description: "Bu sohbette henüz indirilecek bir mesaj bulunmuyor.",
        type: "info",
      });
      return;
    }
    const friendName = activeConversation.friend.display_name || activeConversation.friend.username;
    const header = `=================================================\nLOBBY AI - DİREKT MESAJ GEÇMİŞİ\nSohbet: @${activeConversation.friend.username} (${friendName})\nTarih: ${new Date().toLocaleString("tr-TR")}\n=================================================\n\n`;
    const body = messages.map((m) => {
      const isMe = m.sender_id === user?.id;
      const sender = isMe ? "Sen" : friendName;
      const time = new Date(m.created_at).toLocaleString("tr-TR");
      return `[${time}] ${sender}: ${m.content}`;
    }).join("\n\n");

    const blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sohbet-${activeConversation.friend.username}-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast.add({
      title: "Sohbet İndirildi",
      description: "Mesaj geçmişiniz .txt dosyası olarak kaydedildi.",
      type: "success",
    });
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isSending) return;

    if (!customText) setInputMessage("");
    sendTyping(false);
    try {
      await sendMessage(textToSend);
    } catch {
      if (!customText) setInputMessage(textToSend);
    }
  };

  const handleToggleReaction = async (msgId: string, emoji: string) => {
    await toggleReaction(msgId, emoji);
  };

  const handleCloseChat = (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    const next = Array.from(new Set([...closedChatIds, friendId]));
    setClosedChatIds(next);
    localStorage.setItem("lobby-ai:closed-dms", JSON.stringify(next));
    if (activeFriendId === friendId) {
      setActiveFriendId(null);
    }
    toast.add({
      title: "Sohbet Gizlendi",
      description: "Sohbet kapatıldı. 'Tüm Arkadaşlar' sekmesinden dilediğiniz zaman tekrar açabilirsiniz.",
      type: "info",
    });
  };

  const handleMoveChat = (e: React.MouseEvent, friendId: string, direction: "up" | "down" | "top") => {
    e.stopPropagation();
    const ids = visibleConversations.map((c) => c.friend.id);
    const idx = ids.indexOf(friendId);
    if (idx === -1) return;
    const next = [...ids];
    if (direction === "top") {
      next.splice(idx, 1);
      next.unshift(friendId);
    } else if (direction === "up" && idx > 0) {
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    } else if (direction === "down" && idx < next.length - 1) {
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    }
    setCustomOrder(next);
    localStorage.setItem("lobby-ai:dm-order", JSON.stringify(next));
  };

  const handleOpenFromAllFriends = (friendId: string) => {
    const nextClosed = closedChatIds.filter((id) => id !== friendId);
    setClosedChatIds(nextClosed);
    localStorage.setItem("lobby-ai:closed-dms", JSON.stringify(nextClosed));
    setActiveFriendId(friendId);
    setLeftTab("chats");
  };

  const handleOpenInviteModal = async () => {
    setInviteModalOpen(true);
    setIsLoadingLobbies(true);
    try {
      const data = await lobbiesApi.getLobbies();
      setAvailableLobbies(data);
    } catch (err) {
      console.error("Failed to load lobbies", err);
    } finally {
      setIsLoadingLobbies(false);
    }
  };

  const handleSendLobbyInvite = async (lobby: Lobby) => {
    setInviteModalOpen(false);
    const inviteText = `🎮 [LOBİ DAVETİ]: Seni "${lobby.name}" odasına davet ettim! 🚀\nKatılmak için tıkla: ${window.location.origin}/lobby/${lobby.id}`;
    await handleSend(undefined, inviteText);
    toast.add({
      title: "Davet Gönderildi",
      description: `${lobby.name} odasına davet kartı sohbete iletildi.`,
      type: "success",
    });
  };

  return (
    <div className="flex h-full min-h-0 w-full bg-[#f8fafc] border-4 border-black brutal-shadow rounded-sm overflow-hidden animate-fade-in">
      
      {/* Left Panel: Conversations & All Friends */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r-0 md:border-r-4 border-black flex flex-col ${dmChatTheme.sidebarBodyClass} shrink-0 ${
          activeFriendId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header with Navigation Tabs */}
        <div className={`${dmChatTheme.sidebarHeaderClass} shrink-0 transition-colors`}>
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-current" />
              <h2 className="font-black text-lg uppercase tracking-tight text-current">Direkt Mesajlar</h2>
            </div>
            <span className="bg-black text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
              {visibleConversations.length}
            </span>
          </div>

          {/* Tab Selector: Sohbetler vs Tüm Arkadaşlar */}
          <div className="grid grid-cols-2 border-t-2 border-black bg-white">
            <button
              type="button"
              onClick={() => setLeftTab("chats")}
              className={`py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-r-2 border-black cursor-pointer transition-colors ${
                leftTab === "chats"
                  ? "bg-[#FFE4E6] text-black shadow-inner"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Sohbetler ({visibleConversations.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLeftTab("all_friends")}
              className={`py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                leftTab === "all_friends"
                  ? "bg-[#FFE4E6] text-black shadow-inner"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tüm Arkadaşlar ({allFriends.length})</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b-2 border-black bg-gray-50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 font-bold" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={leftTab === "chats" ? "Sohbetlerde ara..." : "Arkadaş ara..."}
              autoComplete="off"
              className="pl-9 bg-white border-2 border-black font-bold text-xs h-9 shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-none focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Conversations or All Friends Content */}
        <div className="flex-1 overflow-y-auto divide-y-2 divide-gray-100">
          {leftTab === "chats" ? (
            /* TAB 1: CONVERSATIONS LIST */
            isLoadingConversations ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-gray-500 font-bold">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
                <span className="text-xs uppercase">Sohbetler yükleniyor...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-bold text-sm space-y-2">
                <p>{searchQuery ? "Aramaya uygun sohbet bulunamadı" : "Açık bir sohbet sekmeniz yok."}</p>
                <Button
                  size="sm"
                  onClick={() => setLeftTab("all_friends")}
                  className="bg-[#FEF08A] hover:bg-[#FDE047] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                >
                  <Users className="w-3.5 h-3.5 mr-1" /> Tüm Arkadaşları Gör
                </Button>
              </div>
            ) : (
              filteredConversations.map((c, index) => {
                const isSelected = c.friend.id === activeFriendId;
                const hasUnread = c.unread_count > 0;

                return (
                  <div
                    key={c.friend.id}
                    onClick={() => {
                      setActiveFriendId(c.friend.id);
                      setChatSearchOpen(false);
                      setChatSearchQuery("");
                    }}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-all border-l-4 group relative ${
                      isSelected
                        ? dmChatTheme.sidebarActiveItemClass
                        : hasUnread
                        ? "bg-blue-50/50 hover:bg-gray-100 border-blue-500"
                        : `${dmChatTheme.sidebarItemHoverClass} border-transparent`
                    }`}
                  >
                    {/* Friend Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full border-2 border-black bg-[#A78BFA] flex items-center justify-center font-black text-white overflow-hidden shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        {c.friend.avatar_url ? (
                          <img
                            src={getAvatarUrl(c.friend.avatar_url)}
                            alt={c.friend.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          c.friend.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      {/* Active presence indicator */}
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#4ADE80] border-2 border-black" />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`font-black text-sm truncate ${isSelected ? "text-inherit" : dmChatTheme.sidebarTextPrimary}`}>
                          {c.friend.display_name || c.friend.username}
                        </h4>
                        {c.last_message && (
                          <span className={`text-[10px] font-bold shrink-0 ${isSelected ? "opacity-75" : dmChatTheme.sidebarTextSecondary}`}>
                            {new Date(c.last_message.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-medium truncate ${isSelected ? "opacity-90" : dmChatTheme.sidebarTextSecondary}`}>
                          {c.last_message
                            ? `${c.last_message.sender_id === user?.id ? "Sen: " : ""}${c.last_message.content}`
                            : "Merhaba de! 👋"}
                        </p>
                        {hasUnread && (
                          <span className="bg-[#EF4444] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 animate-pulse border border-black">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover Reorder & Close Controls */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 bg-white/95 border border-black p-0.5 rounded shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                      <button
                        type="button"
                        onClick={(e) => handleMoveChat(e, c.friend.id, "top")}
                        className="p-1 hover:bg-[#FEF08A] text-black rounded cursor-pointer"
                        title="En Üste Sabitle"
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={(e) => handleMoveChat(e, c.friend.id, "up")}
                          className="p-1 hover:bg-[#FEF08A] text-black rounded cursor-pointer"
                          title="Yukarı Taşı"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                      )}
                      {index < filteredConversations.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleMoveChat(e, c.friend.id, "down")}
                          className="p-1 hover:bg-[#FEF08A] text-black rounded cursor-pointer"
                          title="Aşağı Taşı"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleCloseChat(e, c.friend.id)}
                        className="p-1 hover:bg-red-200 text-red-700 rounded cursor-pointer"
                        title="Sohbet Sekmesini Kapat"
                      >
                        <X className="w-3 h-3 font-black" />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            /* TAB 2: ALL FRIENDS DIRECTORY */
            isLoadingFriends ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-gray-500 font-bold">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
                <span className="text-xs uppercase">Arkadaşlar yükleniyor...</span>
              </div>
            ) : allFriends.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-bold text-sm">
                Henüz arkadaşınız bulunmuyor. Lobilerden kullanıcı profiline tıklayarak arkadaş ekleyebilirsiniz!
              </div>
            ) : (
              allFriends
                .filter((f) => {
                  const q = searchQuery.toLowerCase();
                  return (
                    (f.display_name || f.username).toLowerCase().includes(q) ||
                    f.username.toLowerCase().includes(q)
                  );
                })
                .map((friend) => {
                  const isCurrent = friend.id === activeFriendId;
                  return (
                    <div
                      key={friend.id}
                      className={`p-3.5 flex items-center justify-between gap-3 ${dmChatTheme.sidebarItemHoverClass} transition-colors`}
                    >
                      <div 
                        className="flex items-center gap-3 min-w-0 cursor-pointer"
                        onClick={() => handleOpenFromAllFriends(friend.id)}
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-black bg-[#FB923C] flex items-center justify-center font-black text-white overflow-hidden shadow-[2px_2px_0_0_rgba(0,0,0,1)] shrink-0">
                          {friend.avatar_url ? (
                            <img
                              src={getAvatarUrl(friend.avatar_url)}
                              alt={friend.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            friend.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`font-black text-sm truncate ${dmChatTheme.sidebarTextPrimary}`}>
                            {friend.display_name || friend.username}
                          </h4>
                          <span className={`text-xs font-bold block truncate ${dmChatTheme.sidebarTextSecondary}`}>
                            @{friend.username}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleOpenFromAllFriends(friend.id)}
                        className={`h-8 px-2.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer ${
                          isCurrent
                            ? "bg-[#FFE4E6] text-black"
                            : "bg-[#FEF08A] hover:bg-[#FDE047] text-black"
                        }`}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {isCurrent ? "Açık" : "Sohbet Aç"}
                      </Button>
                    </div>
                  );
                })
            )
          )}
        </div>
      </div>

      {/* Middle & Right: Chat Area + Friend Detail Drawer */}
      <div
        className={`flex-1 flex flex-row min-w-0 min-h-0 bg-[#f4f4f5] h-full ${
          !activeFriendId ? "hidden md:flex" : "flex"
        }`}
      >
        {activeFriendId && activeConversation ? (
          <>
            {/* Chat Column */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full border-r-0 border-black">
              {/* Chat Header */}
              <div className={`${dmChatTheme.headerClass} p-3 flex justify-between items-center z-10 shrink-0 transition-colors`}>
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden bg-white text-black border-2 border-black h-8 w-8 shrink-0"
                    onClick={() => setActiveFriendId(null)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  
                  <div
                    className="w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      setProfileUserId(activeConversation.friend.id);
                      setProfileOpen(true);
                    }}
                  >
                    {activeConversation.friend.avatar_url ? (
                      <img
                        src={getAvatarUrl(activeConversation.friend.avatar_url)}
                        alt={activeConversation.friend.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      activeConversation.friend.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-black text-base truncate ${dmChatTheme.headerTitleClass}`}>
                        {activeConversation.friend.display_name || activeConversation.friend.username}
                      </h3>
                      {activeConversation.friend.is_bot && (
                        <span className="text-[10px] font-black uppercase bg-black text-white px-1.5 py-0.2 rounded">
                          AI
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-bold truncate flex items-center gap-1.5 ${dmChatTheme.headerSubtitleClass}`}>
                      <span>@{activeConversation.friend.username}</span>
                      <span className="inline-block w-2 h-2 rounded-full bg-[#4ADE80] border border-black" title="Çevrimiçi" />
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInviteModal}
                    className="h-9 px-3 bg-[#4ADE80] hover:bg-[#22C55E] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                    title="Lobiye Davet Et"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Lobiye Davet Et</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="dm-quick-theme-button"
                    onClick={() => setDmThemeModalOpen(true)}
                    className="h-9 px-3 bg-[#FEF08A] hover:bg-[#FDE047] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                    title="DM Sohbet Temasını Değiştir"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tema</span>
                  </Button>


                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportChat}
                    className="h-9 px-2.5 bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer hidden md:flex items-center gap-1"
                    title="Sohbet Geçmişini .txt İndir"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline text-[11px]">İndir</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChatSearchOpen(!chatSearchOpen)}
                    className={`h-9 px-2.5 bg-white text-black border-2 border-black font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer ${
                      chatSearchOpen ? "bg-[#FEF08A]" : ""
                    }`}
                    title="Sohbette Ara"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 bg-white text-black border-2 border-black font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer hidden sm:flex items-center gap-1.5"
                    onClick={() => {
                      setProfileUserId(activeConversation.friend.id);
                      setProfileOpen(true);
                    }}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    Profil
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInfoDrawer(!showInfoDrawer)}
                    className={`h-9 px-2.5 bg-white text-black border-2 border-black font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer ${
                      showInfoDrawer ? "bg-black text-white" : ""
                    }`}
                    title="Detayları Göster"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* In-Chat Search Bar Drawer */}
              {chatSearchOpen && (
                <div className="bg-[#FEF08A] px-4 py-2 border-b-2 border-black flex items-center gap-2 animate-slide-down">
                  <Search className="w-4 h-4 text-black shrink-0" />
                  <Input
                    placeholder="Bu sohbette mesaj ara..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    autoComplete="off"
                    className="bg-white h-8 text-xs font-bold border-2 border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] rounded-none"
                    autoFocus
                  />
                  {chatSearchQuery && (
                    <span className="text-[11px] font-black uppercase text-black shrink-0">
                      {displayedMessages.length} sonuç
                    </span>
                  )}
                  <button 
                    type="button" 
                    onClick={() => { setChatSearchOpen(false); setChatSearchQuery(""); }}
                    className="p-1 hover:bg-black/10 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4 text-black" />
                  </button>
                </div>
              )}

              {/* Error banner */}
              {error && (
                <div className="bg-destructive text-destructive-foreground p-2 text-xs font-bold text-center border-b-2 border-black">
                  {error}
                </div>
              )}

              {/* Messages Area */}
              <div
                ref={chatScrollRef}
                data-chat-theme={equippedDmTheme || "default"}
                className={`flex-1 min-h-0 overflow-y-auto p-4 md:p-6 flex flex-col gap-3.5 transition-colors ${dmChatTheme.chatContainerClass}`}
              >
                {isLoadingMessages ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-500 font-bold">
                    <Loader2 className="w-6 h-6 animate-spin text-black" />
                    <span className="text-xs uppercase">Mesajlar yükleniyor...</span>
                  </div>
                ) : displayedMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-bold gap-3">
                    <div className="w-16 h-16 bg-[#FEF08A] rounded-full border-3 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                      <MessageSquare className="w-8 h-8 text-black" />
                    </div>
                    <p className="text-sm font-black text-black uppercase">
                      {chatSearchQuery ? "Eşleşen mesaj bulunamadı." : "Henüz bir mesaj yok!"}
                    </p>
                    {!chatSearchQuery && (
                      <p className="text-xs font-bold text-gray-500 max-w-xs text-center">
                        Aşağıdaki hızlı konuşma başlatıcılardan birine tıklayarak sohbete hemen başlayabilirsiniz.
                      </p>
                    )}
                  </div>
                ) : (
                  displayedMessages.map((msg, index) => {
                    const isMe = msg.sender_id === user?.id;
                    const bubbleClass = isMe 
                      ? `${dmChatTheme.myBubbleClass} my-bubble` 
                      : `${dmChatTheme.partnerBubbleClass} partner-bubble`;
                    const alignmentClass = isMe ? "self-end" : "self-start";

                    const showDateDivider = isDifferentDay(
                      msg.created_at,
                      index > 0 ? displayedMessages[index - 1].created_at : undefined
                    );

                    // Check if message is a Lobby Invite card
                    const isLobbyInvite = msg.content.startsWith("🎮 [LOBİ DAVETİ]:");
                    const lobbyMatch = msg.content.match(/\/lobby\/([a-zA-Z0-9-]+)/);
                    const lobbyIdFromMsg = lobbyMatch ? lobbyMatch[1] : null;

                    return (
                      <div key={msg.id} className="contents">
                        {showDateDivider && (
                          <div className="flex items-center justify-center my-2.5 select-none">
                            <span className="bg-[#FEF08A] text-black font-black text-[10px] uppercase tracking-wider px-3 py-0.5 border-2 border-black shadow-[2px_2px_0_0_#000]">
                              📅 {formatDateDivider(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex flex-col max-w-[85%] md:max-w-[75%] ${alignmentClass} group relative`}
                        >
                        {/* Header info */}
                        <div className={`flex items-center gap-2 mb-1 ${isMe ? "justify-end" : ""}`}>
                          {!isMe && (
                            <span className={`font-black text-xs ${
                              equippedDmTheme === "dm_theme_midnight_purple" 
                                ? "text-[#C084FC]" 
                                : equippedDmTheme === "dm_theme_emerald_secure" 
                                ? "text-[#34D399]" 
                                : "text-black"
                            }`}>
                              {activeConversation.friend.display_name || activeConversation.friend.username}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold ${
                            equippedDmTheme === "dm_theme_midnight_purple" || equippedDmTheme === "dm_theme_emerald_secure"
                              ? "text-slate-400"
                              : "text-gray-500"
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Bubble row with Hover Quick Reaction Bar */}
                        <div className="flex items-start gap-2 relative">
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full border-2 border-black overflow-hidden bg-gradient-to-br from-[#FB923C] to-[#F472B6] flex items-center justify-center font-black text-[10px] text-white shrink-0 mt-0.5">
                              {activeConversation.friend.avatar_url ? (
                                <img
                                  src={getAvatarUrl(activeConversation.friend.avatar_url)}
                                  alt={activeConversation.friend.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                activeConversation.friend.username.charAt(0).toUpperCase()
                              )}
                            </div>
                          )}

                          <div className="relative group">
                            {/* Hover Reaction Picker */}
                            <div className={`absolute -top-7 ${isMe ? "right-0" : "left-0"} bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-full px-2 py-0.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto`}>
                              {EMOJI_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  className="text-xs hover:scale-125 transition-transform cursor-pointer px-0.5"
                                  title={`Tepki ver: ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>

                            {/* Message Bubble or Lobby Invite Card */}
                            {isLobbyInvite && lobbyIdFromMsg ? (
                              <div className="p-4 bg-gradient-to-br from-[#FEF08A] to-[#86EFAC] brutal-border border-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)] rounded-sm max-w-sm space-y-2.5">
                                <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                                  <div className="flex items-center gap-1.5 font-black text-xs uppercase text-black">
                                    <DoorOpen className="w-4 h-4 text-emerald-800" />
                                    <span>LOBİ DAVETİ</span>
                                  </div>
                                  <Badge className="bg-black text-white font-black text-[9px] uppercase">
                                    Canlı Oda
                                  </Badge>
                                </div>
                                <p className="text-xs font-bold text-black leading-relaxed whitespace-pre-wrap">
                                  {msg.content}
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => router.push(`/lobby/${lobbyIdFromMsg}`)}
                                  className="w-full h-8 bg-black hover:bg-neutral-800 text-[#FEF08A] font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> Lobiye Katıl
                                </Button>
                              </div>
                            ) : (
                              <div
                                className={`${bubbleClass} px-4 py-2.5 rounded-sm group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow`}
                              >
                                <p className="whitespace-pre-wrap font-medium break-words text-sm leading-relaxed text-inherit">
                                  {renderHighlightedText(msg.content, chatSearchQuery)}
                                </p>
                              </div>
                            )}

                            {/* Active Reactions Pills (Persisted to Database) */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {msg.reactions.map((r) => {
                                  const hasReacted = user && r.users.includes(user.id);
                                  return (
                                    <button
                                      key={r.reaction}
                                      type="button"
                                      onClick={() => handleToggleReaction(msg.id, r.reaction)}
                                      className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-xs font-black rounded-sm shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer transition-transform hover:scale-105 ${
                                        hasReacted
                                          ? "bg-[#FEF08A] border-black text-black ring-1 ring-black"
                                          : "bg-white border-black text-black"
                                      }`}
                                      title={`${r.count} kişi tepki verdi`}
                                    >
                                      <span>{r.reaction}</span>
                                      <span className="text-[10px] text-gray-700">{r.count}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Delivery / Read Status for outgoing */}
                        {isMe && (
                          <div className="flex items-center justify-end gap-1 mt-0.5 pr-1">
                            {msg.is_read ? (
                              <span className="flex items-center text-[10px] font-bold text-blue-600 gap-0.5" title="Görüldü">
                                <CheckCheck className="w-3 h-3" /> Görüldü
                              </span>
                            ) : (
                              <span className="flex items-center text-[10px] font-bold text-gray-400 gap-0.5" title="İletildi">
                                <Check className="w-3 h-3" /> İletildi
                              </span>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Animated Partner Typing Indicator */}
                {partnerIsTyping && (
                  <div className="self-start flex items-center gap-2 bg-white px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-sm animate-fade-in text-xs font-bold text-gray-600">
                    <span className="text-black font-black">
                      {activeConversation.friend.display_name || activeConversation.friend.username}
                    </span>
                    <span>yazıyor</span>
                    <span className="flex gap-1 ml-0.5">
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
                    </span>
                  </div>
                )}
              </div>

              {/* Conversation Starters (Quick Prompts) */}
              {messages.length === 0 && (
                <div className={`${dmChatTheme.quickPromptsClass} p-3 flex flex-wrap gap-2 items-center transition-colors`}>
                  <span className="text-xs font-black uppercase flex items-center gap-1 mr-1 text-inherit">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hızlı Başla:
                  </span>
                  {CONVERSATION_STARTERS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(undefined, prompt)}
                      className="text-xs font-bold bg-white hover:bg-[#FEF08A] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] px-2.5 py-1 rounded-sm cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-all text-black"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form & Action Bar */}
              <div className={`${dmChatTheme.inputBarClass} p-3 sm:p-4 shrink-0 relative transition-colors`}>
                {/* Popover Emoji Picker */}
                {emojiPickerOpen && (
                  <div className="mb-3 p-3 bg-white border-3 border-black shadow-[4px_4px_0_0_#000] rounded-none animate-slide-down">
                    <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                        <Smile className="w-3.5 h-3.5 text-amber-500" /> Hızlı Emojiler
                      </span>
                      <button
                        type="button"
                        onClick={() => setEmojiPickerOpen(false)}
                        className="p-1 hover:bg-gray-100 border border-black cursor-pointer text-xs font-black"
                      >
                        <X className="w-3.5 h-3.5 text-black" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                        <div key={category}>
                          <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                            {category}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {emojis.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleInsertEmoji(emoji)}
                                className="w-8 h-8 flex items-center justify-center text-base hover:scale-125 hover:bg-[#FEF08A] border border-black/20 hover:border-black rounded-none transition-all cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Action Toolbar */}
                <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                    className={`px-2.5 py-1 text-xs font-black uppercase flex items-center gap-1 border-2 border-black transition-all cursor-pointer shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0 ${
                      emojiPickerOpen ? "bg-black text-white" : "bg-white text-black hover:bg-[#FEF08A]"
                    }`}
                    title="Emoji Menüsünü Aç"
                  >
                    <Smile className="w-3.5 h-3.5" />
                    <span>Emoji</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction("dice")}
                    className="px-2.5 py-1 text-xs font-black uppercase flex items-center gap-1 bg-white hover:bg-[#FEF08A] text-black border-2 border-black transition-all cursor-pointer shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0"
                    title="Zar At (1-6)"
                  >
                    <Dices className="w-3.5 h-3.5 text-purple-700" />
                    <span>Zar At</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction("coin")}
                    className="px-2.5 py-1 text-xs font-black uppercase flex items-center gap-1 bg-white hover:bg-[#FEF08A] text-black border-2 border-black transition-all cursor-pointer shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0"
                    title="Yazı-Tura Fırlat"
                  >
                    <span>🪙</span>
                    <span>Yazı-Tura</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction("invite")}
                    className="px-2.5 py-1 text-xs font-black uppercase flex items-center gap-1 bg-white hover:bg-[#4ADE80] text-black border-2 border-black transition-all cursor-pointer shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0"
                    title="Lobiye Davet Gönder"
                  >
                    <DoorOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Lobiye Davet</span>
                  </button>
                </div>

                <form onSubmit={handleSend} className="flex items-center gap-2.5" autoComplete="off">
                  <Input
                    value={inputMessage}
                    onChange={handleInputChange}
                    placeholder="Mesajınızı yazın..."
                    autoComplete="off"
                    className="flex-1 bg-white h-12 text-base font-medium brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] transition-all"
                  />
                  <Button
                    type="submit"
                    disabled={!inputMessage.trim() || isSending}
                    className="h-12 px-6 bg-[#FB923C] hover:bg-[#F97316] text-black font-black text-base brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>GÖNDER</span>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Right Drawer: Friend Details */}
            {showInfoDrawer && (
              <div className="w-72 lg:w-80 bg-white border-l-4 border-black flex flex-col shrink-0 animate-slide-left h-full overflow-y-auto">
                <div className="p-4 bg-[#FEF08A] border-b-3 border-black flex items-center justify-between">
                  <h4 className="font-black text-sm uppercase text-black">Arkadaş Bilgisi</h4>
                  <button 
                    type="button" 
                    onClick={() => setShowInfoDrawer(false)}
                    className="p-1 hover:bg-black/10 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4 text-black" />
                  </button>
                </div>

                {/* Profile Header */}
                <div className="p-5 flex flex-col items-center text-center border-b-2 border-black/10">
                  <div className="w-20 h-20 rounded-full border-3 border-black bg-gradient-to-br from-[#FB923C] to-[#F472B6] overflow-hidden shadow-[3px_3px_0_0_rgba(0,0,0,1)] mb-3">
                    {activeConversation.friend.avatar_url ? (
                      <img
                        src={getAvatarUrl(activeConversation.friend.avatar_url)}
                        alt={activeConversation.friend.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-2xl text-white">
                        {activeConversation.friend.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-black text-lg text-black">
                    {activeConversation.friend.display_name || activeConversation.friend.username}
                  </h3>
                  <span className="text-xs font-bold text-gray-500">@{activeConversation.friend.username}</span>

                  <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-black text-green-800 text-xs font-black rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#4ADE80] border border-black" />
                    <span>Lobi AI Üyesi</span>
                  </div>

                  {activeConversation.friend.bio && (
                    <div className="mt-3 p-2.5 bg-[#FEF08A] border-2 border-black shadow-[2px_2px_0_0_#000] text-left w-full">
                      <span className="text-[9px] font-black uppercase text-black/60 block mb-0.5">Hakkında</span>
                      <p className="text-xs font-bold text-black leading-snug">
                        💬 {activeConversation.friend.bio}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Actions in Drawer */}
                <div className="p-4 space-y-2 border-b-2 border-black/10">
                  <span className="text-[11px] font-black uppercase text-gray-400 block mb-1">Eylemler</span>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setProfileUserId(activeConversation.friend.id);
                      setProfileOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-[#FB923C]" /> Tam Profili Aç
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleExportChat}
                    className="w-full py-2 px-3 bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-[#06B6D4]" /> Sohbeti İndir (.txt)
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenInviteModal}
                    className="w-full py-2 px-3 bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5 text-[#4ADE80]" /> Lobiye Davet Et
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMuted(!isMuted);
                      toast.add({
                        title: isMuted ? "Bildirimler Açıldı" : "Sohbet Sessize Alındı",
                        description: isMuted ? "Bu arkadaştan gelen bildirimler gösterilecek." : "Bu sohbet için bildirimler susturuldu.",
                        type: "info",
                      });
                    }}
                    className="w-full py-2 px-3 bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <BellOff className="w-3.5 h-3.5 text-[#F472B6]" />
                      {isMuted ? "Sesi Aç" : "Sessize Al"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Conversation Stats */}
                <div className="p-4 space-y-2 mt-auto">
                  <span className="text-[11px] font-black uppercase text-gray-400 block mb-1">Sohbet Bilgisi</span>
                  <div className="bg-gray-50 p-2.5 border border-black/20 text-xs font-bold space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Toplam Mesaj:</span>
                      <span className="text-black font-black">{messages.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bağlantı:</span>
                      <span className="text-emerald-600 font-black">Aktif (PostgreSQL)</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-[#FEF08A] border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] mb-4">
              <MessageSquare className="w-10 h-10 text-black" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-black">Direkt Mesajlar</h3>
            <p className="text-sm font-bold text-gray-500 max-w-sm mb-4">
              Sol taraftaki listenizden bir sohbet seçin veya "Tüm Arkadaşlar" sekmesinden yeni bir sohbet sekmesi açın.
            </p>
            <Button
              onClick={() => setLeftTab("all_friends")}
              className="bg-[#FEF08A] hover:bg-[#FDE047] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              <Users className="w-4 h-4 mr-1.5" /> Tüm Arkadaşlarımı Listele
            </Button>
          </div>
        )}
      </div>

      {/* User Profile Dialog */}
      <UserProfileDialog
        userId={profileUserId}
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* Interactive Lobby Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md bg-[#FAF8F0] brutal-border border-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-600" /> Lobiye Davet Et
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-gray-600">
              Arkadaşınızı davet etmek istediğiniz odayı seçin:
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {isLoadingLobbies ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-500 font-bold">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
                <span className="text-xs uppercase">Odalar yükleniyor...</span>
              </div>
            ) : availableLobbies.length === 0 ? (
              <div className="p-4 text-center text-xs font-bold text-gray-500 bg-white border-2 border-black">
                Aktif lobi bulunamadı. Önce bir oda oluşturabilirsiniz!
              </div>
            ) : (
              availableLobbies.map((lobby) => (
                <div
                  key={lobby.id}
                  className="p-3 bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-between gap-2.5 hover:bg-[#FEF08A]/30 transition-colors"
                >
                  <div className="min-w-0">
                    <h5 className="font-black text-sm text-black truncate">{lobby.name}</h5>
                    <p className="text-[11px] font-bold text-gray-500 truncate">
                      {lobby.member_count} üye • {lobby.visibility === "PRIVATE" ? "🔒 Özel" : "🌍 Herkese Açık"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSendLobbyInvite(lobby)}
                    className="h-8 px-3 bg-[#4ADE80] hover:bg-[#22C55E] text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] shrink-0 cursor-pointer"
                  >
                    Davet Gönder
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DM Theme Picker Dialog */}
      <Dialog open={dmThemeModalOpen} onOpenChange={setDmThemeModalOpen}>
        <DialogContent className="max-w-md bg-white brutal-border border-3 shadow-[6px_6px_0_0_#000] rounded-sm p-5 text-black">
          <DialogHeader className="border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xs bg-[#FEF08A] border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0_0_#000]">
                <Palette className="w-4 h-4 text-black" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase text-black tracking-tight">
                  DM Sohbet Teması Seç
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-gray-600">
                  Özel mesaj pencerelerinde anında uygulanacak temanızı belirleyin:
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {[
              {
                id: null,
                name: "Standart Neo-Brutalist",
                desc: "Klasik sarı & beyaz retro neo-brutalist stil",
                previewClass: "bg-[#FEF9C3] text-black border-2 border-black",
                badge: "Varsayılan",
              },
              {
                id: "dm_theme_midnight_purple",
                name: "Gece Moru & Eflatun",
                desc: "Koyu mor zemin ve neon eflatun hatlar",
                previewClass: "bg-[#2E1065] text-[#E9D5FF] border-2 border-[#A855F7]",
                badge: "Popüler",
              },
              {
                id: "dm_theme_emerald_secure",
                name: "Şifreli Zümrüt Yeşili",
                desc: "Uçtan uca şifreli hissi veren koyu zümrüt siber tonları",
                previewClass: "bg-[#064E3B] text-[#A7F3D0] border-2 border-[#10B981]",
                badge: "Siber",
              },
              {
                id: "dm_theme_sunset_vibes",
                name: "Günbatımı Şöleni",
                desc: "Canlı pembe ve turuncu günbatımı degradeleri",
                previewClass: "bg-gradient-to-r from-[#F472B6] to-[#FB923C] text-white border-2 border-black",
                badge: "Canlı",
              },
            ].map((th) => {
              const isSelected = (equippedDmTheme || null) === th.id;
              return (
                <div
                  key={String(th.id)}
                  onClick={() => handleSwitchDmTheme(th.id)}
                  className={`p-3 border-2 border-black rounded-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-white shadow-[3px_3px_0_0_#000] -translate-y-0.5 ring-2 ring-[#0891B2]"
                      : "bg-gray-50 hover:bg-white shadow-[1px_1px_0_0_#000]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-black">{th.name}</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-[#FEF08A] text-black border border-black">
                        {th.badge}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#4ADE80] border border-black flex items-center justify-center text-xs font-black text-black">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className={`p-2 rounded-xs text-[11px] font-bold mb-1 ${th.previewClass}`}>
                    "Merhaba! Yeni DM temam harika görünüyor ✨"
                  </div>
                  <p className="text-[10px] font-medium text-gray-500">{th.desc}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
          </div>
        }
      >
        <MessagesContent />
      </Suspense>
    </ProtectedRoute>
  );
}