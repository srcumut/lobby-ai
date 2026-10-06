// ============================================================================
// TARGET_DESTINATION: frontend/src/components/lobby/LobbyPollDialog.tsx
// PURPOSE: Live In-Lobby Polls with Real-Time WebSocket Voting & Visual Tally
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Plus, Trash2, CheckCircle2, Trophy, Clock, X } from "lucide-react";

export interface PollState {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>; // userId -> optionIndex
  creatorId: string;
  creatorName: string;
  isClosed: boolean;
}

interface LobbyPollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activePoll: PollState | null;
  currentUserId: string;
  currentUsername: string;
  sendGameAction: (payload: unknown) => void;
  onAnnounceToChat?: (msg: string) => void;
  setActivePoll: React.Dispatch<React.SetStateAction<PollState | null>>;
}

export function LobbyPollDialog({
  isOpen,
  onClose,
  activePoll,
  currentUserId,
  currentUsername,
  sendGameAction,
  onAnnounceToChat,
  setActivePoll,
}: LobbyPollDialogProps) {
  // Creation form state
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["Evet, kesinlikle!", "Hayır, katılmıyorum."]);

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (text: string, index: number) => {
    const updated = [...options];
    updated[index] = text;
    setOptions(updated);
  };

  const handleCreatePoll = () => {
    const trimmedQ = question.trim();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!trimmedQ || cleanOptions.length < 2) return;

    const pollId = `poll-${Date.now()}`;
    const newPoll: PollState = {
      id: pollId,
      question: trimmedQ,
      options: cleanOptions,
      votes: {},
      creatorId: currentUserId,
      creatorName: currentUsername,
      isClosed: false,
    };

    setActivePoll(newPoll);

    // Broadcast poll created
    sendGameAction({
      type: "poll_create",
      poll: newPoll,
    });

    if (onAnnounceToChat) {
      onAnnounceToChat(`📊 [CANLI ANKET]: "${trimmedQ}" oylaması başladı! Aktiviteler menüsünden oyunuzu kullanın.`);
    }
  };

  const handleVote = (optionIndex: number) => {
    if (!activePoll || activePoll.isClosed) return;

    const updatedVotes = {
      ...activePoll.votes,
      [currentUserId]: optionIndex,
    };

    const updatedPoll = {
      ...activePoll,
      votes: updatedVotes,
    };

    setActivePoll(updatedPoll);

    sendGameAction({
      type: "poll_vote",
      pollId: activePoll.id,
      optionIndex,
      userId: currentUserId,
    });
  };

  const handleClosePoll = () => {
    if (!activePoll) return;

    const closedPoll = {
      ...activePoll,
      isClosed: true,
    };

    setActivePoll(closedPoll);

    sendGameAction({
      type: "poll_close",
      pollId: activePoll.id,
    });

    // Calculate winner
    const counts: number[] = activePoll.options.map(() => 0);
    Object.values(activePoll.votes).forEach((idx) => {
      if (counts[idx] !== undefined) counts[idx]++;
    });
    const maxVotes = Math.max(...counts, 0);
    const winningOptionIndex = counts.indexOf(maxVotes);
    const winnerName = activePoll.options[winningOptionIndex] || "Belirlenemedi";

    if (onAnnounceToChat) {
      onAnnounceToChat(`📊 [CANLI ANKET]: "${activePoll.question}" anketi sonuçlandı! Kazanan şık: "${winnerName}" (${maxVotes} oy)`);
    }
  };

  // Vote calculation
  const totalVotes = activePoll ? Object.keys(activePoll.votes).length : 0;
  const optionCounts = activePoll
    ? activePoll.options.map((_, idx) => Object.values(activePoll.votes).filter((v) => v === idx).length)
    : [];

  const myVote = activePoll ? activePoll.votes[currentUserId] : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white brutal-border border-4 p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
        <DialogHeader className="border-b-2 border-black pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#FEF08A] brutal-border border-2 rounded">
                <BarChart3 className="w-5 h-5 text-black" />
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-black">
                {activePoll ? "CANLI LOBİ ANKETİ" : "YENİ ANKET BAŞLAT"}
              </DialogTitle>
            </div>
            {activePoll && (
              <Badge className={`font-black uppercase text-xs ${activePoll.isClosed ? 'bg-red-500 text-white' : 'bg-green-500 text-black'}`}>
                {activePoll.isClosed ? "KAPANDI" : "CANLI OYLAMA"}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs font-bold text-gray-600 mt-1">
            {activePoll
              ? `${activePoll.creatorName} tarafından başlatıldı. Tüm oda gerçek zamanlı oy kullanabilir.`
              : "Lobi üyelerinin ve yapay zeka ajanlarının görüşünü anlık oylamayla topla."}
          </DialogDescription>
        </DialogHeader>

        {/* ACTIVE POLL VIEW */}
        {activePoll ? (
          <div className="space-y-4 py-3">
            <div className="p-3 bg-[#FEF08A]/40 brutal-border border-2 rounded">
              <h3 className="text-base font-black text-black leading-snug">
                "{activePoll.question}"
              </h3>
              <div className="text-[11px] font-bold text-gray-600 mt-1 flex items-center justify-between">
                <span>Toplam Oy: {totalVotes}</span>
                {myVote !== undefined && (
                  <span className="text-green-700 font-black">✓ Oyunuz Kaydedildi</span>
                )}
              </div>
            </div>

            {/* Options List with Progress Bars */}
            <div className="space-y-2.5">
              {activePoll.options.map((opt, idx) => {
                const count = optionCounts[idx] || 0;
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const isSelected = myVote === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={activePoll.isClosed}
                    onClick={() => handleVote(idx)}
                    className={`w-full relative overflow-hidden text-left p-3 brutal-border border-2 rounded transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FEF08A] shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-0.5"
                        : "bg-white hover:bg-gray-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                    }`}
                  >
                    {/* Live Progress Bar Background */}
                    <div
                      className="absolute inset-y-0 left-0 bg-[#4ADE80]/30 transition-all duration-500 pointer-events-none"
                      style={{ width: `${percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center font-black text-xs bg-white shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="font-bold text-sm text-black">{opt}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-black">%{percentage}</span>
                        <span className="text-[10px] text-gray-500 block font-bold">({count} oy)</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t-2 border-black">
              {activePoll.creatorId === currentUserId && !activePoll.isClosed ? (
                <Button
                  onClick={handleClosePoll}
                  size="sm"
                  className="bg-black hover:bg-gray-800 text-white font-black uppercase text-xs brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
                >
                  Anketi Sonuçlandır
                </Button>
              ) : (
                <span className="text-xs text-gray-500 font-bold">
                  {activePoll.isClosed ? "Oylama tamamlandı" : "Oylama devam ediyor..."}
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
          </div>
        ) : (
          /* CREATE POLL VIEW */
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-black block mb-1">
                Anket Sorusu
              </label>
              <Input
                placeholder="Örn: Hafta sonu hangi oyunu oynayalım?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-black block mb-1">
                Seçenekler (En Az 2, En Çok 4)
              </label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full border border-black flex items-center justify-center font-black text-xs bg-[#FEF08A] shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <Input
                      placeholder={`Şık ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(e.target.value, idx)}
                      className="brutal-border border-2 shadow-[1px_1px_0_0_rgba(0,0,0,1)] font-medium text-sm flex-1"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 border-2 border-black hover:bg-red-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-2 text-xs font-black text-black flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Yeni Seçenek Ekle
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-black">
              <Button
                variant="outline"
                onClick={onClose}
                className="font-black text-xs brutal-border border-2 bg-white hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
              >
                İptal
              </Button>
              <Button
                onClick={handleCreatePoll}
                disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
                className="bg-[#4ADE80] hover:bg-[#22C55E] text-black font-black uppercase text-xs brutal-border border-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)] cursor-pointer"
              >
                Anketi Başlat 🚀
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
