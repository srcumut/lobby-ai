// ============================================================================
// TARGET_DESTINATION: frontend/src/components/lobby/LobbyActivityMenu.tsx
// PURPOSE: Interactive Activities & Party Games Drawer next to Lobby Message Input
// ============================================================================

"use client";

import React, { useState } from "react";
import { 
  Gamepad2, 
  Brain, 
  BarChart3, 
  Swords, 
  HelpCircle, 
  CircleDollarSign, 
  Dices,
  Sparkles,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LobbyActivityMenuProps {
  onStartTrivia: () => void;
  onOpenPoll: () => void;
  onOpenRps: () => void;
  onDropIcebreaker: () => void;
  onRollDice: () => void;
  onFlipCoin: () => void;
  disabled?: boolean;
}

export function LobbyActivityMenu({
  onStartTrivia,
  onOpenPoll,
  onOpenRps,
  onDropIcebreaker,
  onRollDice,
  onFlipCoin,
  disabled = false,
}: LobbyActivityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 px-3 sm:px-4 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-black brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-1.5 transition-all cursor-pointer"
        title="Lobi Aktiviteleri & Mini Oyunlar"
      >
        <Gamepad2 className="w-5 h-5 text-black" />
        <span className="hidden sm:inline text-xs font-black uppercase">Aktiviteler</span>
        <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Popover Action Sheet */}
      {isOpen && (
        <>
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 bg-white brutal-border border-3 shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-sm overflow-hidden z-50 animate-fade-in-up">
            {/* Header */}
            <div className="bg-black text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-[#4ADE80]" />
                <span className="text-xs font-black uppercase tracking-wider">LOBİ AKTİVİTELERİ</span>
              </div>
              <Badge className="bg-[#FEF08A] text-black text-[9px] font-black uppercase py-0 px-1 border-none shadow-none">
                Canlı Eğlence
              </Badge>
            </div>

            <div className="p-2 space-y-1">
              {/* Live Trivia */}
              <button
                type="button"
                onClick={() => handleAction(onStartTrivia)}
                className="w-full text-left p-2 rounded hover:bg-[#FEF08A] border-2 border-transparent hover:border-black transition-all flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded bg-[#FEF08A] border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_rgba(0,0,0,1)] group-hover:bg-white">
                  <Brain className="w-4 h-4 text-purple-700" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-black block">Canlı Trivia Yarışması</span>
                  <span className="text-[10px] font-bold text-gray-500 block">Tüm odayla 5 soruluk bilgi yarışı</span>
                </div>
              </button>

              {/* Live Poll */}
              <button
                type="button"
                onClick={() => handleAction(onOpenPoll)}
                className="w-full text-left p-2 rounded hover:bg-[#FEF08A] border-2 border-transparent hover:border-black transition-all flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded bg-[#86EFAC] border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_rgba(0,0,0,1)] group-hover:bg-white">
                  <BarChart3 className="w-4 h-4 text-green-800" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-black block">Canlı Anket Başlat</span>
                  <span className="text-[10px] font-bold text-gray-500 block">Oda üyelerinden anlık oy topla</span>
                </div>
              </button>

              {/* Rock Paper Scissors Duel Challenge */}
              <button
                type="button"
                onClick={() => handleAction(onOpenRps)}
                className="w-full text-left p-2 rounded hover:bg-[#FEF08A] border-2 border-transparent hover:border-black transition-all flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded bg-[#FED7AA] border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_rgba(0,0,0,1)] group-hover:bg-white">
                  <span className="text-base">✊</span>
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-black block">Taş - Kağıt - Makas</span>
                  <span className="text-[10px] font-bold text-gray-500 block">Sohbete meydan okuma kutusu fırlat</span>
                </div>
              </button>

              {/* Icebreaker Prompt */}
              <button
                type="button"
                onClick={() => handleAction(onDropIcebreaker)}
                className="w-full text-left p-2 rounded hover:bg-[#CFFAFE] border-2 border-transparent hover:border-black transition-all flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded bg-[#CFFAFE] border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_rgba(0,0,0,1)] group-hover:bg-white">
                  <span className="text-base">❄️</span>
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-black block">Buz Kırıcı Soru At</span>
                  <span className="text-[10px] font-bold text-gray-500 block">Sohbeti ve botları canlandıracak soru</span>
                </div>
              </button>

              {/* Dice & Coin Row */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => handleAction(onRollDice)}
                  className="p-1.5 rounded hover:bg-gray-100 border border-black flex items-center justify-center gap-1 text-xs font-black text-black cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5 text-blue-600" />
                  <span>1-6 Zar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(onFlipCoin)}
                  className="p-1.5 rounded hover:bg-gray-100 border border-black flex items-center justify-center gap-1 text-xs font-black text-black cursor-pointer"
                >
                  <CircleDollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>Yazı - Tura</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
