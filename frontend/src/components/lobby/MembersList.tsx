// ============================================================================
// TARGET_DESTINATION: frontend/src/components/lobby/MembersList.tsx
// PURPOSE: Lobby members sidebar displaying live users and custom avatar images
// ============================================================================

"use client";

import { Users, Bot, Shield, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LobbyMember } from "@/types";
import { MemberContextMenu } from "./MemberContextMenu";
import { getAvatarUrl } from "@/lib/avatar";

interface MembersListProps {
  members: LobbyMember[];
  onMemberClick: (userId: string) => void;
  isOpen?: boolean;
  lobbyId?: string;
  currentUserId?: string;
  currentUserRole?: string;
  isLobbyOwner?: boolean;
  onActionSuccess?: () => void;
  onChallengeRps?: (targetId: string, targetUsername: string, isBot?: boolean) => void;
}

export function MembersList({ 
  members, 
  onMemberClick, 
  isOpen = true,
  lobbyId = "",
  currentUserId,
  currentUserRole = "MEMBER",
  isLobbyOwner = false,
  onActionSuccess,
  onChallengeRps,
}: MembersListProps) {

  const humans = members.filter(m => !m.is_bot);
  const bots = members.filter(m => m.is_bot);

  if (!isOpen) return null;

  const renderRoleBadge = (role?: string) => {
    if (role === "OWNER") {
      return (
        <Badge className="bg-[#FEF08A] text-black border border-black text-[9px] px-1 py-0 h-4 flex items-center gap-0.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
          <Crown className="w-2.5 h-2.5 text-amber-600" />
          KURUCU
        </Badge>
      );
    }
    if (role === "MODERATOR") {
      return (
        <Badge className="bg-[#FB923C] text-black border border-black text-[9px] px-1 py-0 h-4 flex items-center gap-0.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)] font-bold">
          <Shield className="w-2.5 h-2.5" />
          MOD
        </Badge>
      );
    }
    return null;
  };

  return (
    <aside className="w-64 bg-white border-l-4 border-black shrink-0 hidden lg:flex flex-col h-full brutal-shadow z-10">
      <div className="p-4 border-b-4 border-black bg-[#FEF08A] shrink-0">
        <h3 className="font-black text-lg uppercase flex items-center gap-2">
          <Users className="w-5 h-5" /> Üyeler — {members.length}
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Humans Section */}
        <div>
          <h4 className="text-xs font-black uppercase text-gray-500 mb-3 tracking-wider flex items-center justify-between">
            <span>Çevrimiçi Kullanıcılar</span>
            <span className="bg-gray-100 px-1.5 py-0.5 border border-black text-[10px]">{humans.length}</span>
          </h4>
          <div className="space-y-1.5">
            {humans.map(human => {
              const isSelf = currentUserId === human.user_id;

              return (
                <div 
                  key={human.user_id}
                  className="flex items-center justify-between p-1.5 rounded-sm hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] group"
                >
                  <div 
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer pr-1"
                    onClick={() => onMemberClick(human.user_id)}
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FB923C] to-[#F472B6] border-2 border-black overflow-hidden flex items-center justify-center font-black text-white shrink-0 text-xs shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                      {human.avatar_url ? (
                        <img 
                          src={getAvatarUrl(human.avatar_url)} 
                          alt={human.username} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        human.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm truncate" title={human.username}>
                          {human.username}
                        </span>
                        {isSelf && <span className="text-[10px] text-gray-400 font-bold">(Sen)</span>}
                      </div>
                      {renderRoleBadge(human.role)}
                    </div>
                  </div>

                    <MemberContextMenu 
                      member={human}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                      isLobbyOwner={isLobbyOwner}
                      lobbyId={lobbyId}
                      onOpenProfile={onMemberClick}
                      onActionSuccess={onActionSuccess}
                        onChallengeRps={onChallengeRps}
                    />

                </div>
              );
            })}
          </div>
        </div>

        {/* Bots Section */}
        {bots.length > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase text-gray-500 mb-3 tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">Aktif Ajanlar</span>
              <span className="bg-gray-100 px-1.5 py-0.5 border border-black text-[10px]">{bots.length}</span>
            </h4>
            <div className="space-y-1.5">
              {bots.map(bot => (
                <div 
                  key={bot.user_id}
                  className="flex items-center justify-between p-1.5 rounded-sm hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] group"
                >
                  <div 
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer pr-1"
                    onClick={() => onMemberClick(bot.user_id)}
                  >
                    {/* Bot Avatar */}
                    <div className="w-8 h-8 rounded-full bg-[#FEF08A] border-2 border-black overflow-hidden flex items-center justify-center font-black text-black shrink-0 shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                      {bot.avatar_url ? (
                        <img 
                          src={getAvatarUrl(bot.avatar_url)} 
                          alt={bot.username} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm truncate" title={bot.username}>
                        {bot.username}
                      </span>
                      <Badge className="bg-black text-white text-[9px] w-fit px-1 py-0 h-4 mt-0.5">
                        BOT
                      </Badge>
                    </div>
                  </div>

                  <MemberContextMenu 
                    member={bot}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    isLobbyOwner={isLobbyOwner}
                    lobbyId={lobbyId}
                    onOpenProfile={onMemberClick}
                    onActionSuccess={onActionSuccess}
                    onChallengeRps={onChallengeRps}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </aside>
  );
}
