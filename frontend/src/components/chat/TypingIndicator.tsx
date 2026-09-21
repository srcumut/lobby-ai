"use client";

import { Bot } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";

export interface TypingUser {
  userId: string;
  username: string;
  isBot?: boolean;
  avatarUrl?: string | null;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  // Format typing label
  let text = "";
  if (typingUsers.length === 1) {
    const u = typingUsers[0];
    text = u.isBot ? `${u.username} düşünüyor...` : `${u.username} yazıyor...`;
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0].username} ve ${typingUsers[1].username} yazıyor...`;
  } else {
    text = `${typingUsers[0].username} ve diğer ${typingUsers.length - 1} kişi yazıyor...`;
  }

  const primaryUser = typingUsers[0];

  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-fade-in-up">
      {/* Avatar or Bot icon */}
      <div
        className={`w-7 h-7 rounded-full border-2 border-black overflow-hidden flex items-center justify-center font-black text-xs shrink-0 shadow-[1px_1px_0_0_rgba(0,0,0,1)] ${
          primaryUser.isBot ? "bg-[#FEF08A] text-black" : "bg-[#A78BFA] text-white"
        }`}
      >
        {primaryUser.avatarUrl ? (
          <img
            src={getAvatarUrl(primaryUser.avatarUrl)}
            alt={primaryUser.username}
            className="w-full h-full object-cover"
          />
        ) : primaryUser.isBot ? (
          <Bot className="w-3.5 h-3.5 text-black" />
        ) : (
          primaryUser.username.charAt(0).toUpperCase()
        )}
      </div>

      {/* Bubble with three bouncing dots */}
      <div className="inline-flex items-center gap-2.5 bg-white px-3.5 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-sm">
        <span className="text-xs font-bold text-gray-700">{text}</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-black inline-block animate-typing-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-black inline-block animate-typing-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-black inline-block animate-typing-3" />
        </div>
      </div>
    </div>
  );
}
