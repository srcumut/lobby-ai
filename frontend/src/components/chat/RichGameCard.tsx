// ============================================================================
// TARGET_DESTINATION: frontend/src/components/chat/RichGameCard.tsx
// PURPOSE: Neo-Brutalist rich visual card renderer for 1-6 dice, coin flip, icebreakers & RPS duels
// ============================================================================

"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Swords, 
  Sparkles, 
  Flame, 
  CircleDollarSign,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface RichGameCardProps {
  content: string;
  senderName: string;
  isMe: boolean;
  onAnnounceToChat?: (text: string) => void;
}

const DICE_FACES: Record<number, string> = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

export function isRichGameMessage(content: string): boolean {
  if (!content) return false;
  return (
    content.startsWith("🎲 Zar attı:") ||
    content.startsWith("🪙 Yazı-tura attı:") ||
    content.startsWith("❄️ [GÜNÜN TARTIŞMA SORUSU]:") ||
    content.startsWith("⚔️ [RPS MEYDAN OKUMASI]:") ||
    content.startsWith("✊ [TAŞ-KAĞIT-MAKAS]:") ||
    content.startsWith("🏆 [ARCADE ŞAMPİYONU]:") ||
    content.startsWith("📊 [CANLI ANKET]:")
  );
}

export function RichGameCard({
  content,
  senderName,
  isMe,
  onAnnounceToChat,
}: RichGameCardProps) {
  const [accepted, setAccepted] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  // 1. DICE ROLL (1 to 6)
  if (content.startsWith("🎲 Zar attı:")) {
    const match = content.match(/🎲 Zar attı:\s*(\d+)\s*\/\s*(\d+)(.*)/);
    const score = match ? parseInt(match[1], 10) : 6;
    const max = match ? parseInt(match[2], 10) : 6;
    const note = match ? match[3].trim() : "";

    const isSix = score === 6 || score === 100;
    const isOne = score === 1;

    const bgGradient = isSix
      ? "from-[#FEF08A] via-[#FB923C] to-[#EF4444]"
      : isOne
      ? "from-gray-200 via-gray-300 to-gray-400"
      : "from-white to-[#FDFBF7]";

    const diceGlyph = DICE_FACES[score] || "🎲";

    return (
      <div className={`p-4 bg-gradient-to-br ${bgGradient} brutal-border border-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-sm min-w-[240px] max-w-sm`}>
        <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">{diceGlyph}</span>
            <span className="text-xs font-black uppercase tracking-wider text-black">ZAR ATIŞI</span>
          </div>
          {isSix && (
            <Badge className="bg-[#EF4444] text-white font-black text-[10px] animate-bounce">
              <Flame className="w-3 h-3 mr-0.5 inline" /> MÜKEMMEL 6!
            </Badge>
          )}
          {isOne && (
            <Badge className="bg-black text-white font-black text-[10px]">
              🐍 YILAN GÖZÜ 1
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-black tracking-tight drop-shadow-[1px_1px_0px_#FFF]">
              {score}
              <span className="text-sm font-bold text-black/60"> / {max}</span>
            </div>
            {note && (
              <p className="text-xs font-black text-black/80 mt-0.5">
                {note.replace(/[[\]]/g, "")}
              </p>
            )}
          </div>
          <div className="w-14 h-14 bg-white brutal-border border-2 rounded flex items-center justify-center text-3xl font-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            {diceGlyph}
          </div>
        </div>
      </div>
    );
  }

  // 2. COIN FLIP
  if (content.startsWith("🪙 Yazı-tura attı:")) {
    const isYazi = content.includes("YAZI");
    return (
      <div className="p-4 bg-gradient-to-r from-[#FEF08A] to-[#FFEDD5] brutal-border border-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-sm min-w-[230px] max-w-sm">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <CircleDollarSign className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-black uppercase tracking-wider text-black">YAZI - TURA</span>
          </div>
          <span className="text-[10px] font-bold text-gray-700">Şans Kararı</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 block">SONUÇ</span>
            <div className="text-2xl sm:text-3xl font-black text-black tracking-tight flex items-center gap-1.5">
              <span>{isYazi ? "🪙 YAZI" : "👑 TURA"}</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-white brutal-border border-2 rounded-full flex items-center justify-center text-xl font-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            {isYazi ? "Y" : "T"}
          </div>
        </div>
      </div>
    );
  }

  // 3. ICEBREAKER QUESTION
  if (content.startsWith("❄️ [GÜNÜN TARTIŞMA SORUSU]:")) {
    const questionText = content.replace("❄️ [GÜNÜN TARTIŞMA SORUSU]:", "").trim();
    return (
      <div className="p-4 bg-[#CFFAFE] brutal-border border-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-sm max-w-md">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">❄️</span>
            <span className="text-xs font-black uppercase tracking-wider text-black">BUZ KIRICI TARTIŞMA</span>
          </div>
          <Badge className="bg-black text-[#67E8F9] font-black text-[9px] uppercase">
            Topluluk Sorusu
          </Badge>
        </div>
        <p className="font-bold text-sm sm:text-base text-black leading-snug">
          "{questionText}"
        </p>
        <p className="text-[11px] font-semibold text-black/60 mt-2">
          💬 Fikrini belirtmek için hemen sohbete yaz veya botlara sor!
        </p>
      </div>
    );
  }

  // 4. RPS PUBLIC CHALLENGE BOX
  if (content.startsWith("⚔️ [RPS MEYDAN OKUMASI]:")) {
    const handleAccept = () => {
      setAccepted(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("lobby:rps_accept_challenge", {
            detail: { challengerUsername: senderName },
          })
        );
      }
    };

    const handleCancel = () => {
      setCancelled(true);
      if (onAnnounceToChat) {
        onAnnounceToChat(`⚔️ [RPS İPTAL EDİLDİ]: @${senderName} meydan okumayı geri çekti.`);
      }
    };

    if (cancelled) {
      return (
        <div className="p-3 bg-gray-100 border-2 border-dashed border-gray-400 rounded-sm text-xs font-bold text-gray-500 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-gray-400" />
          <span>Bu meydan okuma iptal edildi.</span>
        </div>
      );
    }

    return (
      <div className="p-4 bg-gradient-to-r from-[#FED7AA] via-[#FEF08A] to-[#86EFAC] brutal-border border-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-sm max-w-sm space-y-3">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-black" />
            <span className="text-xs font-black uppercase tracking-wider text-black">MEYDAN OKUMA</span>
          </div>
          <Badge className="bg-black text-[#FEF08A] font-black text-[9px] uppercase">
            Taş - Kağıt - Makas
          </Badge>
        </div>

        <div>
          <p className="font-black text-sm text-black">
            @{senderName} odadaki herkese meydan okudu!
          </p>
          <span className="text-[10px] font-bold text-gray-700 block mt-0.5">
            İlk kabul eden kişi ile 10 saniyelik anlık kapışma başlar!
          </span>
        </div>

        <div className="pt-1 flex items-center justify-between gap-2">
          {accepted ? (
            <div className="w-full p-2 bg-[#DCFCE7] border-2 border-black text-center text-xs font-black text-green-900 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Düello Başladı!
            </div>
          ) : isMe ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-[11px] font-bold text-black/70 animate-pulse">
                Rakip bekleniyor...
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="h-7 px-2.5 bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-[10px] uppercase shadow-[1.5px_1.5px_0_0_#000] cursor-pointer"
              >
                İptal Et
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleAccept}
              className="w-full h-9 bg-black hover:bg-neutral-800 text-[#FEF08A] border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] active:translate-y-px cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Swords className="w-3.5 h-3.5" /> MEYDAN OKUMAYI KABUL ET
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 5. RPS DUEL OUTCOME
  if (content.startsWith("✊ [TAŞ-KAĞIT-MAKAS]:")) {
    const cleanText = content.replace("✊ [TAŞ-KAĞIT-MAKAS]:", "").trim();

    return (
      <div className="p-4 bg-gradient-to-r from-[#FCE7F3] via-[#FED7AA] to-[#FEF08A] brutal-border border-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-sm max-w-sm">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">✊</span>
            <span className="text-xs font-black uppercase tracking-wider text-black">
              TAŞ - KAĞIT - MAKAS SONUCU
            </span>
          </div>
          <Trophy className="w-4 h-4 text-amber-600" />
        </div>
        <p className="font-black text-sm text-black leading-snug">
          {cleanText}
        </p>
      </div>
    );
  }

  // Fallback to normal text
  return <span>{content}</span>;
}
