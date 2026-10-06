"use client";

import { useState } from "react";
import { LobbyMember } from "@/types";
import { lobbiesApi } from "@/lib/api/lobbies";
import { friendsApi } from "@/lib/api/friends";
import { toast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  User, 
  UserPlus, 
  MicOff, 
  Mic, 
  UserMinus, 
  Ban, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2,
  Swords,
  Flag,
  Bot,
} from "lucide-react";
import { ReportUserModal } from "@/components/moderation/ReportUserModal";

interface MemberContextMenuProps {
  member: LobbyMember;
  currentUserId?: string;
  currentUserRole?: string;
  isLobbyOwner: boolean;
  lobbyId: string;
  onOpenProfile: (userId: string) => void;
  onActionSuccess?: () => void;
  onChallengeRps?: (targetId: string, targetUsername: string, isBot?: boolean) => void;
}


export function MemberContextMenu({
  member,
  currentUserId,
  currentUserRole = "MEMBER",
  isLobbyOwner,
  lobbyId,
  onOpenProfile,
  onActionSuccess,
  onChallengeRps,
}: MemberContextMenuProps) {
  const isSelf = currentUserId === member.user_id;
  const isTargetOwner = member.role === "OWNER";
  const isTargetModerator = member.role === "MODERATOR";
  const queryClient = useQueryClient();
  
  const canModerate = (isLobbyOwner || currentUserRole === "OWNER" || currentUserRole === "MODERATOR") && !isSelf && !isTargetOwner;
  // Only owners can moderate moderators or change roles
  const canManageRoles = (isLobbyOwner || currentUserRole === "OWNER") && !isSelf && !member.is_bot;

  // Dialog States
  const [confirmKickOpen, setConfirmKickOpen] = useState(false);
  const [confirmBanOpen, setConfirmBanOpen] = useState(false);
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [muteDuration, setMuteDuration] = useState<number | null>(15);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitiatingChat, setIsInitiatingChat] = useState(false);

  // Initiate AI Bot Chat Action
  const handleInitiateChat = async () => {
    setIsInitiatingChat(true);
    try {
      await lobbiesApi.initiateAgentChat(lobbyId, member.user_id);
      toast.add({
        title: "Sohbet Başlatıldı 🤖",
        description: `${member.username} odaya bir mesaj bıraktı!`,
        type: "success",
      });
      onActionSuccess?.();
    } catch (err: any) {
      toast.add({
        title: "Sohbet Başlatılamadı",
        description: err.response?.data?.error?.message || "Ajan şu an sohbet başlatamıyor.",
        type: "error",
      });
    } finally {
      setIsInitiatingChat(false);
    }
  };

  // Friend Request Action
  const handleAddFriend = async () => {
    try {
      await friendsApi.sendFriendRequest({ username: member.username });
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      toast.add({
        title: "Arkadaşlık İsteği Gönderildi",
        description: `${member.username} kullanıcısına arkadaşlık isteği gönderildi.`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Hata",
        description: err.response?.data?.error?.message || "Arkadaşlık isteği gönderilemedi.",
        type: "error",
      });
    }
  };

  // Kick Action
  const handleKick = async () => {
    setIsSubmitting(true);
    try {
      await lobbiesApi.moderateUser(lobbyId, "kick", member.user_id);
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.members(lobbyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.detail(lobbyId) });
      toast.add({
        title: "Kullanıcı Atıldı",
        description: `${member.username} lobiden çıkarıldı.`,
        type: "success",
      });
      setConfirmKickOpen(false);
      onActionSuccess?.();
    } catch (err: any) {
      toast.add({
        title: "Kullanıcı Atılamadı",
        description: err.response?.data?.error?.message || "Kullanıcı atılırken bir hata oluştu.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ban Action
  const handleBan = async () => {
    setIsSubmitting(true);
    try {
      await lobbiesApi.moderateUser(lobbyId, "ban", member.user_id);
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.members(lobbyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.bans(lobbyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.detail(lobbyId) });
      toast.add({
        title: "Kullanıcı Yasaklandı",
        description: `${member.username} lobiden yasaklandı.`,
        type: "success",
      });
      setConfirmBanOpen(false);
      onActionSuccess?.();
    } catch (err: any) {
      toast.add({
        title: "Yasaklama Başarısız",
        description: err.response?.data?.error?.message || "Kullanıcı yasaklanamadı.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mute Action
  const handleMute = async () => {
    setIsSubmitting(true);
    try {
      await lobbiesApi.moderateUser(lobbyId, "mute", member.user_id, muteDuration);
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.members(lobbyId) });
      toast.add({
        title: "Kullanıcı Susturuldu",
        description: `${member.username} susturuldu.`,
        type: "success",
      });
      setMuteDialogOpen(false);
      onActionSuccess?.();
    } catch (err: any) {
      toast.add({
        title: "Susturma Başarısız",
        description: err.response?.data?.error?.message || "Kullanıcı susturulamadı.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unmute Action
  const handleUnmute = async () => {
    setIsSubmitting(true);
    try {
      await lobbiesApi.moderateUser(lobbyId, "unmute", member.user_id);
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.members(lobbyId) });
      toast.add({
        title: "Kullanıcı Susturması Kaldırıldı",
        description: `${member.username} kullanıcısının susturması kaldırıldı.`,
        type: "success",
      });
      onActionSuccess?.();
    } catch (err: any) {
      toast.add({
        title: "İşlem Başarısız",
        description: err.response?.data?.error?.message || "Susturma kaldırılamadı.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Role Action
  const handleToggleRole = async () => {
    const newRole = isTargetModerator ? "MEMBER" : "MODERATOR";
    try {
      await lobbiesApi.setMemberRole(lobbyId, member.user_id, newRole);
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.members(lobbyId) });
      toast.add({
        title: "Rol Güncellendi",
        description: `${member.username} kullanıcısının yeni rolü: ${newRole === "MODERATOR" ? "Moderatör" : "Üye"}.`,
        type: "success",
      });
      onActionSuccess?.();
    } catch (err: any) {
      toast.add({
        title: "Rol Güncellenemedi",
        description: err.response?.data?.error?.message || "Kullanıcı rolü değiştirilemedi.",
        type: "error",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 text-gray-500 hover:text-black hover:bg-black/10 rounded-sm cursor-pointer"
              title="Üye Seçenekleri"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          }
        />

        <DropdownMenuContent
          align="end"
          className="w-52 bg-white brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-1.5 font-bold z-50 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {/* User Profile */}
          <DropdownMenuItem
            className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded-none font-bold"
            onClick={() => onOpenProfile(member.user_id)}
          >
            <User className="w-4 h-4 text-black" />
            <span>Profili Görüntüle</span>
            {isSelf && <span className="ml-auto text-[10px] text-gray-400">(Sen)</span>}
          </DropdownMenuItem>

          {/* Add Friend (Only for other humans) */}
          {!isSelf && !member.is_bot && (
            <DropdownMenuItem
              className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded-none font-bold"
              onClick={handleAddFriend}
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Arkadaş Ekle</span>
            </DropdownMenuItem>
          )}

          {/* Initiate AI Chat (Only for Bots) */}
          {member.is_bot && (
            <DropdownMenuItem
              className="flex items-center gap-2 p-2 hover:bg-[#E0F4FF] cursor-pointer rounded-none font-bold text-blue-900"
              onClick={handleInitiateChat}
              disabled={isInitiatingChat}
            >
              {isInitiatingChat ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Bot className="w-4 h-4 text-blue-600" />
              )}
              <span>{isInitiatingChat ? "Ajan Başlatılıyor..." : "🤖 Sohbet Başlat"}</span>
            </DropdownMenuItem>
          )}


          {/* 1v1 RPS Challenge */}
          {!isSelf && onChallengeRps && (
            <DropdownMenuItem
              className="flex items-center gap-2 p-2 hover:bg-[#FEF08A] cursor-pointer rounded-none font-bold text-black"
              onClick={() => onChallengeRps(member.user_id, member.username, member.is_bot)}
            >
              <span className="text-sm">✊</span>
              <span>{member.is_bot ? "✊ Ajanla Taş-Kağıt-Makas" : "✊ Taş-Kağıt-Makas Oyna"}</span>
            </DropdownMenuItem>
          )}


          {/* Moderation Actions */}
          {canModerate && (
            <>
              <DropdownMenuSeparator className="my-1 border-t-2 border-black" />

              {/* Role promotion / demotion */}
              {canManageRoles && (
                <DropdownMenuItem
                  className="flex items-center gap-2 p-2 hover:bg-purple-50 text-purple-900 cursor-pointer rounded-none font-bold"
                  onClick={handleToggleRole}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>{isTargetModerator ? "Üyeliğe Düşür" : "Moderatör Yap"}</span>
                </DropdownMenuItem>
              )}

              {/* Mute (not applicable to bots) */}
              {!member.is_bot && (
                <>
                  <DropdownMenuItem
                    className="flex items-center gap-2 p-2 hover:bg-amber-50 text-amber-900 cursor-pointer rounded-none font-bold"
                    onClick={() => setMuteDialogOpen(true)}
                  >
                    <MicOff className="w-4 h-4 text-amber-600" />
                    <span>Kullanıcıyı Sustur...</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 p-2 hover:bg-green-50 text-green-700 cursor-pointer rounded-none font-bold"
                    onClick={handleUnmute}
                  >
                    <Mic className="w-4 h-4 text-green-600" />
                    <span>Susturmayı Kaldır</span>
                  </DropdownMenuItem>
                </>
              )}

              {/* Kick */}
              <DropdownMenuItem
                className="flex items-center gap-2 p-2 hover:bg-red-50 text-red-700 cursor-pointer rounded-none font-bold"
                onClick={() => setConfirmKickOpen(true)}
              >
                <UserMinus className="w-4 h-4 text-red-600" />
                <span>Lobiden At</span>
              </DropdownMenuItem>

              {/* Ban */}
              <DropdownMenuItem
                className="flex items-center gap-2 p-2 hover:bg-red-50 text-red-700 cursor-pointer rounded-none font-bold"
                onClick={() => setConfirmBanOpen(true)}
              >
                <Ban className="w-4 h-4 text-red-600" />
                <span>Lobiden Yasakla</span>
              </DropdownMenuItem>
            </>
          )}

          {/* Report User Action */}
          {!isSelf && (
            <>
              <DropdownMenuSeparator className="my-1 border-t-2 border-black" />
              <DropdownMenuItem
                className="flex items-center gap-2 p-2 hover:bg-red-50 text-red-600 cursor-pointer rounded-none font-bold"
                onClick={() => setReportModalOpen(true)}
              >
                <Flag className="w-4 h-4 text-red-600" />
                <span>Kullanıcıyı Şikayet Et</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mute Duration Dialog */}
      <Dialog open={muteDialogOpen} onOpenChange={setMuteDialogOpen}>
        <DialogContent className="brutal-border border-4 brutal-shadow bg-[#FEF08A] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <MicOff className="w-5 h-5 text-amber-600" />
              {member.username} Kullanıcısını Sustur
            </DialogTitle>
            <DialogDescription className="font-bold text-black/80 text-xs">
              Bu kullanıcının lobide mesaj yazmasının ne kadar süreyle engelleneceğini seçin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3">
            {[
              { label: "5 Dakika", value: 5 },
              { label: "15 Dakika", value: 15 },
              { label: "1 Saat", value: 60 },
              { label: "Süresiz (Kaldırılana Kadar)", value: null },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setMuteDuration(option.value)}
                className={`w-full p-2.5 text-left font-bold text-xs brutal-border border-2 flex items-center justify-between cursor-pointer transition-all ${
                  muteDuration === option.value
                    ? "bg-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                <span>{option.label}</span>
                {muteDuration === option.value && <span>✓</span>}
              </button>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMuteDialogOpen(false)}
              className="bg-white border-2 border-black font-black uppercase cursor-pointer"
            >
              İptal
            </Button>
            <Button
              size="sm"
              onClick={handleMute}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-black border-2 border-black font-black uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Susturmayı Onayla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kick Confirmation Dialog */}
      <AlertDialog open={confirmKickOpen} onOpenChange={setConfirmKickOpen}>
        <AlertDialogContent className="brutal-border border-4 brutal-shadow bg-[#FEF08A] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-red-600" />
              {member.username} Lobiden Atılsın mı?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-black/80 text-xs">
              Kullanıcı lobiden derhal çıkarılacaktır. Lobi herkese açıksa tekrar katılabilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel 
              disabled={isSubmitting}
              className="font-black uppercase bg-white border-2 border-black cursor-pointer"
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleKick();
              }}
              disabled={isSubmitting}
              className="font-black uppercase bg-red-600 hover:bg-red-700 text-white border-2 border-black cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Evet, Lobiden At"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Confirmation Dialog */}
      <AlertDialog open={confirmBanOpen} onOpenChange={setConfirmBanOpen}>
        <AlertDialogContent className="brutal-border border-4 brutal-shadow bg-[#FEF08A] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" />
              {member.username} Lobiden Yasaklansın mı?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-black/80 text-xs">
              Bu kullanıcı lobiden kalıcı olarak yasaklanacak ve bir yönetici yasağı kaldırmadığı sürece tekrar katılamayacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel 
              disabled={isSubmitting}
              className="font-black uppercase bg-white border-2 border-black cursor-pointer"
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBan();
              }}
              disabled={isSubmitting}
              className="font-black uppercase bg-red-600 hover:bg-red-700 text-white border-2 border-black cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Evet, Kullanıcıyı Yasakla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report User Dialog */}
      <ReportUserModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetUser={{
          id: member.user_id,
          username: member.username,
          display_name: member.display_name,
          avatar_url: member.avatar_url,
        }}
        lobbyId={lobbyId}
      />
    </>
  );
}
