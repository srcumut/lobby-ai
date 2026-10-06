// ============================================================================
// TARGET_DESTINATION: frontend/src/components/lobby/LobbyRpsDuel.tsx
// PURPOSE: Fast 1v1 Rock-Paper-Scissors Duel against Lobby Members or AI Bots
// ============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, RotateCcw, Trophy, Bot, Flame, Sparkles } from "lucide-react";

export type RpsChoice = "rock" | "paper" | "scissors";

const RPS_EMOJI: Record<RpsChoice, string> = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
};

const RPS_NAME: Record<RpsChoice, string> = {
  rock: "Taş",
  paper: "Kağıt",
  scissors: "Makas",
};

interface LobbyRpsDuelProps {
  isOpen: boolean;
  onClose: () => void;
  lobbyId: string;
  currentUserId: string;
  currentUsername: string;
  opponentId: string;
  opponentUsername: string;
  opponentIsBot?: boolean;
  sendGameAction: (payload: unknown) => void;
  incomingGameEvent?: {
    sender_id: string;
    sender_username: string;
    data?: any;
  } | null;
  onAnnounceToChat?: (content: string) => void;
}

export function LobbyRpsDuel({
  isOpen,
  onClose,
  lobbyId,
  currentUserId,
  currentUsername,
  opponentId,
  opponentUsername,
  opponentIsBot = false,
  sendGameAction,
  incomingGameEvent,
  onAnnounceToChat,
}: LobbyRpsDuelProps) {
  const [myChoice, setMyChoice] = useState<RpsChoice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<RpsChoice | null>(null);
  const [opponentReady, setOpponentReady] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [winner, setWinner] = useState<"me" | "opponent" | "tie" | null>(null);
  const [score, setScore] = useState({ me: 0, opponent: 0, ties: 0 });
  const [botQuote, setBotQuote] = useState<string>("");

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Bot Quips
  const BOT_TAUNTS = [
    "Algoritmalarım senin hamleni 3 adım önceden hesapladı!",
    "Bilişsel zekam karşısında şansın yok, hodri meydan!",
    "CPU çekirdeklerim galibiyet için ısınıyor!",
  ];

  const BOT_WIN_QUOTES = [
    "İnsan sezgileri yapay zeka işlem gücünü yenemedi! Zafer benim!",
    "Gelecek yapay zekanın, işte kanıtı!",
    "Güzel denemeydi ama matematik yanılmaz!",
  ];

  const BOT_LOSE_QUOTES = [
    "N-nasıl yani?! Kuantum olasılıklarımda bu yoktu!",
    "Hata kodu 404: Bot gururu bulunamadı... Tebrikler!",
    "Rövanş istiyorum, bu sadece bir algoritmik sapmaydı!",
  ];

  // Reset round
  const resetRound = () => {
    setMyChoice(null);
    setOpponentChoice(null);
    setOpponentReady(false);
    setIsRevealed(false);
    setCountdown(null);
    setWinner(null);
    setBotQuote("");
  };

  // When match begins or rematch
  useEffect(() => {
    if (isOpen) {
      resetRound();
      if (opponentIsBot) {
        setBotQuote(BOT_TAUNTS[Math.floor(Math.random() * BOT_TAUNTS.length)]);
      }
    }
  }, [isOpen]);

  // Handle incoming game events
  useEffect(() => {
    if (!incomingGameEvent?.data || !isOpen) return;
    const action = incomingGameEvent.data;

    // Check if event belongs to this duel
    if (action.gameType === "rps") {
      if (action.type === "choice_ready" && action.senderId === opponentId) {
        setOpponentReady(true);
      } else if (action.type === "reveal" && action.senderId === opponentId) {
        setOpponentChoice(action.choice);
      } else if (action.type === "rematch") {
        resetRound();
      }
    }
  }, [incomingGameEvent, isOpen, opponentId]);

  // Make a choice
  const handleSelectChoice = (choice: RpsChoice) => {
    if (myChoice || isRevealed) return;
    setMyChoice(choice);

    if (opponentIsBot) {
      // Bot picks randomly
      const choices: RpsChoice[] = ["rock", "paper", "scissors"];
      const botPick = choices[Math.floor(Math.random() * choices.length)];
      setOpponentReady(true);
      setTimeout(() => {
        startReveal(choice, botPick);
      }, 400);
    } else {
      // Send choice ready (hide actual choice until reveal)
      sendGameAction({
        gameType: "rps",
        type: "choice_ready",
        senderId: currentUserId,
        targetId: opponentId,
      });

      // If opponent already made choice, trigger reveal
      if (opponentReady) {
        sendGameAction({
          gameType: "rps",
          type: "reveal",
          senderId: currentUserId,
          targetId: opponentId,
          choice,
        });
        startCountdown();
      }
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    let count = 3;

    countdownIntervalRef.current = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setCountdown(null);
        setIsRevealed(true);
      }
    }, 600);
  };

  const startReveal = (myPick: RpsChoice, oppPick: RpsChoice) => {
    setCountdown(3);
    let count = 3;

    countdownIntervalRef.current = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setCountdown(null);
        setOpponentChoice(oppPick);
        setIsRevealed(true);
        determineWinner(myPick, oppPick);
      }
    }, 500);
  };

  // When both choices revealed in PvP
  useEffect(() => {
    if (myChoice && opponentChoice && !isRevealed && !opponentIsBot) {
      startCountdown();
    }
  }, [myChoice, opponentChoice]);

  // Determine winner when revealed
  const determineWinner = (p1: RpsChoice, p2: RpsChoice) => {
    let outcome: "me" | "opponent" | "tie" = "tie";

    if (p1 === p2) {
      outcome = "tie";
    } else if (
      (p1 === "rock" && p2 === "scissors") ||
      (p1 === "paper" && p2 === "rock") ||
      (p1 === "scissors" && p2 === "paper")
    ) {
      outcome = "me";
    } else {
      outcome = "opponent";
    }

    setWinner(outcome);
    setScore((prev) => ({
      me: outcome === "me" ? prev.me + 1 : prev.me,
      opponent: outcome === "opponent" ? prev.opponent + 1 : prev.opponent,
      ties: outcome === "tie" ? prev.ties + 1 : prev.ties,
    }));

    if (opponentIsBot) {
      if (outcome === "me") {
        setBotQuote(BOT_LOSE_QUOTES[Math.floor(Math.random() * BOT_LOSE_QUOTES.length)]);
      } else if (outcome === "opponent") {
        setBotQuote(BOT_WIN_QUOTES[Math.floor(Math.random() * BOT_WIN_QUOTES.length)]);
      } else {
        setBotQuote("Berabere! Zihinlerimiz aynı frekansta titreşiyor.");
      }
    }

    // Announce to chat
    if (onAnnounceToChat) {
      const resultText =
        outcome === "me"
          ? `🏆 ${currentUsername} (${RPS_NAME[p1]}) yendi! Rakip: ${opponentUsername} (${RPS_NAME[p2]})`
          : outcome === "opponent"
          ? `🏆 ${opponentUsername} (${RPS_NAME[p2]}) yendi! Rakip: ${currentUsername} (${RPS_NAME[p1]})`
          : `🤝 Berabere bitti! (${RPS_NAME[p1]} vs ${RPS_NAME[p2]})`;

      onAnnounceToChat(`✊ [TAŞ-KAĞIT-MAKAS]: ${resultText}`);
    }
  };

  const handleRematch = () => {
    resetRound();
    if (!opponentIsBot) {
      sendGameAction({
        gameType: "rps",
        type: "rematch",
        senderId: currentUserId,
        targetId: opponentId,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white brutal-border border-4 p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-fade-in-up">
        <DialogHeader className="border-b-2 border-black pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✊</span>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight text-black">
                  TAŞ - KAĞIT - MAKAS
                </DialogTitle>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <span>{currentUsername} vs {opponentUsername}</span>
                  {opponentIsBot && (
                    <Badge className="bg-black text-white text-[9px] h-4 py-0 px-1 border-none shadow-none font-bold uppercase">
                      BOT AJANI
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Score Pill */}
            <div className="bg-[#FEF08A] brutal-border border-2 px-2.5 py-1 text-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <span className="text-[10px] font-black uppercase block text-gray-600">SKOR</span>
              <span className="text-sm font-black text-black">
                {score.me} - {score.opponent}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Bot Banter Quote */}
        {botQuote && (
          <div className="p-2.5 bg-[#CFFAFE] brutal-border border-2 rounded text-xs font-bold text-black flex items-start gap-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <Bot className="w-4 h-4 text-cyan-800 shrink-0 mt-0.5" />
            <p>"{botQuote}"</p>
          </div>
        )}

        {/* ARENA DISPLAY */}
        <div className="py-6 flex flex-col items-center justify-center">
          {countdown !== null ? (
            <div className="text-center animate-bounce">
              <div className="text-6xl font-black text-black">{countdown}</div>
              <span className="text-xs font-black uppercase text-gray-500 tracking-wider">
                HAMLELER AÇILIYOR...
              </span>
            </div>
          ) : isRevealed && myChoice && opponentChoice ? (
            /* Reveal Area */
            <div className="w-full space-y-4 text-center">
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-black uppercase text-gray-600 mb-1">Sen</span>
                  <div className={`w-20 h-20 brutal-border border-3 rounded-xl flex items-center justify-center text-4xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${winner === 'me' ? 'bg-[#86EFAC]' : 'bg-white'}`}>
                    {RPS_EMOJI[myChoice]}
                  </div>
                  <span className="text-sm font-black text-black mt-1.5">{RPS_NAME[myChoice]}</span>
                </div>

                <div className="text-2xl font-black text-black">VS</div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-black uppercase text-gray-600 mb-1">{opponentUsername}</span>
                  <div className={`w-20 h-20 brutal-border border-3 rounded-xl flex items-center justify-center text-4xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${winner === 'opponent' ? 'bg-[#86EFAC]' : 'bg-white'}`}>
                    {RPS_EMOJI[opponentChoice]}
                  </div>
                  <span className="text-sm font-black text-black mt-1.5">{RPS_NAME[opponentChoice]}</span>
                </div>
              </div>

              {/* Outcome Badge */}
              <div className="pt-2">
                {winner === "me" ? (
                  <Badge className="bg-[#4ADE80] text-black font-black text-sm px-4 py-1.5 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                    <Trophy className="w-4 h-4 mr-1 inline" /> KAZANDIN!
                  </Badge>
                ) : winner === "opponent" ? (
                  <Badge className="bg-[#EF4444] text-white font-black text-sm px-4 py-1.5 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                    KAYBETTİN!
                  </Badge>
                ) : (
                  <Badge className="bg-[#FEF08A] text-black font-black text-sm px-4 py-1.5 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                    BERABERE!
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            /* Choosing Area */
            <div className="w-full text-center space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-gray-500 block">
                HAMLENİ SEÇ
              </span>

              <div className="grid grid-cols-3 gap-3">
                {(["rock", "paper", "scissors"] as RpsChoice[]).map((choice) => {
                  const isSelected = myChoice === choice;
                  return (
                    <button
                      key={choice}
                      type="button"
                      disabled={Boolean(myChoice)}
                      onClick={() => handleSelectChoice(choice)}
                      className={`p-4 brutal-border border-3 rounded-lg flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#FEF08A] shadow-[4px_4px_0_0_rgba(0,0,0,1)] -translate-y-1"
                          : "bg-white hover:bg-gray-100 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5"
                      }`}
                    >
                      <span className="text-4xl">{RPS_EMOJI[choice]}</span>
                      <span className="text-xs font-black uppercase text-black">{RPS_NAME[choice]}</span>
                    </button>
                  );
                })}
              </div>

              {myChoice && !isRevealed && (
                <div className="text-xs font-bold text-gray-600 animate-pulse mt-2">
                  {opponentReady
                    ? "Rakip hazır! Hamleler açılıyor..."
                    : `${opponentUsername} hamlesi bekleniyor...`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t-2 border-black pt-3">
          {isRevealed ? (
            <Button
              onClick={handleRematch}
              size="sm"
              className="bg-[#FB923C] hover:bg-[#F97316] text-black font-black text-xs uppercase brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Tekrar Oyna
            </Button>
          ) : (
            <span className="text-[11px] font-bold text-gray-500">
              10 saniyelik hızlı sosyal düello
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="font-black text-xs brutal-border border-2 bg-white hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
          >
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
