"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NotificationResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Bell, 
  CheckCheck, 
  Search, 
  Clock, 
  Sparkles, 
  UserMinus, 
  Ban, 
  MicOff, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Info, 
  MessageSquare,
  Filter,
  Check,
  ExternalLink
} from "lucide-react";
import { lobbiesApi } from "@/lib/api/lobbies";
import { toast } from "@/components/ui/toast";

interface AllNotificationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationResponse[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return "Az önce";
    if (diffMin < 60) return `${diffMin} dk önce`;
    if (diffHours < 24) return `${diffHours} sa önce`;
    if (diffDays === 1) return "Dün";
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString("tr-TR");
  } catch {
    return dateString;
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "KICKED":
      return <UserMinus className="w-4 h-4 text-red-600" />;
    case "BANNED":
      return <Ban className="w-4 h-4 text-red-600" />;
    case "MUTED":
      return <MicOff className="w-4 h-4 text-amber-600" />;
    case "NEW_REACTION":
      return <Sparkles className="w-4 h-4 text-purple-600" />;
    case "JOIN_REQUEST":
      return <UserPlus className="w-4 h-4 text-blue-600" />;
    case "JOIN_REQUEST_APPROVED":
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "JOIN_REQUEST_REJECTED":
      return <XCircle className="w-4 h-4 text-red-600" />;
    case "FRIEND_REQUEST":
      return <UserPlus className="w-4 h-4 text-indigo-600" />;
    case "FRIEND_REQUEST_ACCEPTED":
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "FRIEND_MESSAGE":
    case "DIRECT_MESSAGE":
      return <MessageSquare className="w-4 h-4 text-blue-600" />;
    default:
      return <Info className="w-4 h-4 text-gray-600" />;
  }
}

type TabType = "all" | "unread" | "lobbies" | "messages" | "moderation";

