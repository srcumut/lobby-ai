import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, MicOff, Mic, UserMinus, Ban, UserCheck, UserPlus, Check, X, Loader2, Send, Mail, Shield } from "lucide-react";
import { lobbiesApi } from "@/lib/api/lobbies";
import { aiApi } from "@/lib/api/ai";
import { friendsApi } from "@/lib/api/friends";
import { getAvatarUrl } from "@/lib/avatar";
import { toast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { LobbyMember, BannedUser, Lobby, Agent, JoinRequest, UserInfo } from "@/types";

interface LobbySettingsDialogProps {
  lobby: Lobby | null;
  isOpen: boolean;
  onClose: () => void;
  myRole: string | null;
  currentUserId?: string;
  onUserProfileClick: (userId: string) => void;
  onLobbyUpdated: (updatedLobby: Lobby) => void;
  onMembersUpdated?: () => void;
}

export function LobbySettingsDialog({ lobby, isOpen, onClose, myRole, currentUserId, onUserProfileClick, onLobbyUpdated, onMembersUpdated }: LobbySettingsDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("members");
  
  const [members, setMembers] = useState<LobbyMember[]>([]);
  const [bans, setBans] = useState<BannedUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingBans, setLoadingBans] = useState(false);
  
  const [availableBots, setAvailableBots] = useState<Agent[]>([]);
  const [loadingBots, setLoadingBots] = useState(false);
  const [addingBot, setAddingBot] = useState<string | null>(null);

  // Settings tab form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Notification preference state
  const [notificationPreference, setNotificationPreference] = useState<"ALL" | "MENTIONS_ONLY" | "MUTE">("MENTIONS_ONLY");
  const [updatingNotification, setUpdatingNotification] = useState(false);

  // Join Requests state
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Invite state
  const [friends, setFriends] = useState<UserInfo[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  // Bot Interaction Settings State
  const [editingBotForPermissions, setEditingBotForPermissions] = useState<Agent | null>(null);
  const [selectedInteractionMode, setSelectedInteractionMode] = useState<"EVERYONE" | "OWNER_ONLY" | "MODERATORS" | "WHITELIST">("EVERYONE");
  const [whitelistUsersInput, setWhitelistUsersInput] = useState<string>("");
  const [isSavingBotPermissions, setIsSavingBotPermissions] = useState<boolean>(false);

  const handleOpenBotPermissions = (bot: Agent) => {
    setEditingBotForPermissions(bot);
    const rawBehavior = (bot.behavior_config as any) || {};
    const allowed: string[] = rawBehavior?.permissions?.allowed_users || rawBehavior?.allowed_users || [];
    const mode = (rawBehavior?.interaction_mode || rawBehavior?.permissions?.interaction_mode || (allowed.length > 0 ? "WHITELIST" : (bot as any).allow_user_interaction !== false ? "EVERYONE" : "OWNER_ONLY")) as any;
    setSelectedInteractionMode(mode);
    setWhitelistUsersInput(allowed.join(", "));
  };

  const handleSaveBotPermissions = async () => {
    if (!editingBotForPermissions) return;
    setIsSavingBotPermissions(true);
    try {
      const rawBehavior = ((editingBotForPermissions.behavior_config as any) || {});
      const allowedUsersList = selectedInteractionMode === "WHITELIST" 
        ? whitelistUsersInput.split(",").map(u => u.trim().replace(/^@/, "")).filter(Boolean)
        : [];

      const updatedBehavior = {
        ...rawBehavior,
        interaction_mode: selectedInteractionMode,
        allowed_users: allowedUsersList,
        permissions: {
          ...(rawBehavior.permissions || {}),
          interaction_mode: selectedInteractionMode,
          allowed_users: allowedUsersList,
        }
      };

      await aiApi.updateAgent(editingBotForPermissions.id, {
        name: editingBotForPermissions.name,
        provider: editingBotForPermissions.provider,
        model: editingBotForPermissions.model,
        behavior_config: updatedBehavior,
        allow_user_interaction: selectedInteractionMode === "EVERYONE",
        permissions: {
          can_initiate_chat: editingBotForPermissions.permissions?.can_initiate_chat ?? false,
          can_talk_to_agents: editingBotForPermissions.permissions?.can_talk_to_agents ?? false,
          allow_public_usage: selectedInteractionMode === "EVERYONE",
          interaction_mode: selectedInteractionMode,
          allowed_users: allowedUsersList,
        },
      });

      toast.add({
        title: "Yetkiler Güncellendi",
        description: `${editingBotForPermissions.name} botunun lobi içi etkileşim yetkileri başarıyla güncellendi.`,
        type: "success",
      });

      // Update in availableBots list
      setAvailableBots(prev => prev.map(b => b.id === editingBotForPermissions.id ? {
        ...b,
        behavior_config: updatedBehavior,
        allow_user_interaction: selectedInteractionMode === "EVERYONE",
      } : b));

      setEditingBotForPermissions(null);
    } catch (err: any) {
      toast.add({
        title: "Güncelleme Başarısız",
        description: err.response?.data?.error?.message || "Bot yetkileri güncellenemedi.",
        type: "error",
      });
    } finally {
      setIsSavingBotPermissions(false);
    }
  };

  useEffect(() => {
    if (members.length > 0 && currentUserId) {
      const me = members.find(m => m.user_id === currentUserId);
      if (me && me.notification_preference) {
        setNotificationPreference(me.notification_preference as any);
      }
    }
  }, [members, currentUserId]);

  useEffect(() => {
    if (isOpen && lobby) {
      setName(lobby.name);
      setDescription(lobby.description || "");
      fetchMembers();
      if (myRole === 'OWNER' || myRole === 'MODERATOR') {
        fetchBans();
        fetchBots();
        fetchRequests();
        fetchFriends();
      }
    }
  }, [isOpen, lobby, myRole]);

  const fetchRequests = async () => {
    if (!lobby) return;
    setLoadingRequests(true);
    try {
      const data = await lobbiesApi.getJoinRequests(lobby.id);
      setRequests(data);
    } catch (err) {
      console.error("Failed to load requests", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const data = await friendsApi.getFriends();
      setFriends(data);
    } catch (err) {
      console.error("Failed to load friends", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleApproveRequest = async (userId: string) => {
    if (!lobby) return;
    setProcessingRequestId(userId);
    try {
      await lobbiesApi.approveJoinRequest(lobby.id, userId);
      setRequests(prev => prev.filter(r => r.user_id !== userId));
      fetchMembers();
      if (onMembersUpdated) onMembersUpdated();
      toast.add({
        title: "İstek Onaylandı",
        description: "Kullanıcı lobiye katıldı.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "İstek Onaylanamadı",
        description: err.response?.data?.error?.message || "Bilinmeyen bir hata oluştu.",
        type: "error",
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    if (!lobby) return;
    setProcessingRequestId(userId);
    try {
      await lobbiesApi.rejectJoinRequest(lobby.id, userId);
      setRequests(prev => prev.filter(r => r.user_id !== userId));
      toast.add({
        title: "İstek Reddedildi",
        description: "Katılma isteği reddedildi.",
        type: "info",
      });
    } catch (err: any) {
      toast.add({
        title: "İşlem Başarısız",
        description: err.response?.data?.error?.message || "İstek reddedilemedi.",
        type: "error",
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleSendInvite = async (username?: string, userId?: string) => {
    if (!lobby) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      await lobbiesApi.inviteUser(lobby.id, { username, user_id: userId });
      setInviteMsg({ text: `${username || "Kullanıcıya"} davet başarıyla gönderildi!`, type: "success" });
      if (username === inviteInput) setInviteInput("");
    } catch (err: any) {
      setInviteMsg({ text: err.response?.data?.error?.message || "Davet gönderilemedi", type: "error" });
    } finally {
      setInviting(false);
    }
  };

  const fetchBots = async () => {
    setLoadingBots(true);
    try {
      const data = await aiApi.getAgents();
      setAvailableBots(data);
    } catch (err) {
      console.error("Failed to load bots", err);
    } finally {
      setLoadingBots(false);
    }
  };

  const fetchMembers = async () => {
    if (!lobby) return;
    setLoadingMembers(true);
    try {
      const data = await lobbiesApi.getMembers(lobby.id);
      setMembers(data);
    } catch (err) {
      console.error("Failed to load members", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchBans = async () => {
    if (!lobby) return;
    setLoadingBans(true);
    try {
      const data = await lobbiesApi.getBans(lobby.id);
      setBans(data);
    } catch (err) {
      console.error("Failed to load bans", err);
    } finally {
      setLoadingBans(false);
    }
  };

  const handleModeration = async (action: 'kick' | 'mute' | 'unmute' | 'ban' | 'unban', targetUserId: string, durationMinutes?: number | null) => {
    if (!lobby) return;
    try {
      await lobbiesApi.moderateUser(lobby.id, action, targetUserId, durationMinutes);
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.members(lobby.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.bans(lobby.id) });
      const actionLabels: Record<string, string> = {
        kick: "lobiden atıldı",
        ban: "lobiden yasaklandı",
        unban: "yasağı kaldırıldı",
        mute: "susturuldu",
        unmute: "susturması kaldırıldı",
      };
      toast.add({
        title: "Moderasyon Başarılı",
        description: `Kullanıcı başarıyla ${actionLabels[action] || action}.`,
        type: "success",
      });
      if (action === 'kick' || action === 'ban') {
        fetchMembers(); // refresh list
      }
      if (action === 'ban' || action === 'unban') {
        fetchBans(); // refresh bans
      }
    } catch (e: any) {
      console.error("Moderation error:", e.response?.data || e);
      toast.add({
        title: "İşlem Başarısız",
        description: e.response?.data?.error?.message || "Moderasyon işlemi gerçekleştirilemedi.",
        type: "error",
      });
    }
  };

  const handleUpdateLobby = async () => {
    if (!lobby) return;
    setUpdatingSettings(true);
    try {
      const updated = await lobbiesApi.updateLobby(lobby.id, name, description);
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.detail(lobby.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.all });
      onLobbyUpdated(updated);
      toast.add({
        title: "Lobi Güncellendi",
        description: "Lobi ayarları başarıyla kaydedildi.",
        type: "success",
      });
    } catch (e: any) {
      console.error("Failed to update lobby", e);
      toast.add({
        title: "Güncelleme Başarısız",
        description: "Lobi güncellenirken bir hata oluştu.",
        type: "error",
      });
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleSaveNotificationPreference = async (pref: "ALL" | "MENTIONS_ONLY" | "MUTE") => {
    if (!lobby) return;
    setUpdatingNotification(true);
    try {
      await lobbiesApi.updateNotificationPreference(lobby.id, pref);
      setNotificationPreference(pref);
      setMembers(prev => prev.map(m => m.user_id === currentUserId ? { ...m, notification_preference: pref } : m));
      if (onMembersUpdated) onMembersUpdated();
      toast.add({
        title: "Bildirim Ayarı Kaydedildi",
        description: "Lobi bildirim tercihiniz güncellendi.",
        type: "success",
      });
    } catch (e: any) {
      console.error("Failed to update notification preference", e);
      toast.add({
        title: "Hata",
        description: "Bildirim ayarı güncellenemedi.",
        type: "error",
      });
    } finally {
      setUpdatingNotification(false);
    }
  };

  const handleAddBot = async (botUserId: string) => {
    if (!lobby) return;
    setAddingBot(botUserId);
    try {
      await lobbiesApi.addBotToLobby(lobby.id, botUserId);
      toast.add({
        title: "Bot Eklendi",
        description: "AI botu lobiye başarıyla katıldı.",
        type: "success",
      });
      fetchMembers(); // refresh internal state
      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (e: any) {
      console.error("Failed to add bot", e);
      toast.add({
        title: "Bot Eklenemedi",
        description: e.response?.data?.error?.message || "Bot lobiye eklenirken hata oluştu.",
        type: "error",
      });
    } finally {
      setAddingBot(null);
    }
  };

  const canModerate = myRole === 'OWNER' || myRole === 'MODERATOR';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-yellow-50 w-[95vw] max-w-2xl h-[720px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Lobi Ayarları</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 min-w-0 w-full max-w-full overflow-hidden">
          <TabsList 
            className="flex flex-nowrap overflow-x-auto no-scrollbar scroll-smooth h-auto min-h-0 w-full max-w-full justify-start brutal-border bg-white mb-4 p-1.5 gap-1.5 items-center shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            <TabsTrigger value="members" className="h-auto shrink-0 flex-none whitespace-nowrap font-black text-xs uppercase px-3.5 py-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-[#FEF08A] data-[state=active]:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer transition-all rounded-sm">
              Üyeler ({lobby?.member_count || 0})
            </TabsTrigger>
            {canModerate && (
              <TabsTrigger value="bans" className="h-auto shrink-0 flex-none whitespace-nowrap font-black text-xs uppercase px-3.5 py-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-[#FEF08A] data-[state=active]:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer transition-all rounded-sm">
                Yasaklar {bans.length > 0 && `(${bans.length})`}
              </TabsTrigger>
            )}
            {canModerate && (
              <TabsTrigger value="bots" className="h-auto shrink-0 flex-none whitespace-nowrap font-black text-xs uppercase px-3.5 py-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-[#FEF08A] data-[state=active]:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer transition-all rounded-sm">
                Botlar
              </TabsTrigger>
            )}
            {canModerate && (
              <TabsTrigger value="requests" className="h-auto shrink-0 flex-none whitespace-nowrap font-black text-xs uppercase px-3.5 py-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-[#FEF08A] data-[state=active]:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer transition-all rounded-sm relative">
                İstekler {requests.length > 0 && (
                  <span className="bg-[#EF4444] text-white text-[10px] px-1.5 py-0.2 rounded-full ml-1 font-black animate-pulse">
                    {requests.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {canModerate && (
              <TabsTrigger value="invite" className="h-auto shrink-0 flex-none whitespace-nowrap font-black text-xs uppercase px-3.5 py-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-[#FEF08A] data-[state=active]:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer transition-all rounded-sm">
                Davet Et
              </TabsTrigger>
            )}
            {myRole === 'OWNER' && (
              <TabsTrigger value="settings" className="h-auto shrink-0 flex-none whitespace-nowrap font-black text-xs uppercase px-3.5 py-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-[#FEF08A] data-[state=active]:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer transition-all rounded-sm">
                Ayarlar
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="h-auto shrink-0 flex-none whitespace-nowrap font-black text-xs uppercase px-3.5 py-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-[#FEF08A] data-[state=active]:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer transition-all rounded-sm">
              Bildirimler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="flex-1 overflow-y-auto">
            {loadingMembers ? (
              <p className="text-center font-bold">Yükleniyor...</p>
            ) : (
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.user_id} className="flex items-center justify-between p-2 bg-white brutal-border">
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => onUserProfileClick(member.user_id)}
                    >
                      <Avatar className="w-10 h-10 border-2 border-black shrink-0">
                        <AvatarImage src={getAvatarUrl(member.avatar_url)} />
                        <AvatarFallback className="bg-pink-300 font-bold">
                          {member.display_name?.charAt(0).toUpperCase() || member.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{member.display_name || member.username}</p>
                        <p className="text-xs font-bold text-gray-500">@{member.username} - {member.role}</p>
                      </div>
                    </div>

                    {canModerate && member.role !== 'OWNER' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-black/10 text-black/50 hover:text-black transition-colors outline-none focus:ring-2 focus:ring-black">
                          <span className="sr-only">Menüyü aç</span>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-52">
                          <DropdownMenuItem onClick={() => handleModeration('mute', member.user_id, 15)} className="text-orange-600 focus:bg-orange-100 cursor-pointer font-bold">
                            <MicOff className="mr-2 h-4 w-4" /> 15 dk Sustur
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModeration('mute', member.user_id, 60)} className="text-orange-600 focus:bg-orange-100 cursor-pointer font-bold">
                            <MicOff className="mr-2 h-4 w-4" /> 1 sa Sustur
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModeration('mute', member.user_id, null)} className="text-red-600 font-bold focus:bg-red-100 cursor-pointer">
                            <MicOff className="mr-2 h-4 w-4" /> Süresiz Mute (Perma)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModeration('unmute', member.user_id)} className="text-green-600 focus:bg-green-100 cursor-pointer font-bold">
                            <Mic className="mr-2 h-4 w-4" /> Susturmayı Kaldır
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-black" />
                          <DropdownMenuItem onClick={() => handleModeration('kick', member.user_id)} className="text-red-600 focus:bg-red-100 cursor-pointer font-bold">
                            <UserMinus className="mr-2 h-4 w-4" /> Lobiden At
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModeration('ban', member.user_id)} className="text-red-800 focus:bg-red-200 cursor-pointer font-bold">
                            <Ban className="mr-2 h-4 w-4" /> Lobiden Yasakla
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {canModerate && (
            <TabsContent value="bans" className="flex-1 overflow-y-auto">
              {loadingBans ? (
                <p className="text-center font-bold">Yükleniyor...</p>
              ) : bans.length === 0 ? (
                <p className="text-center font-bold text-gray-600 mt-8">Yasaklanan kullanıcı bulunmuyor.</p>
              ) : (
                <div className="space-y-3">
                  {bans.map(ban => (
                    <div key={ban.user_id} className="flex items-center justify-between p-2 bg-red-50 brutal-border border-red-500">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onUserProfileClick(ban.user_id)}>
                        <Avatar className="w-10 h-10 border-2 border-black shrink-0">
                          <AvatarImage src={getAvatarUrl(ban.avatar_url)} />
                          <AvatarFallback className="bg-red-300 font-bold">
                            {ban.display_name?.charAt(0).toUpperCase() || ban.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{ban.display_name || ban.username}</p>
                          <p className="text-xs font-bold text-red-600">
                            Yasaklandı: {new Date(ban.banned_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleModeration('unban', ban.user_id)}
                        className="bg-green-500 hover:bg-green-600 text-black border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Yasağı Kaldır
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {canModerate && (
            <TabsContent value="bots" className="flex-1 overflow-y-auto pr-1">
              <div className="mb-4 bg-white p-3 brutal-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-black">Lobideki AI Ajanları & Botlar</p>
                  <p className="text-xs text-gray-600 font-bold">Oluşturduğunuz yapay zeka ajanlarını bu lobiye davet edebilir veya moderasyon yapabilirsiniz.</p>
                </div>
              </div>
              {loadingBots ? (
                <p className="text-center font-bold py-8">Yükleniyor...</p>
              ) : availableBots.length === 0 ? (
                <div className="text-center py-12 bg-white brutal-border">
                  <p className="font-bold text-gray-600">Henüz bir AI ajanı oluşturmadınız.</p>
                  <p className="text-xs text-gray-500 mt-1">Ajan Oluşturucu sekmesinden yeni bir bot oluşturup lobiye ekleyebilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableBots.map(bot => {
                    const isMember = members.some(m => m.user_id === bot.user_id);
                    const isBanned = bans.some(b => b.user_id === bot.user_id);
                    const rawBehavior = (bot.behavior_config as any) || {};
                    const allowedUsers: string[] = rawBehavior?.permissions?.allowed_users || rawBehavior?.allowed_users || [];
                    const mode: string = rawBehavior?.interaction_mode || rawBehavior?.permissions?.interaction_mode || (allowedUsers.length > 0 ? "WHITELIST" : (bot as any).allow_user_interaction !== false ? "EVERYONE" : "OWNER_ONLY");
                    const isBotOwner = bot.owner_id === currentUserId;
                    const canManageBot = isBotOwner || myRole === 'OWNER';
                    
                    return (
                      <div 
                        key={bot.id} 
                        className={`p-3 brutal-border transition-all ${
                          isBanned 
                            ? 'bg-red-50 border-red-500' 
                            : isMember 
                            ? 'bg-green-50/70 border-green-600' 
                            : 'bg-white border-black'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-11 h-11 border-2 border-black shrink-0">
                              <AvatarImage src={getAvatarUrl(bot.avatar_url)} />
                              <AvatarFallback className="bg-purple-300 font-bold">
                                {bot.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-black text-sm">{bot.name}</p>
                                <span className="text-xs font-bold text-gray-500">@{bot.username || bot.name.toLowerCase().replace(/\s+/g, '_')}</span>
                                {isBanned && (
                                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded border border-black uppercase tracking-wider">
                                    Yasaklandı (BANNED)
                                  </span>
                                )}
                                {isMember && !isBanned && (
                                  <span className="bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded border border-black uppercase tracking-wider">
                                    Lobide Aktif
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-gray-600 mt-0.5">
                                Sağlayıcı: <span className="text-black uppercase">{bot.provider}</span> • Model: <span className="text-black font-semibold">{bot.model}</span>
                              </p>
                              {mode === "OWNER_ONLY" ? (
                                <p className="text-xs font-bold text-amber-800 mt-1 flex items-center gap-1">
                                  🔒 Sadece Bot Sahibi Kullanabilir
                                </p>
                              ) : mode === "MODERATORS" ? (
                                <p className="text-xs font-bold text-blue-800 mt-1 flex items-center gap-1">
                                  🛡️ Lobi Yöneticileri & Bot Sahibi
                                </p>
                              ) : mode === "WHITELIST" && allowedUsers.length > 0 ? (
                                <p className="text-xs font-bold text-indigo-700 mt-1 flex items-center gap-1">
                                  📋 Yetkili Kullanıcılar ({allowedUsers.length}): @{allowedUsers.join(", @")}
                                </p>
                              ) : (
                                <p className="text-[11px] font-medium text-gray-500 mt-1 flex items-center gap-1">
                                  🌐 Herkes bu botla sohbet edebilir
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            {canManageBot && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenBotPermissions(bot)}
                                className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-xs flex items-center gap-1"
                              >
                                <Shield className="w-3.5 h-3.5" />
                                Yetkileri Ayarla
                              </Button>
                            )}

                            {isBanned ? (
                              <div className="flex flex-col items-end gap-1">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleModeration('unban', bot.user_id)}
                                  className="bg-green-500 hover:bg-green-600 text-black border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-xs"
                                >
                                  <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Yasağı Kaldır
                                </Button>
                                <span className="text-[10px] text-red-600 font-bold">Lobiye eklemek için önce yasağı kaldırın</span>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => handleAddBot(bot.user_id)}
                                disabled={isMember || addingBot === bot.user_id}
                                className={`border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                                  isMember ? 'bg-gray-200 text-gray-600' : 'bg-blue-400 hover:bg-blue-500 text-black hover:-translate-y-[1px]'
                                }`}
                              >
                                {addingBot === bot.user_id ? "Ekleniyor..." : (isMember ? "Lobide Mevcut" : "Lobiye Ekle")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bot Interaction Permissions Modal */}
              {editingBotForPermissions && (
                <Dialog open={!!editingBotForPermissions} onOpenChange={(open) => !open && setEditingBotForPermissions(null)}>
                  <DialogContent className="sm:max-w-md bg-white brutal-border border-4 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        {editingBotForPermissions.name} - Etkileşim Yetkileri
                      </DialogTitle>
                      <DialogDescription className="text-xs font-bold text-gray-600">
                        Bu bot lobideyken chat içinde kimlerin @mention atarak yanıt alabileceğini belirleyin.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2.5 py-3">
                      {[
                        {
                          id: "EVERYONE",
                          title: "Herkes",
                          desc: "Lobideki tüm kullanıcılar bu botu etiketleyip yanıt alabilir.",
                        },
                        {
                          id: "OWNER_ONLY",
                          title: "Sadece Ben (Bot Sahibi)",
                          desc: "Yalnızca siz botu etiketlediğinizde yanıt verir; diğer kullanıcılar yanıt alamaz.",
                        },
                        {
                          id: "MODERATORS",
                          title: "Lobi Yöneticileri ve Sahibi",
                          desc: "Lobi kurucusu, moderatörler ve siz bota mention atabilirsiniz.",
                        },
                        {
                          id: "WHITELIST",
                          title: "Belirli Kullanıcılar (Beyaz Liste)",
                          desc: "Sadece aşağıda belirteceğiniz kullanıcılar bota mention atabilir.",
                        },
                      ].map((opt) => (
                        <label
                          key={opt.id}
                          onClick={() => setSelectedInteractionMode(opt.id as any)}
                          className={`flex items-start gap-3 p-3 border-2 border-black cursor-pointer transition-all ${
                            selectedInteractionMode === opt.id
                              ? "bg-[#FEF08A] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="interaction_mode"
                            checked={selectedInteractionMode === opt.id}
                            onChange={() => setSelectedInteractionMode(opt.id as any)}
                            className="mt-1 accent-black"
                          />
                          <div>
                            <p className="font-black text-xs uppercase">{opt.title}</p>
                            <p className="text-[11px] font-medium text-gray-600">{opt.desc}</p>
                          </div>
                        </label>
                      ))}

                      {selectedInteractionMode === "WHITELIST" && (
                        <div className="mt-2 p-3 bg-gray-50 border-2 border-black space-y-1">
                          <label className="text-xs font-black uppercase block">
                            Yetkili Kullanıcı Adları (Virgülle ayırın)
                          </label>
                          <input
                            type="text"
                            value={whitelistUsersInput}
                            onChange={(e) => setWhitelistUsersInput(e.target.value)}
                            placeholder="örn: ahmet, mehmet, zeynep"
                            className="w-full text-xs font-bold p-2 border-2 border-black bg-white focus:outline-none"
                          />
                          <p className="text-[10px] text-gray-500 font-bold">
                            Kullanıcı adlarını başında @ olmadan veya @ ile yazabilirsiniz.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingBotForPermissions(null)}
                        className="border-2 border-black font-bold text-xs"
                      >
                        İptal
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveBotPermissions}
                        disabled={isSavingBotPermissions}
                        className="bg-green-500 hover:bg-green-600 text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      >
                        {isSavingBotPermissions ? "Kaydediliyor..." : "Yetkileri Kaydet"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </TabsContent>
          )}

          {myRole === 'OWNER' && (
            <TabsContent value="settings" className="flex-1 overflow-y-auto">
              <div className="space-y-4 bg-white p-4 brutal-border">
                <div>
                  <label className="block font-black mb-1">Lobi Adı</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                    className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block font-black mb-1">Açıklama</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    autoComplete="off"
                    className="w-full border-2 border-black p-2 font-bold min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <Button 
                  onClick={handleUpdateLobby} 
                  disabled={updatingSettings}
                  className="w-full brutal-btn bg-green-400 hover:bg-green-500 text-black cursor-pointer hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase"
                >
                  {updatingSettings ? "Kaydediliyor..." : "Ayarları Kaydet"}
                </Button>
              </div>
            </TabsContent>
          )}

          <TabsContent value="notifications" className="flex-1 overflow-y-auto">
            <div className="space-y-4 bg-white p-5 brutal-border">
              <div>
                <h4 className="font-black text-base uppercase mb-1">Sohbet Bildirim Ayarları</h4>
                <p className="text-xs text-gray-600 font-medium">Bu lobideki mesajlar için nasıl bildirim almak istediğinizi seçin.</p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Option 1: ALL */}
                <label 
                  onClick={() => handleSaveNotificationPreference("ALL")}
                  className={`flex items-start gap-3 p-3.5 brutal-border cursor-pointer transition-all ${
                    notificationPreference === "ALL" ? "bg-[#FEF08A] shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-0.5" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="notif_pref" 
                    checked={notificationPreference === "ALL"} 
                    onChange={() => {}} 
                    className="mt-1 accent-black"
                  />
                  <div>
                    <div className="font-black text-sm uppercase">Hepsine İzin Ver</div>
                    <div className="text-xs text-gray-600 font-bold">Bu lobide paylaşılan tüm yeni mesajlarda anlık bildirim alırsınız.</div>
                  </div>
                </label>

                {/* Option 2: MENTIONS_ONLY */}
                <label 
                  onClick={() => handleSaveNotificationPreference("MENTIONS_ONLY")}
                  className={`flex items-start gap-3 p-3.5 brutal-border cursor-pointer transition-all ${
                    notificationPreference === "MENTIONS_ONLY" ? "bg-[#A78BFA] text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-0.5" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="notif_pref" 
                    checked={notificationPreference === "MENTIONS_ONLY"} 
                    onChange={() => {}} 
                    className="mt-1 accent-black"
                  />
                  <div>
                    <div className={`font-black text-sm uppercase ${notificationPreference === "MENTIONS_ONLY" ? "text-white" : "text-black"}`}>
                      Sadece @ ile Kendisini Mentionlayanlara İzin Ver
                    </div>
                    <div className={`text-xs font-bold ${notificationPreference === "MENTIONS_ONLY" ? "text-white/90" : "text-gray-600"}`}>
                      Yalnızca birisi mesajında sizi @{members.find(m => m.user_id === currentUserId)?.username || "kullanici"} şeklinde etiketlediğinde bildirim alırsınız.
                    </div>
                  </div>
                </label>

                {/* Option 3: MUTE */}
                <label 
                  onClick={() => handleSaveNotificationPreference("MUTE")}
                  className={`flex items-start gap-3 p-3.5 brutal-border cursor-pointer transition-all ${
                    notificationPreference === "MUTE" ? "bg-[#F472B6] text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-0.5" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="notif_pref" 
                    checked={notificationPreference === "MUTE"} 
                    onChange={() => {}} 
                    className="mt-1 accent-black"
                  />
                  <div>
                    <div className="font-black text-sm uppercase">Hepsini Kapat</div>
                    <div className="text-xs text-gray-700 font-bold">Bu lobiden hiçbir mesaj veya etiketleme bildirimi almazsınız.</div>
                  </div>
                </label>
              </div>

              {updatingNotification && (
                <p className="text-xs font-bold text-center animate-pulse mt-2">Kaydediliyor...</p>
              )}
            </div>
          </TabsContent>

          {canModerate && (
            <TabsContent value="requests" className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm uppercase">Katılma İstekleri ({requests.length})</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchRequests}
                    disabled={loadingRequests}
                    className="h-7 text-xs font-black border-2 border-black cursor-pointer"
                  >
                    Yenile
                  </Button>
                </div>

                {loadingRequests ? (
                  <div className="p-8 text-center font-bold text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-black" />
                    İstekler yükleniyor...
                  </div>
                ) : requests.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-bold text-sm bg-white brutal-border border-2">
                    Bu lobi için bekleyen katılma isteği bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {requests.map((req) => (
                      <div
                        key={req.user_id}
                        className="p-3 bg-white brutal-border border-2 flex items-center justify-between gap-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                      >
                        <div
                          className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                          onClick={() => onUserProfileClick(req.user_id)}
                        >
                          <Avatar className="w-9 h-9 border-2 border-black shrink-0">
                            <AvatarFallback className="bg-[#A78BFA] text-white font-bold">
                              {req.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-black text-sm truncate text-black">
                              {req.display_name || req.username}
                            </p>
                            <p className="text-xs font-bold text-gray-500 truncate">
                              @{req.username} • {new Date(req.created_at).toLocaleDateString("tr-TR")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(req.user_id)}
                            disabled={processingRequestId === req.user_id}
                            className="bg-[#4ADE80] hover:bg-[#22c55e] text-black border-2 border-black font-black text-xs h-8 px-2.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Onayla
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRejectRequest(req.user_id)}
                            disabled={processingRequestId === req.user_id}
                            className="bg-[#FFE4E6] hover:bg-red-200 text-red-700 border-2 border-black font-black text-xs h-8 px-2.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reddet
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {canModerate && (
            <TabsContent value="invite" className="flex-1 overflow-y-auto space-y-4">
              {/* By Username */}
              <div className="p-4 bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <h3 className="font-black text-sm uppercase mb-1">Kullanıcı Adı ile Davet Et</h3>
                <p className="text-xs font-bold text-gray-500 mb-3">
                  Herhangi bir kullanıcıyı doğrudan bu lobiye davet edin. Katılmaları için ön onay sağlanacaktır.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inviteInput.trim()) handleSendInvite(inviteInput.trim());
                  }}
                  autoComplete="off"
                  className="flex gap-2"
                >
                  <input
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    placeholder="Kullanıcı adı girin..."
                    disabled={inviting}
                    autoComplete="off"
                    className="flex-1 px-3 py-1.5 bg-gray-50 border-2 border-black font-bold text-sm outline-none focus:bg-white shadow-inner"
                  />
                  <Button
                    type="submit"
                    disabled={!inviteInput.trim() || inviting}
                    className="bg-[#FEF08A] hover:bg-[#fde047] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <> <Send className="w-3.5 h-3.5 mr-1" /> Davet Et </>}
                  </Button>
                </form>

                {inviteMsg && (
                  <p
                    className={`text-xs font-black mt-2 ${
                      inviteMsg.type === "success" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {inviteMsg.text}
                  </p>
                )}
              </div>

              {/* Quick Invite from Friends */}
              <div className="p-4 bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <h3 className="font-black text-sm uppercase mb-1">Arkadaşları Hızlı Davet Et</h3>
                <p className="text-xs font-bold text-gray-500 mb-3">
                  Ekli arkadaşlarınızı doğrudan bu lobiye davet edin.
                </p>

                {loadingFriends ? (
                  <div className="p-4 text-center font-bold text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-black" />
                    Arkadaşlar yükleniyor...
                  </div>
                ) : friends.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400 text-center py-2">
                    Davet edilebilecek arkadaş bulunamadı.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {friends.map((friend) => {
                      const isAlreadyMember = members.some((m) => m.user_id === friend.id);
                      return (
                        <div
                          key={friend.id}
                          className="p-2 border-2 border-black bg-gray-50 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="w-7 h-7 border border-black shrink-0">
                              <AvatarImage src={getAvatarUrl(friend.avatar_url)} />
                              <AvatarFallback className="bg-purple-300 font-bold text-[10px]">
                                {friend.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-xs truncate">@{friend.username}</span>
                          </div>

                          {isAlreadyMember ? (
                            <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-200 px-2 py-0.5 border border-gray-400 rounded-sm">
                              Lobide
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSendInvite(friend.username, friend.id)}
                              disabled={inviting}
                              className="h-7 px-2.5 bg-[#4ADE80] hover:bg-[#22c55e] text-black border border-black font-black text-[11px] shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              Davet Et
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
