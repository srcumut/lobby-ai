"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/hooks/useAuth";
import { friendsApi } from "@/lib/api/friends";
import { UserInfo } from "@/types";
import { AddFriendModal } from "@/components/friends/AddFriendModal";
import { AllFriendsDialog } from "@/components/friends/AllFriendsDialog";
import { 
  Bot, 
  Compass, 
  Home, 
  LogOut, 
  Settings, 
  User, 
  PanelLeftClose, 
  Users, 
  Plus,
  MessageSquare,
  MessageSquarePlus,
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { Button } from "@/components/ui/button";
import { getAvatarUrl } from "@/lib/avatar";
import { AvatarFrame } from "@/components/avatar/AvatarFrame";
import { getEquippedCosmetics, EquippedCosmetics } from "@/lib/cosmetics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAllFriendsOpen, setIsAllFriendsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [equippedCosmetics, setEquippedCosmetics] = useState<EquippedCosmetics>({});

  useEffect(() => {
    setEquippedCosmetics(getEquippedCosmetics());
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setEquippedCosmetics(e.detail);
      }
    };
    window.addEventListener("lobby:cosmetics_updated", handleUpdate);
    return () => {
      window.removeEventListener("lobby:cosmetics_updated", handleUpdate);
    };
  }, []);

  const { data: friends = [] } = useQuery<UserInfo[]>({
    queryKey: queryKeys.friends.all,
    queryFn: () => friendsApi.getFriends(),
    enabled: isAuthenticated,
    staleTime: 10_000,
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: queryKeys.friends.pending,
    queryFn: () => friendsApi.getPendingRequests(),
    enabled: isAuthenticated,
    staleTime: 10_000,
  });

  const pendingCount = pendingRequests.length;

  const handleFriendsUpdated = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.friends.pending });
  };

  const navItems = [
    { name: "Kontrol Paneli", href: "/", icon: Home },
    { name: "Odaları Keşfet", href: "/lobbies", icon: Compass },
    { name: "Mesajlar", href: "/messages", icon: MessageSquare },
    { name: "Topluluk Meydanı", href: "/community", icon: Sparkles },
    { name: "Mağaza", href: "/shop", icon: ShoppingBag },
    { name: "Ajanlarım", href: "/agents", icon: Bot },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container: Starts below full-width Navbar, width 260px, border-r-2 border-black */}
      <aside 
        className={`
          sidebar-aside fixed md:relative top-16 md:top-0 left-0 z-40 h-[calc(100vh-4rem)] md:h-full w-[260px] flex flex-col
          bg-[#F4F0E6] border-r-2 border-black transition-transform duration-300 ease-in-out shrink-0 select-none
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Mobile Header (Only visible on mobile screens) */}
        <div className="sidebar-mobile-header flex md:hidden items-center justify-between px-4 py-2 border-b-2 border-black bg-[#FDFBF7]">
          <span className="font-black text-xs uppercase tracking-wider text-gray-600">Menü</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-black hover:bg-black/10 h-7 w-7 p-0"
            onClick={() => setIsOpen(false)}
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-1.5 no-scrollbar">
          {isAuthenticated ? (
            <>
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      sidebar-nav-link flex items-center gap-2.5 px-3 py-2 rounded-sm font-black text-xs uppercase transition-all
                      border-2 border-black cursor-pointer
                      ${isActive 
                        ? 'sidebar-nav-active bg-black text-white shadow-[2px_2px_0_0_rgba(255,255,255,1)] translate-x-0.5 translate-y-0.5' 
                        : 'bg-white text-black hover:bg-[#FEF08A] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5'}
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0 stroke-[2.5]" />
                    <span className="flex-1 tracking-wide">{item.name}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse shrink-0"></span>
                    )}
                  </Link>
                );
              })}

              {/* Friends Section: Compact, no scrollbar overflow, 3 friends fit comfortably */}
              <div className="mt-3 pt-3 border-t-2 border-dashed border-gray-300">
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <h3 className="sidebar-section-heading font-black text-[11px] uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-black" /> Arkadaşlar
                    {pendingCount > 0 && (
                      <span className="sidebar-pending-box bg-[#F472B6] text-black text-[10px] px-1.5 py-0.2 rounded-full font-black border border-black animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setIsAllFriendsOpen(true)}
                      className="p-1 bg-[#FEF08A] hover:bg-[#fde047] border-2 border-black rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer"
                      title="Tüm Arkadaşlar ve İstekler"
                    >
                      <Users className="w-3 h-3 text-black" />
                    </button>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="p-1 bg-[#06B6D4] hover:bg-[#0891B2] border-2 border-black rounded-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer"
                      title="Arkadaş Ekle"
                    >
                      <Plus className="w-3 h-3 text-black stroke-[3]" />
                    </button>
                  </div>
                </div>

                {friends.length === 0 ? (
                  <div className="sidebar-empty-box text-[11px] font-bold text-gray-500 p-2.5 text-center bg-white border-2 border-dashed border-gray-300 rounded-sm">
                    Henüz arkadaş yok
                  </div>
                ) : (
                  <div className="space-y-1 overflow-hidden">
                    {friends.slice(0, 3).map(friend => (
                      <div 
                        key={friend.id} 
                        onClick={() => {
                          router.push(`/messages?userId=${friend.id}`);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 py-1.5 px-2 bg-white border-2 border-transparent hover:border-black rounded-sm cursor-pointer group hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                        title={`Mesaj Gönder: ${friend.username}`}
                      >
                        <div className="w-6 h-6 bg-gradient-to-br from-[#06B6D4] to-[#8B5CF6] rounded-full border border-black flex items-center justify-center font-black text-[10px] text-white shrink-0 overflow-hidden">
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
                        <span className="font-bold text-xs truncate flex-1 text-black">{friend.username}</span>
                        <MessageSquare className="w-3 h-3 text-gray-400 group-hover:text-black shrink-0 transition-colors" />
                      </div>
                    ))}

                    <button
                      onClick={() => setIsAllFriendsOpen(true)}
                      className="w-full mt-2 py-1.5 text-[11px] font-black uppercase text-center bg-white hover:bg-[#FEF08A] border-2 border-black rounded-sm transition-all cursor-pointer text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px block"
                    >
                      TÜM ARKADAŞLARI GÖR ({friends.length})
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center mt-6 p-3 bg-white border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] rounded-sm">
              <p className="font-bold text-xs text-gray-600 mb-3">Odalara katılmak ve sohbet etmek için giriş yapın.</p>
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-[#06B6D4] hover:bg-[#0891B2] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all">
                  GİRİŞ YAP
                </Button>
              </Link>
            </div>
          )}
          {/* Feedback Button */}
          <div className="mt-3 pt-3 border-t-2 border-dashed border-black/20">
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#FEF08A] hover:bg-[#FDE047] border-2 border-black rounded-sm font-black text-xs uppercase tracking-wider text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer"
              title="Öneri ve Hata Bildir"
            >
              <MessageSquarePlus className="w-4 h-4 text-black stroke-[2.5]" />
              Geri Bildirim Bildir
            </button>
          </div>
        </div>

        {/* User Profile (Bottom) */}
        {isAuthenticated && user && (
          <div className="sidebar-profile-box border-t-2 border-black p-3 bg-[#FDFBF7] shrink-0">
            <div 
              onClick={() => {
                router.push("/profile");
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 mb-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-sm border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all group"
              title="Profilime Git"
            >
              <div className="shrink-0 p-1 flex items-center justify-center">
                <AvatarFrame
                  borderId={equippedCosmetics.border}
                  animationId={equippedCosmetics.avatar_animation}
                  size="sm"
                >
                  <div className="w-9 h-9 rounded-full border-2 border-black bg-[#F472B6] flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                    {user.avatar_url ? (
                      <img
                        src={getAvatarUrl(user.avatar_url)}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-black" />
                    )}
                  </div>
                </AvatarFrame>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-xs truncate group-hover:underline text-black">{user.display_name || user.username}</p>
                <p className="text-[10px] font-bold text-gray-500 truncate">@{user.username}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                data-testid="sidebar-settings-button"
                className="sidebar-profile-btn flex-1 h-8 bg-[#FEF08A] hover:bg-[#FDE047] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer flex items-center justify-center gap-1.5"
                onClick={() => {
                  setIsSettingsOpen(true);
                }}
                title="Sistem ve Uygulama Ayarları"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>AYARLAR</span>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="sidebar-logout-btn h-8 w-8 bg-[#FFE4E6] hover:bg-[#fecdd3] text-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer"
                      title="Çıkış Yap"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-600" />
                    </Button>
                  }
                />
                <AlertDialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-[#FEF08A] rounded-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black uppercase">Ayrılıyor musunuz?</AlertDialogTitle>
                    <AlertDialogDescription className="font-bold text-black/80 text-sm">
                      Lobby AI hesabınızdan çıkış yapmak istediğinize emin misiniz?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel className="font-black bg-white text-black border-2 border-black uppercase text-xs cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      İptal
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={logout}
                      className="font-black bg-red-600 text-white border-2 border-black uppercase text-xs hover:bg-red-700 cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                    >
                      Çıkış Yap
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </aside>

      {/* Add Friend Modal */}
      <AddFriendModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onFriendsUpdated={handleFriendsUpdated}
      />

      {/* All Friends & Requests Hub Dialog */}
      <AllFriendsDialog
        isOpen={isAllFriendsOpen}
        onClose={() => setIsAllFriendsOpen(false)}
        onFriendsUpdated={handleFriendsUpdated}
        onOpenAddFriend={() => setIsAddModalOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