export function AllNotificationsDialog({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
}: AllNotificationsDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const hoverTimeoutMapRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingMarkReadRef = useRef<Set<string>>(new Set());

  // Clear hover timeouts on dialog close
  useEffect(() => {
    if (!isOpen) {
      hoverTimeoutMapRef.current.forEach((timeout) => clearTimeout(timeout));
      hoverTimeoutMapRef.current.clear();
    }
  }, [isOpen]);

  const handleItemMouseEnter = (item: NotificationResponse) => {
    if (item.is_read || pendingMarkReadRef.current.has(item.id)) return;

    // 400ms dwell delay: marks as read only when user deliberately hovers
    const timeout = setTimeout(() => {
      pendingMarkReadRef.current.add(item.id);
      markAsRead(item.id);
      hoverTimeoutMapRef.current.delete(item.id);
    }, 400);

    hoverTimeoutMapRef.current.set(item.id, timeout);
  };

  const handleItemMouseLeave = (itemId: string) => {
    const timeout = hoverTimeoutMapRef.current.get(itemId);
    if (timeout) {
      clearTimeout(timeout);
      hoverTimeoutMapRef.current.delete(itemId);
    }
  };

  const handleItemFocus = (item: NotificationResponse) => {
    if (item.is_read || pendingMarkReadRef.current.has(item.id)) return;
    pendingMarkReadRef.current.add(item.id);
    markAsRead(item.id);
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // 1. Tab filter
      if (activeTab === "unread" && notif.is_read) return false;
      if (activeTab === "lobbies") {
        const isLobby = 
          notif.type.includes("LOBBY") || 
          notif.type.includes("JOIN") || 
          notif.type === "NEW_REACTION";
        if (!isLobby) return false;
      }
      if (activeTab === "messages") {
        const isMsg = 
          notif.type === "DIRECT_MESSAGE" || 
          notif.type === "FRIEND_MESSAGE" ||
          notif.type.includes("FRIEND");
        if (!isMsg) return false;
      }
      if (activeTab === "moderation") {
        const isMod = 
          notif.type === "KICKED" || 
          notif.type === "BANNED" || 
          notif.type === "MUTED" ||
          notif.type.includes("ROLE");
        if (!isMod) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = notif.title?.toLowerCase().includes(q);
        const matchesMessage = notif.message?.toLowerCase().includes(q);
        const matchesType = notif.type?.toLowerCase().includes(q);
        return matchesTitle || matchesMessage || matchesType;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const handleNotificationClick = async (item: NotificationResponse) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    if (item.related_entity_id) {
      if (item.type === "DIRECT_MESSAGE" || item.type === "FRIEND_MESSAGE") {
        router.push(`/messages?userId=${item.related_entity_id}`);
        onClose();
      } else if (item.type === "LOBBY_INVITE") {
        try {
          await lobbiesApi.joinLobby(item.related_entity_id, {});
          toast.add({
            title: "Lobiye Katıldınız",
            description: "Davet kabul edildi, lobiye yönlendiriliyorsunuz.",
            type: "success",
          });
        } catch (err: any) {
          if (err.response?.status !== 409) {
            console.error("Failed to join lobby from invite:", err);
          }
        }
        router.push(`/lobby/${item.related_entity_id}`);
        onClose();
      } else if (
        item.type.includes("JOIN") ||
        item.type === "KICKED" ||
        item.type === "MUTED" ||
        item.type === "NEW_REACTION" ||
        item.type === "LOBBY_MENTION" ||
        item.type === "LOBBY_MESSAGE"
      ) {
        router.push(`/lobby/${item.related_entity_id}`);
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[680px] max-w-[680px] h-[640px] max-h-[88vh] flex flex-col bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-sm p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b-2 border-black bg-[#FEF08A] shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#4ADE80] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-sm">
                <Bell className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                  Tüm Bildirimler
                  {unreadCount > 0 && (
                    <span className="bg-[#EF4444] text-white text-[11px] font-black px-2 py-0.5 rounded-full border border-black animate-pulse">
                      {unreadCount} OKUNMAMIŞ
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-black/70">
                  Odalarınız, davetleriniz, direkt mesajlarınız ve sistem uyarılarınızın geçmiş arşivi.
                </DialogDescription>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="bg-white hover:bg-black hover:text-white border-2 border-black font-black text-xs uppercase h-8 px-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tümünü Oku
              </Button>
            )}
          </div>

          {/* Search bar inside dialog */}
          <div className="pt-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bildirimleri anahtar kelimeye göre filtreleyin..."
                autoComplete="off"
                className="pl-9 h-9 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-white font-bold text-xs focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
            {(
              [
                { id: "all", label: "TÜMÜ", count: notifications.length },
                { id: "unread", label: "OKUNMAMIŞ", count: unreadCount },
                { id: "lobbies", label: "ODALAR", count: undefined },
                { id: "messages", label: "MESAJLAR", count: undefined },
                { id: "moderation", label: "MODERASYON", count: undefined },
              ] as { id: TabType; label: string; count?: number }[]
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-sm border-2 border-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] -translate-y-0.5"
                      : "bg-white text-black hover:bg-yellow-100 shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1 py-0 rounded-full font-bold ${
                        isActive
                          ? "bg-white text-black"
                          : "bg-black text-white"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* Notification Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y-2 divide-gray-100 p-2 sm:p-3 space-y-1.5">
          {filteredNotifications.length === 0 ? (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#E0F4FF] border-2 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                <Filter className="w-7 h-7 text-black" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-base uppercase text-black">Bildirim bulunamadı</p>
                <p className="text-xs font-bold text-gray-500 max-w-xs">
                  {searchQuery
                    ? `"${searchQuery}" ile eşleşen bildirim bulunamadı. Farklı bir kelime deneyin.`
                    : "Bu kategorideki tüm bildirimleri gördünüz!"}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                onMouseEnter={() => handleItemMouseEnter(item)}
                onMouseLeave={() => handleItemMouseLeave(item.id)}
                onFocus={() => handleItemFocus(item)}
                tabIndex={0}
                className={`p-3 sm:p-3.5 border-2 border-black rounded-sm transition-all cursor-pointer group flex items-start gap-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-black ${
                  !item.is_read
                    ? "bg-[#E0F4FF] hover:bg-[#bae6fd]"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <div className="p-2 rounded-sm border-2 border-black bg-white shadow-[1px_1px_0_0_rgba(0,0,0,1)] shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs sm:text-sm uppercase truncate ${!item.is_read ? "font-black text-black" : "font-bold text-gray-700"}`}>
                      {item.title}
                    </h4>
                    <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-black/80 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-white border border-black rounded-xs shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                      {item.type.replace(/_/g, " ")}
                    </span>

                    {item.type === "LOBBY_INVITE" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#4ADE80] text-black border border-black text-[10px] font-black rounded-xs shadow-[1px_1px_0_0_rgba(0,0,0,1)] uppercase">
                        <UserPlus className="w-3 h-3" /> Katılmak İçin Tıkla
                      </span>
                    ) : item.related_entity_id ? (
                      <span className="text-[11px] font-black text-blue-700 flex items-center gap-1 group-hover:underline">
                        Detaya git <ExternalLink className="w-3 h-3" />
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-between self-stretch shrink-0 pl-1">
                  {!item.is_read ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(item.id);
                      }}
                      className="p-1 rounded-sm border border-black bg-white hover:bg-[#4ADE80] text-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-colors"
                      title="Okundu işaretle"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t-2 border-black bg-gray-50 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-gray-600">
            Toplam {notifications.length} bildirim
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-2 border-black font-black text-xs uppercase px-4 h-8 bg-white hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
          >
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
