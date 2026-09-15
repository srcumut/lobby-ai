import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, MicOff, Mic, UserMinus, Ban, UserCheck } from "lucide-react";
import { lobbiesApi } from "@/lib/api/lobbies";
import { aiApi, Agent } from "@/lib/api/ai";
import { LobbyMember, BannedUser, Lobby } from "@/types";

interface LobbySettingsDialogProps {
  lobby: Lobby | null;
  isOpen: boolean;
  onClose: () => void;
  myRole: string | null;
  onUserProfileClick: (userId: string) => void;
  onLobbyUpdated: (updatedLobby: Lobby) => void;
  onMembersUpdated?: () => void;
}

export function LobbySettingsDialog({ lobby, isOpen, onClose, myRole, onUserProfileClick, onLobbyUpdated, onMembersUpdated }: LobbySettingsDialogProps) {
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

  useEffect(() => {
    if (isOpen && lobby) {
      setName(lobby.name);
      setDescription(lobby.description || "");
      fetchMembers();
      if (myRole === 'OWNER' || myRole === 'MODERATOR') {
        fetchBans();
        fetchBots();
      }
    }
  }, [isOpen, lobby, myRole]);

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
            {myRole === 'OWNER' && (
              <TabsTrigger value="settings" className="font-bold border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-yellow-300">
                Settings
              </TabsTrigger>
            )}</TabsList>

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
                          <p className="text-xs text-gray-500">@{bot.username}</p>
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

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
