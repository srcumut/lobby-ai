"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  CheckCheck, 
  Ban, 
  UserMinus, 
  MicOff, 
  Sparkles, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Clock,
  Users,
  Loader2,
} from "lucide-react";
import { AllNotificationsDialog } from "./AllNotificationsDialog";
import { lobbiesApi } from "@/lib/api/lobbies";
import { toast } from "@/components/ui/toast";

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
      return <Sparkles className="w-4 h-4 text-purple-600" />;
    default:
      return <Info className="w-4 h-4 text-gray-600" />;
  }
}

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAllDialogOpen, setIsAllDialogOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutMapRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingMarkReadRef = useRef<Set<string>>(new Set());

  // Clear hover timeouts on close
  useEffect(() => {
    if (!isOpen) {
      hoverTimeoutMapRef.current.forEach((timeout) => clearTimeout(timeout));
      hoverTimeoutMapRef.current.clear();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  const handleNotificationClick = async (item: NotificationResponse) => {
    handleItemMouseLeave(item.id);
    if (!item.is_read && !pendingMarkReadRef.current.has(item.id)) {
      pendingMarkReadRef.current.add(item.id);
      markAsRead(item.id);
    }
    if (item.related_entity_id) {
      if (item.type === "DIRECT_MESSAGE") {
        router.push(`/messages?userId=${item.related_entity_id}`);
        setIsOpen(false);
      } else if (item.type === "LOBBY_INVITE") {
        try {
          await lobbiesApi.joinLobby(item.related_entity_id, {});
          toast.add({
            title: "Lobiye Katıldınız",
            description: "Davet kabul edildi, lobiye yönlendiriliyorsunuz.",
            type: "success",
          });
        } catch (err: any) {
          // If 409 already member, proceed cleanly
          if (err.response?.status !== 409) {
            console.error("Failed to join lobby from invite:", err);
          }
        }
        router.push(`/lobby/${item.related_entity_id}`);
        setIsOpen(false);
      } else if (
        item.type.includes("JOIN") ||
        item.type === "KICKED" ||
        item.type === "MUTED" ||
        item.type === "FRIEND_MESSAGE" ||
        item.type === "NEW_REACTION" ||
        item.type === "LOBBY_MENTION" ||
        item.type === "LOBBY_MESSAGE"
      ) {
        router.push(`/lobby/${item.related_entity_id}`);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-sm bg-white hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer flex items-center justify-center"
        aria-label="Bildirimleri Aç"
        title="Bildirimler"
      >
        <Bell className="w-5 h-5 text-black" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-[#EF4444] text-white font-black text-xs flex items-center justify-center rounded-full border-2 border-black animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-sm z-50 animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="p-3 border-b-2 border-black bg-[#FEF08A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-black" />
              <h3 className="font-black text-base uppercase tracking-tight text-black">Bildirimler</h3>
              {unreadCount > 0 && (
                <span className="bg-black text-white text-xs font-black px-1.5 py-0.5 rounded-sm">
                  {unreadCount} yeni
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs font-black uppercase text-black hover:bg-black/10 h-7 px-2 flex items-center gap-1 cursor-pointer"
                title="Tümünü okundu işaretle"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tümünü Oku
              </Button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y-2 divide-gray-100 max-h-[340px]">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-gray-500 font-bold">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
                <span className="text-xs uppercase">Bildirimler yükleniyor...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-black flex items-center justify-center">
                  <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-black text-sm uppercase text-black">Her şey güncel!</p>
                <p className="text-xs font-bold text-gray-500">Şu anda bekleyen bildirim yok.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsAllDialogOpen(true);
                  }}
                  className="mt-2 py-1 px-3 bg-[#FEF08A] hover:bg-[#fde047] text-black font-black text-xs uppercase border-2 border-black rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Arşivi Gör
                </button>
              </div>
            ) : (
              notifications.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  tabIndex={0}
                  onClick={() => handleNotificationClick(item)}
                  onMouseEnter={() => handleItemMouseEnter(item)}
                  onMouseLeave={() => handleItemMouseLeave(item.id)}
                  onFocus={() => handleItemFocus(item)}
                  className={`p-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-yellow-50/60 outline-none focus-visible:bg-yellow-50 ${
                    !item.is_read ? "bg-[#E0F4FF]/50 border-l-4 border-l-[#3B82F6]" : "bg-white"
                  }`}
                >
                  <div className="p-1.5 rounded-sm border-2 border-black bg-white shadow-[1px_1px_0_0_rgba(0,0,0,1)] shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs uppercase truncate ${!item.is_read ? "font-black text-black" : "font-bold text-gray-700"}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    {item.type === "LOBBY_INVITE" && (
                      <div className="pt-1.5 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#4ADE80] text-black border border-black text-[10px] font-black rounded-xs shadow-[1px_1px_0_0_rgba(0,0,0,1)] uppercase">
                          <UserPlus className="w-3 h-3" /> Katılmak İçin Tıkla
                        </span>
                      </div>
                    )}
                  </div>
                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 border border-black shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer with "VIEW ALL NOTIFICATIONS" button */}
          <div className="p-2.5 border-t-2 border-black bg-gray-50 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsAllDialogOpen(true);
              }}
              className="w-full py-2 px-3 bg-white hover:bg-[#FEF08A] text-black font-black text-xs uppercase tracking-wider border-2 border-black rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>TÜM BİLDİRİMLERİ GÖR</span>
              <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-full font-bold">
                {notifications.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Complete All Notifications Modal Dialog */}
      <AllNotificationsDialog
        isOpen={isAllDialogOpen}
        onClose={() => setIsAllDialogOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
      />
    </div>
  );
}
