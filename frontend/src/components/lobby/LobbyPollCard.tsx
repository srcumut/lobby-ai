"use client";

import React, { useState } from "react";
import { Poll, PollOption } from "@/lib/api/polls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart2, Clock, CheckCircle2, Crown, CheckSquare, Square, XCircle } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";

interface LobbyPollCardProps {
  poll: Poll;
  currentUserId: string;
  isModeratorOrOwner?: boolean;
  onVote: (pollId: string, optionId: string) => Promise<void>;
  onClosePoll?: (pollId: string) => Promise<void>;
  compact?: boolean;
}

export function LobbyPollCard({
  poll,
  currentUserId,
  isModeratorOrOwner = false,
  onVote,
  onClosePoll,
  compact = false,
}: LobbyPollCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const isCreator = poll.creator.id === currentUserId;
  const canClose = (isCreator || isModeratorOrOwner) && !poll.is_closed;

  // Calculate highest vote count for winning option
  const maxVotes = Math.max(...poll.options.map((o) => o.vote_count), 0);

  const handleVoteClick = async (optionId: string) => {
    if (poll.is_closed || isVoting) return;
    setIsVoting(true);
    try {
      await onVote(poll.id, optionId);
    } finally {
      setIsVoting(false);
    }
  };

  const handleCloseClick = async () => {
    if (isClosing || !onClosePoll) return;
    setIsClosing(true);
    try {
      await onClosePoll(poll.id);
    } finally {
      setIsClosing(false);
    }
  };

  // Format ends_at
  const getRemainingTime = () => {
    if (!poll.ends_at) return null;
    const diff = new Date(poll.ends_at).getTime() - Date.now();
    if (diff <= 0) return "Süre Doldu";
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 60) return `${mins} dk kaldı`;
    const hours = Math.floor(mins / 60);
    return `${hours} saat kaldı`;
  };

  const remaining = getRemainingTime();

  return (
    <div
      className={`bg-white border-3 border-black rounded-sm shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all ${
        compact ? "p-3" : "p-4"
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Badge
            className={`font-black text-[10px] px-2 py-0.5 border-2 border-black ${
              poll.is_closed
                ? "bg-gray-200 text-gray-800 shadow-none"
                : "bg-[#FEF08A] text-black shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
            }`}
          >
            {poll.is_closed ? "TAMAMLANDI" : "CANLI ANKET"}
          </Badge>
          {poll.is_multiple_choice && (
            <Badge className="bg-[#cffafe] text-black font-bold text-[9px] border border-black">
              Çoklu Oy
            </Badge>
          )}
          {remaining && (
            <span
              className={`text-[11px] font-bold flex items-center gap-1 ${
                remaining === "Süre Doldu" ? "text-red-600" : "text-gray-600"
              }`}
            >
              <Clock className="w-3 h-3" /> {remaining}
            </span>
          )}
        </div>

        {/* Close Button for moderators or creator */}
        {canClose && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCloseClick}
            disabled={isClosing}
            className="h-6 px-2 text-[10px] bg-white hover:bg-red-100 text-red-600 border border-black font-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] cursor-pointer"
          >
            {isClosing ? "Kapatılıyor..." : "Anketi Sonlandır"}
          </Button>
        )}
      </div>

      {/* Question */}
      <h4 className="font-black text-base text-black mb-3 leading-snug">
        {poll.question}
      </h4>

      {/* Options List */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const isWinner = poll.is_closed && opt.vote_count === maxVotes && maxVotes > 0;
          const hasVoted = opt.has_voted;

          return (
            <div
              key={opt.id}
              onClick={() => !poll.is_closed && handleVoteClick(opt.id)}
              className={`relative border-2 border-black rounded-sm overflow-hidden p-2.5 transition-all shadow-[1px_1px_0_0_rgba(0,0,0,1)] ${
                poll.is_closed
                  ? "cursor-default bg-gray-50"
                  : "cursor-pointer hover:-translate-y-[1px] active:translate-y-[1px] bg-white"
              } ${hasVoted ? "ring-2 ring-black" : ""}`}
            >
              {/* Animated Progress Bar Fill */}
              <div
                className={`absolute top-0 left-0 bottom-0 transition-all duration-700 opacity-30 ${
                  isWinner ? "bg-[#4ADE80]" : hasVoted ? "bg-[#FEF08A]" : "bg-[#FED7AA]"
                }`}
                style={{ width: `${opt.percentage}%` }}
              />

              {/* Option Text and Stats Content */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {poll.is_closed ? (
                    isWinner ? (
                      <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 shrink-0" />
                    )
                  ) : hasVoted ? (
                    <CheckSquare className="w-4 h-4 text-black shrink-0 font-bold" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span
                    className={`text-sm break-words leading-tight ${
                      hasVoted || isWinner ? "font-black text-black" : "font-bold text-black/90"
                    }`}
                  >
                    {opt.text}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-xs font-black text-black">
                  <span>%{Math.round(opt.percentage)}</span>
                  <span className="text-[11px] text-gray-500 font-bold">
                    ({opt.vote_count})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-bold mt-3 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full border border-black overflow-hidden bg-gray-200 text-[9px] flex items-center justify-center shrink-0">
            {poll.creator.avatar_url ? (
              <img
                src={getAvatarUrl(poll.creator.avatar_url)}
                alt={poll.creator.username}
                className="w-full h-full object-cover"
              />
            ) : (
              poll.creator.username.charAt(0).toUpperCase()
            )}
          </div>
          <span>@{poll.creator.username}</span>
        </div>

        <span className="text-black font-black">
          Toplam: {poll.total_votes} Oy
        </span>
      </div>
    </div>
  );
}
