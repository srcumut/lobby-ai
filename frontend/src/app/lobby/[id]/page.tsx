// ============================================================================
// TARGET_DESTINATION: frontend/src/app/lobby/[id]/page.tsx
// PURPOSE: Real-time Lobby Chat page with avatar thumbnails for users and AI bots
// ============================================================================

"use client";

import { useEffect, useState, useRef, use } from "react";
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
import { MoreVertical, Ban, UserMinus, MicOff, Mic, Settings, Bot } from "lucide-react";
import { LobbySettingsDialog } from "@/components/lobby/LobbySettingsDialog";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { MembersList } from "@/components/lobby/MembersList";
import { getAvatarUrl } from "@/lib/avatar";

export default function LobbyChatPage({ params }: { params: Promise<{ id: string }> }) {
  // Use React.use to unwrap params in Next.js 15+
  const resolvedParams = use(params);
  const lobbyId = resolvedParams.id;
  
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  // WebSocket hook
  const { isConnected, error: wsError, lastMessage, sendMessage } = useWebSocket(lobbyId);

  // Fetch initial data
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    
    const loadData = async () => {
      try {
        const [lobbyData, messagesData, membersData] = await Promise.all([
          lobbiesApi.getLobbyById(lobbyId),
          lobbiesApi.getMessages(lobbyId),
          lobbiesApi.getMembers(lobbyId)
        ]);
        setLobby(lobbyData);
        setLobbyMembers(membersData);
        // Backend might return messages descending (newest first). Let's reverse to show oldest first at top
        setMessages(messagesData.reverse());
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Failed to load lobby");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [lobbyId, isAuthenticated]);

  // Handle incoming WS events
  const refreshMembers = async () => {
    try {
      const membersData = await lobbiesApi.getMembers(lobbyId);
      setLobbyMembers(membersData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "message.created") {
      const newMsg = lastMessage.payload as MessageResponse;
      // Add to messages if not already present (checking ID just in case)
      setMessages((prev) => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } else if (lastMessage.type === "user.joined") {
      const payload = lastMessage.payload;
      const username = payload.user?.username || "A user";
      if (payload.user?.id !== user?.id) {
        setMessages(prev => [...prev, {
          id: `sys-${Date.now()}-${Math.random()}`,
          lobby_id: lobbyId,
          sender: { id: "system", username: "System", display_name: null, avatar_url: null },
          content: `${username} joined the room.`,
          is_bot: true,
          created_at: new Date().toISOString(),
        }]);
      }
    } else if (lastMessage.type === "user.left") {
      const payload = lastMessage.payload;
      const username = payload.user?.username || "A user";
      if (payload.user?.id !== user?.id) {
        setMessages(prev => [...prev, {
          id: `sys-${Date.now()}-${Math.random()}`,
          lobby_id: lobbyId,
          sender: { id: "system", username: "System", display_name: null, avatar_url: null },
          content: `${username} left the room.`,
          is_bot: true,
          created_at: new Date().toISOString(),
        }]);
      }
    } else if (lastMessage.type === "moderation.event") {
      const { action, target_user_id, duration_minutes } = lastMessage.payload;
      
      if (target_user_id === user?.id) {
        if (action === 'kick' || action === 'ban') {
          alert(action === 'kick' ? "You have been kicked from the lobby!" : "You have been banned from the lobby!");
          router.push("/lobbies");
          return;
        } else if (action === 'mute') {
          const durationStr = duration_minutes ? `${duration_minutes} minutes` : "indefinitely";
          setMessages(prev => [...prev, {
            id: `sys-${Date.now()}`,
            lobby_id: lobbyId,
            sender: { id: "system", username: "System", display_name: null, avatar_url: null },
            content: `You have been muted by moderators for ${durationStr}.`,
            is_bot: true,
            created_at: new Date().toISOString(),
          }]);
        } else if (action === 'unmute') {
          setMessages(prev => [...prev, {
            id: `sys-${Date.now()}`,
            lobby_id: lobbyId,
            sender: { id: "system", username: "System", display_name: null, avatar_url: null },
            content: `You have been unmuted, you can speak now.`,
            is_bot: true,
            created_at: new Date().toISOString(),
          }]);
        }
      } else {
        // Someone else was moderated
        setMessages(prev => {
          const prevMsg = prev.find(m => m.sender.id === target_user_id);
          const username = prevMsg ? prevMsg.sender.username : "A user";
          
          let sysContent = "";
          if (action === 'kick') sysContent = `${username} was kicked.`;
          if (action === 'ban') sysContent = `${username} was banned.`;
          if (action === 'mute') sysContent = `${username} was muted.`;
          if (action === 'unmute') sysContent = `${username} was unmuted.`;
          
          if (!sysContent) return prev;
          
          return [...prev, {
            id: `sys-${Date.now()}`,
            lobby_id: lobbyId,
            sender: { id: "system", username: "System", display_name: null, avatar_url: null },
            content: sysContent,
            is_bot: true,
            created_at: new Date().toISOString(),
          }];
        });
      }
    }
  }, [lastMessage, user?.id, lobbyId, router]);

  // Auto-scroll messages container to bottom without scrolling ancestors
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isConnected) return;
    
    sendMessage(inputMessage);
    setInputMessage("");
    setMentionQuery(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputMessage(val);

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

  const handleModeration = async (action: 'kick' | 'mute' | 'unmute' | 'ban', targetUserId: string, durationMinutes?: number) => {
    try {
      await lobbiesApi.moderateUser(lobbyId, action, targetUserId, durationMinutes);
      alert(`User has been ${action}ed successfully.`);
    } catch (e: any) {
      console.error("Moderation error:", e.response?.data || e);
      alert(`Failed to ${action} user: ${e.response?.data?.error?.message || "Unknown error"}`);
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl font-bold animate-pulse">Loading lobby...</div>
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="bg-destructive/20 text-destructive brutal-border p-6 rounded-sm max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="font-medium">{error || "Lobby not found"}</p>
        </div>
        <Button onClick={() => router.push("/lobbies")}>Back to Lobbies</Button>
      </div>
    );
  }

  return (
    <ProtectedRoute>
    <div className="flex h-full min-h-0 w-full bg-[#f8fafc] border-4 border-black brutal-shadow rounded-sm overflow-hidden">
      
      {/* Center Column: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#f4f4f5] h-full">
      {/* Header */}
      <div className="bg-[#FFE4E6] border-b-4 border-black p-4 flex justify-between items-center z-10 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{lobby.name}</h1>
            <Badge variant={lobby.visibility === "PRIVATE" ? "destructive" : "default"} className="bg-black text-white border-black">
              {lobby.visibility}
            </Badge>
            {isConnected ? (
              <Badge className="bg-[#4ade80] text-black">Live</Badge>
            ) : (
              <Badge variant="destructive">Reconnecting...</Badge>
            )}
          </div>
          <p className="text-sm font-medium opacity-80">{lobby.description || "No description"}</p>
        </div>
        <div>
          <Button variant="outline" className="bg-white text-black border-2 border-black mr-2 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-4 h-4 mr-2" /> Settings
          </Button>
          <Button variant="outline" className="bg-white text-black border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all" onClick={() => router.push("/lobbies")}>
            Leave
          </Button>
        </div>
      </div>
      
      {wsError && (
        <div className="bg-destructive text-destructive-foreground p-2 text-sm font-bold text-center border-b-[3px] border-black">
          {wsError}
        </div>
      )}

      {/* Chat Area */}
      <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 bg-[#f4f4f5] flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-foreground/50 font-medium">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === user?.id;
            
            // Calmer Neo-Brutalist bubbles
            const bubbleBg = msg.is_bot ? "bg-[#cffafe]" : isMe ? "bg-[#f3e8ff]" : "bg-white";
            const alignmentClass = isMe ? "self-end" : "self-start";
            
            return (
              <div key={msg.id} className={`flex flex-col max-w-[85%] md:max-w-[70%] ${alignmentClass} animate-fade-in-up group`}>
                <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'justify-end' : ''}`}>
                  {!isMe && (
                    <>
                      <span 
                        className="font-bold text-sm cursor-pointer hover:underline text-black" 
                        onClick={() => handleOpenProfile(msg.sender.id)}
                      >
                        {msg.sender.username}
                      </span>
                      {msg.is_bot && (
                        <Badge className="bg-black text-white text-[9px] h-4 py-0 px-1 border-none shadow-none font-bold uppercase tracking-wider">
                          Bot
                        </Badge>
                      )}
                    </>
                  )}
                  <span className="text-xs text-gray-500 font-bold">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  {/* Sender Avatar Thumbnail */}
                  <div
                    className={`w-8 h-8 rounded-full border-2 border-black overflow-hidden flex items-center justify-center font-black text-xs shrink-0 cursor-pointer shadow-[1px_1px_0_0_rgba(0,0,0,1)] ${
                      msg.is_bot ? "bg-[#FEF08A] text-black" : "bg-[#A78BFA] text-white"
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

                  {/* Message Content Bubble */}
                  <div className={`${bubbleBg} px-4 py-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-sm group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow`}>
                    <p className="whitespace-pre-wrap font-medium break-words leading-relaxed text-black/90">
                      {renderMessageContent(msg.content, user?.username)}
                    </p>
                  </div>
                  
                  {!isMe && lobby?.owner_id === user?.id && !msg.is_bot && (
                    <div className={`opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity ${isMe ? 'order-first' : ''}`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/10 text-black/50 hover:text-black transition-colors outline-none focus:ring-2 focus:ring-black">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isMe ? "end" : "start"} className="brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-48">
                          <div className="px-2 py-1.5 text-sm font-bold">Moderation</div>
                          <DropdownMenuSeparator className="bg-black" />
                          <DropdownMenuItem onClick={() => handleModeration('mute', msg.sender.id, 15)} className="font-bold cursor-pointer text-orange-600 focus:bg-orange-100 focus:text-orange-700">
                            <MicOff className="mr-2 h-4 w-4" />
                            Mute User (15m)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModeration('mute', msg.sender.id, 60)} className="font-bold cursor-pointer text-orange-600 focus:bg-orange-100 focus:text-orange-700">
                            <MicOff className="mr-2 h-4 w-4" />
                            Mute User (1h)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModeration('unmute', msg.sender.id)} className="font-bold cursor-pointer text-green-600 focus:bg-green-100 focus:text-green-700">
                            <Mic className="mr-2 h-4 w-4" />
                            Unmute User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-black" />
                          <DropdownMenuItem onClick={() => handleModeration('kick', msg.sender.id)} className="font-bold cursor-pointer text-red-600 focus:bg-red-100 focus:text-red-700">
                            <UserMinus className="mr-2 h-4 w-4" />
                            Kick User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModeration('ban', msg.sender.id)} className="font-bold cursor-pointer text-red-700 focus:bg-red-200 focus:text-red-800">
                            <Ban className="mr-2 h-4 w-4" />
                            Ban User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {/* End of messages */}
      </div>

      {/* Input Area */}
      <div className="bg-[#FEF08A] border-t-4 border-black p-4 shrink-0 relative">
        {mentionQuery !== null && filteredMentions.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 bg-white brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-sm overflow-hidden z-50 min-w-[220px] max-h-48 overflow-y-auto">
            <div className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Mention Member</span>
              <span className="text-[10px] text-gray-300">{filteredMentions.length} matches</span>
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
                  {m.is_bot ? 'BOT' : 'USER'}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Input 
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (type @ to mention)"
            className="flex-1 bg-white h-12 text-base font-medium brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] transition-all"
            disabled={!isConnected}
          />
          <Button 
            type="submit" 
            disabled={!isConnected || !inputMessage.trim()}
            className="h-12 px-8 bg-[#c084fc] hover:bg-[#a855f7] text-white font-bold text-lg brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all cursor-pointer"
          >
            SEND
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
        currentUserRole={lobby?.owner_id === user?.id ? "OWNER" : (lobbyMembers.find(m => m.user_id === user?.id)?.role || "MEMBER")}
        isLobbyOwner={lobby?.owner_id === user?.id}
        onActionSuccess={refreshMembers}
      />
    </div>

    <LobbySettingsDialog 
      lobby={lobby} 
      isOpen={settingsOpen} 
      onClose={() => setSettingsOpen(false)} 
      myRole={lobby.owner_id === user?.id ? 'OWNER' : 'MEMBER'}
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

    </ProtectedRoute>
  );
}
