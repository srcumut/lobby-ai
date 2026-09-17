// ============================================================================
// TARGET_DESTINATION: frontend/src/app/messages/page.tsx
// PURPOSE: Direct Messages Page with real-time 1-on-1 chat and conversation list
// ============================================================================

"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { useAuth } from "@/hooks/useAuth";
import { getAvatarUrl } from "@/lib/avatar";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  Send, 
  Search, 
  ArrowLeft, 
  User as UserIcon, 
  Loader2,
  Check,
  CheckCheck
} from "lucide-react";

function MessagesContent() {
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
    error,
    sendMessage,
  } = useDirectMessages(initialUserId);

  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // If userId param changes, switch active conversation
  useEffect(() => {
    if (initialUserId) {
      setActiveFriendId(initialUserId);
    }
  }, [initialUserId, setActiveFriendId]);

  // Scroll to bottom on messages change
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const activeConversation = conversations.find(
    (c) => c.friend.id === activeFriendId
  );

  const filteredConversations = conversations.filter((c) => {
    const name = (c.friend.display_name || c.friend.username).toLowerCase();
    const uname = c.friend.username.toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || uname.includes(q);
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const text = inputMessage;
    setInputMessage("");
    try {
      await sendMessage(text);
    } catch {
      setInputMessage(text);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full bg-[#f8fafc] border-4 border-black brutal-shadow rounded-sm overflow-hidden">
      {/* Left Panel: Conversations List */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r-0 md:border-r-4 border-black flex flex-col bg-white shrink-0 ${
          activeFriendId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-[#FEF08A] border-b-4 border-black shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-black" />
            <h2 className="font-black text-lg uppercase tracking-tight">Direct Messages</h2>
          </div>
          <span className="bg-black text-white font-black text-xs px-2 py-0.5 rounded-full">
            {conversations.length}
          </span>
        </div>

        {/* Search */}
        <div className="p-3 border-b-2 border-black bg-gray-50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 font-bold" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="pl-9 bg-white border-2 border-black font-bold text-xs h-9 shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-none"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y-2 divide-gray-100">
          {isLoadingConversations ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2 text-gray-500 font-bold">
              <Loader2 className="w-6 h-6 animate-spin text-black" />
              <span className="text-xs uppercase">Loading conversations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-bold text-sm">
              {searchQuery ? "No friends matching search" : "No friends yet. Add friends to start chatting!"}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = c.friend.id === activeFriendId;
              const hasUnread = c.unread_count > 0;

              return (
                <div
                  key={c.friend.id}
                  onClick={() => setActiveFriendId(c.friend.id)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all border-l-4 ${
                    isSelected
                      ? "bg-[#FFE4E6] border-black shadow-inner"
                      : hasUnread
                      ? "bg-blue-50/50 hover:bg-gray-100 border-blue-500"
                      : "hover:bg-gray-50 border-transparent"
                  }`}
                >
                  {/* Friend Avatar */}
                  <div className="w-10 h-10 rounded-full border-2 border-black bg-[#A78BFA] flex items-center justify-center font-black text-white shrink-0 overflow-hidden shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
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

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="font-black text-sm text-black truncate">
                        {c.friend.display_name || c.friend.username}
                      </h4>
                      {c.last_message && (
                        <span className="text-[10px] font-bold text-gray-400 shrink-0">
                          {new Date(c.last_message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-gray-600 truncate">
                        {c.last_message
                          ? `${c.last_message.sender_id === user?.id ? "You: " : ""}${c.last_message.content}`
                          : "Say hello!"}
                      </p>
                      {hasUnread && (
                        <span className="bg-[#EF4444] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel: Chat View */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-0 bg-[#f4f4f5] h-full ${
          !activeFriendId ? "hidden md:flex" : "flex"
        }`}
      >
        {activeFriendId && activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#A78BFA] border-b-4 border-black p-3.5 flex justify-between items-center z-10 shrink-0">
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
                  className="w-9 h-9 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
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
                  <h3 className="font-black text-base truncate text-black">
                    {activeConversation.friend.display_name || activeConversation.friend.username}
                  </h3>
                  <p className="text-xs font-bold text-black/70 truncate">
                    @{activeConversation.friend.username}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="bg-white text-black border-2 border-black font-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setProfileUserId(activeConversation.friend.id);
                  setProfileOpen(true);
                }}
              >
                <UserIcon className="w-3.5 h-3.5 mr-1" />
                Profile
              </Button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-destructive text-destructive-foreground p-2 text-xs font-bold text-center border-b-2 border-black">
                {error}
              </div>
            )}

            {/* Messages Area */}
            <div
              ref={chatScrollRef}
              className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 bg-[#f4f4f5] flex flex-col gap-3"
            >
              {isLoadingMessages ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-500 font-bold">
                  <Loader2 className="w-6 h-6 animate-spin text-black" />
                  <span className="text-xs uppercase">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-bold gap-2">
                  <MessageSquare className="w-12 h-12 text-gray-300" />
                  <p className="text-sm">No messages yet. Send a message to start chatting!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  const bubbleBg = isMe ? "bg-[#f3e8ff]" : "bg-white";
                  const alignmentClass = isMe ? "self-end" : "self-start";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] md:max-w-[70%] ${alignmentClass} group`}
                    >
                      <div className={`flex items-center gap-2 mb-1 ${isMe ? "justify-end" : ""}`}>
                        {!isMe && (
                          <span className="font-black text-xs text-black">
                            {activeConversation.friend.display_name || activeConversation.friend.username}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 font-bold">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full border-2 border-black overflow-hidden bg-purple-200 flex items-center justify-center font-black text-[10px] shrink-0">
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

                        <div
                          className={`${bubbleBg} px-4 py-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-sm group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow`}
                        >
                          <p className="whitespace-pre-wrap font-medium break-words text-sm leading-relaxed text-black/90">
                            {msg.content}
                          </p>
                        </div>
                      </div>

                      {isMe && (
                        <div className="flex items-center justify-end gap-1 mt-0.5 pr-1">
                          {msg.is_read ? (
                            <span className="flex items-center text-[10px] font-bold text-blue-600 gap-0.5" title="Read">
                              <CheckCheck className="w-3 h-3" /> Read
                            </span>
                          ) : (
                            <span className="flex items-center text-[10px] font-bold text-gray-400 gap-0.5" title="Sent">
                              <Check className="w-3 h-3" /> Sent
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <div className="bg-[#FEF08A] border-t-4 border-black p-3.5 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Message @${activeConversation.friend.username}...`}
                  disabled={isSending}
                  className="bg-white border-2 border-black font-medium text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-none flex-1 focus-visible:ring-0 focus-visible:border-black"
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="bg-[#4ADE80] hover:bg-[#22c55e] text-black border-2 border-black font-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      Send
                    </>
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-[#FEF08A] border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] mb-4">
              <MessageSquare className="w-10 h-10 text-black" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Direct Messages</h3>
            <p className="text-sm font-bold text-gray-500 max-w-sm">
              Select a friend from the conversations list to start a private real-time chat.
            </p>
          </div>
        )}
      </div>

      {/* User Profile Dialog */}
      <UserProfileDialog
        userId={profileUserId}
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
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