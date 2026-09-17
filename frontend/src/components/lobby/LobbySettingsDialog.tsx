import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, MicOff, Mic, UserMinus, Ban, UserCheck, UserPlus, Check, X, Loader2, Send, Mail } from "lucide-react";
import { lobbiesApi } from "@/lib/api/lobbies";
import { aiApi } from "@/lib/api/ai";
import { friendsApi } from "@/lib/api/friends";
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
    } catch (err: any) {
      alert(`Failed to approve request: ${err.response?.data?.error?.message || "Unknown error"}`);
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
    } catch (err: any) {
      alert(`Failed to reject request: ${err.response?.data?.error?.message || "Unknown error"}`);
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
      setInviteMsg({ text: `Invitation sent to ${username || "user"} successfully!`, type: "success" });
      if (username === inviteInput) setInviteInput("");
    } catch (err: any) {
      setInviteMsg({ text: err.response?.data?.error?.message || "Failed to send invitation", type: "error" });
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

  const handleModeration = async (action: 'kick' | 'mute' | 'unmute' | 'ban' | 'unban', targetUserId: string, durationMinutes?: number) => {
    if (!lobby) return;
    try {
      await lobbiesApi.moderateUser(lobby.id, action, targetUserId, durationMinutes);
      alert(`User has been ${action}ed successfully.`);
      if (action === 'kick' || action === 'ban') {
        fetchMembers(); // refresh list
      }
      if (action === 'ban' || action === 'unban') {
        fetchBans(); // refresh bans
      }
    } catch (e: any) {
      console.error("Moderation error:", e.response?.data || e);
      alert(`Failed to ${action} user: ${e.response?.data?.error?.message || "Unknown error"}`);
    }
  };

  const handleUpdateLobby = async () => {
    if (!lobby) return;
    setUpdatingSettings(true);
    try {
      const updated = await lobbiesApi.updateLobby(lobby.id, name, description);
      onLobbyUpdated(updated);
      alert("Lobby updated successfully.");
    } catch (e: any) {
      console.error("Failed to update lobby", e);
      alert("Failed to update lobby.");
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
    } catch (e: any) {
      console.error("Failed to update notification preference", e);
      alert("Bildirim ayarı güncellenemedi.");
    } finally {
      setUpdatingNotification(false);
    }
  };

  const handleAddBot = async (botUserId: string) => {
    if (!lobby) return;
    setAddingBot(botUserId);
    try {
      await lobbiesApi.addBotToLobby(lobby.id, botUserId);
      alert("Bot successfully added to the lobby.");
      fetchMembers(); // refresh internal state
      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (e: any) {
      console.error("Failed to add bot", e);
      alert(`Failed to add bot: ${e.response?.data?.error?.message || "Unknown error"}`);
    } finally {
      setAddingBot(null);
    }
  };

  const canModerate = myRole === 'OWNER' || myRole === 'MODERATOR';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-yellow-50 max-w-lg min-h-[60vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Lobby Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="flex flex-wrap w-full brutal-border bg-white mb-4">
            <TabsTrigger value="members" className="font-bold border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-yellow-300">
              Members ({lobby?.member_count || 0})
            </TabsTrigger>
            {canModerate && (
              <TabsTrigger value="bans" className="font-bold border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-yellow-300">
                Bans
              </TabsTrigger>
            )}
            {canModerate && (
              <TabsTrigger value="bots" className="font-bold border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-yellow-300">
                Bots
              </TabsTrigger>
            )}
            {canModerate && (
              <TabsTrigger value="requests" className="font-bold border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-yellow-300 relative">
                Requests {requests.length > 0 && (
                  <span className="bg-[#EF4444] text-white text-[10px] px-1.5 py-0.2 rounded-full ml-1 font-black animate-pulse">
                    {requests.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {canModerate && (
              <TabsTrigger value="invite" className="font-bold border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-yellow-300">
                Invite
              </TabsTrigger>
            )}
            {myRole === 'OWNER' && (
              <TabsTrigger value="settings" className="font-bold border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-yellow-300">
                Settings
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="font-bold border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-yellow-300">
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="flex-1 overflow-y-auto">
            {loadingMembers ? (
              <p className="text-center font-bold">Loading...</p>
            ) : (
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.user_id} className="flex items-center justify-between p-2 bg-white brutal-border">
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => onUserProfileClick(member.user_id)}
                    >
                      <Avatar className="w-10 h-10 border-2 border-black">
                        <AvatarImage src={member.avatar_url || ""} />
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
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-48">
                          <DropdownMenuItem onClick={() => handleModeration('mute', member.user_id, 15)} className="text-orange-600 focus:bg-orange-100 cursor-pointer">
                            <MicOff className="mr-2 h-4 w-4" /> Mute 15m
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModeration('mute', member.user_id, 60)} className="text-orange-600 focus:bg-orange-100 cursor-pointer">
                            <MicOff className="mr-2 h-4 w-4" /> Mute 1h
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModeration('unmute', member.user_id)} className="text-green-600 focus:bg-green-100 cursor-pointer">
                            <Mic className="mr-2 h-4 w-4" /> Unmute
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-black" />
                          <DropdownMenuItem onClick={() => handleModeration('kick', member.user_id)} className="text-red-600 focus:bg-red-100 cursor-pointer">
                            <UserMinus className="mr-2 h-4 w-4" /> Kick
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModeration('ban', member.user_id)} className="text-red-800 focus:bg-red-200 cursor-pointer">
                            <Ban className="mr-2 h-4 w-4" /> Ban
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
                <p className="text-center font-bold">Loading...</p>
              ) : bans.length === 0 ? (
                <p className="text-center font-bold text-gray-600 mt-8">No banned users.</p>
              ) : (
                <div className="space-y-3">
                  {bans.map(ban => (
                    <div key={ban.user_id} className="flex items-center justify-between p-2 bg-red-50 brutal-border border-red-500">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onUserProfileClick(ban.user_id)}>
                        <Avatar className="w-10 h-10 border-2 border-black">
                          <AvatarImage src={ban.avatar_url || ""} />
                          <AvatarFallback className="bg-red-300 font-bold">
                            {ban.display_name?.charAt(0).toUpperCase() || ban.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{ban.display_name || ban.username}</p>
                          <p className="text-xs font-bold text-red-600">
                            Banned on {new Date(ban.banned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleModeration('unban', ban.user_id)}
                        className="bg-green-500 hover:bg-green-600 text-black border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Unban
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {canModerate && (
            <TabsContent value="bots" className="flex-1 overflow-y-auto">
              <div className="mb-4">
                <p className="text-sm font-bold text-gray-700">Available AI Agents</p>
                <p className="text-xs text-gray-500">You can invite any AI agent you created into this lobby.</p>
              </div>
              {loadingBots ? (
                <p className="text-center font-bold">Loading bots...</p>
              ) : availableBots.length === 0 ? (
                <p className="text-center font-bold text-gray-600">You haven't created any AI agents yet.</p>
              ) : (
                <div className="space-y-3">
                  {availableBots.map(bot => {
                    // Check if bot is already a member
                    const isMember = members.some(m => m.user_id === bot.user_id);
                    return (
                      <div key={bot.id} className="flex items-center justify-between p-2 bg-blue-50 brutal-border border-blue-500">
                        <div>
                          <p className="font-bold">{bot.name}</p>
                          <p className="text-xs text-gray-500">@{bot.username || bot.name.toLowerCase().replace(/\s+/g, '_')}</p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleAddBot(bot.user_id)}
                          disabled={isMember || addingBot === bot.user_id}
                          className="bg-blue-400 hover:bg-blue-500 text-black border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingBot === bot.user_id ? "Adding..." : (isMember ? "Added" : "Add")}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          )}

          {myRole === 'OWNER' && (
            <TabsContent value="settings" className="flex-1">
              <div className="space-y-4 bg-white p-4 brutal-border">
                <div>
                  <label className="block font-black mb-1">Lobby Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block font-black mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border-2 border-black p-2 font-bold min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <Button 
                  onClick={handleUpdateLobby} 
                  disabled={updatingSettings}
                  className="w-full brutal-btn bg-green-400 hover:bg-green-500 text-black cursor-pointer hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  {updatingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </TabsContent>
          )}

          <TabsContent value="notifications" className="flex-1">
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
                  <h3 className="font-black text-sm uppercase">Join Requests ({requests.length})</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchRequests}
                    disabled={loadingRequests}
                    className="h-7 text-xs font-black border-2 border-black"
                  >
                    Refresh
                  </Button>
                </div>

                {loadingRequests ? (
                  <div className="p-8 text-center font-bold text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-black" />
                    Loading requests...
                  </div>
                ) : requests.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-bold text-sm bg-white brutal-border border-2">
                    No pending join requests for this lobby.
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
                              @{req.username} • {new Date(req.created_at).toLocaleDateString()}
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
                            <Check className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRejectRequest(req.user_id)}
                            disabled={processingRequestId === req.user_id}
                            className="bg-[#FFE4E6] hover:bg-red-200 text-red-700 border-2 border-black font-black text-xs h-8 px-2.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reject
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
                <h3 className="font-black text-sm uppercase mb-1">Invite by Username</h3>
                <p className="text-xs font-bold text-gray-500 mb-3">
                  Invite any user directly to this lobby. They will be pre-approved to enter.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inviteInput.trim()) handleSendInvite(inviteInput.trim());
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    placeholder="Enter username..."
                    disabled={inviting}
                    className="flex-1 px-3 py-1.5 bg-gray-50 border-2 border-black font-bold text-sm outline-none focus:bg-white shadow-inner"
                  />
                  <Button
                    type="submit"
                    disabled={!inviteInput.trim() || inviting}
                    className="bg-[#FEF08A] hover:bg-[#fde047] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <> <Send className="w-3.5 h-3.5 mr-1" /> Invite </>}
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
                <h3 className="font-black text-sm uppercase mb-1">Quick Invite Friends</h3>
                <p className="text-xs font-bold text-gray-500 mb-3">
                  Easily invite your accepted friends to this lobby.
                </p>

                {loadingFriends ? (
                  <div className="p-4 text-center font-bold text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-black" />
                    Loading friends...
                  </div>
                ) : friends.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400 text-center py-2">
                    No friends available to invite.
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
                              <AvatarImage src={friend.avatar_url || ""} />
                              <AvatarFallback className="bg-purple-300 font-bold text-[10px]">
                                {friend.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-xs truncate">@{friend.username}</span>
                          </div>

                          {isAlreadyMember ? (
                            <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-200 px-2 py-0.5 border border-gray-400 rounded-sm">
                              In Lobby
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSendInvite(friend.username, friend.id)}
                              disabled={inviting}
                              className="h-7 px-2.5 bg-[#4ADE80] hover:bg-[#22c55e] text-black border border-black font-black text-[11px] shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              Invite
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
