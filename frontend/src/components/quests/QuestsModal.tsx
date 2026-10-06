"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DAILY_QUESTS,
  WEEKLY_QUESTS,
  Quest,
  QuestFrequency,
  getClaimedQuests,
  claimQuestReward,
  getQuestProgress,
  isQuestCompleted,
  canClaimReward,
  getTimeUntilDailyReset,
  getTimeUntilWeeklyReset,
} from "@/data/dailyQuests";
import {
  Target,
  Calendar,
  Trophy,
  ShoppingBag,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Award,
  X,
} from "lucide-react";

interface QuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: QuestFrequency;
}

export function QuestsModal({ isOpen, onClose, defaultTab = "daily" }: QuestsModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<QuestFrequency>(defaultTab);
  const [dailyClaimed, setDailyClaimed] = useState<string[]>([]);
  const [weeklyClaimed, setWeeklyClaimed] = useState<string[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [coins, setCoins] = useState<number>(user?.coins ?? 0);
  const [timerTick, setTimerTick] = useState(0);
  const [progressTick, setProgressTick] = useState(0);

  // Sync wallet coins
  useEffect(() => {
    if (user?.coins !== undefined) {
      setCoins(user.coins);
    }
  }, [user?.coins]);

  // Sync claimed states & progress
  const refreshClaimedStates = useCallback(() => {
    setDailyClaimed(getClaimedQuests("daily"));
    setWeeklyClaimed(getClaimedQuests("weekly"));
    setProgressTick((t) => t + 1);
  }, []);

  // Modal lifecycle: keyboard ESC, body overflow, and 1-second interval
  useEffect(() => {
    if (!isOpen) return;

    refreshClaimedStates();

    // Prevent body scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // ESC key closes modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    // 1-second tick for countdown
    const interval = setInterval(() => {
      setTimerTick((t) => (t + 1) % 100000);
    }, 1000);

    const handleClaimedEvent = (e: any) => {
      if (e.detail?.coins !== undefined) {
        setCoins(e.detail.coins);
      }
      refreshClaimedStates();
    };

    const handleCoinsUpdated = (e: any) => {
      if (e.detail?.coins !== undefined) {
        setCoins(e.detail.coins);
      }
    };

    const handleProgressUpdated = () => {
      refreshClaimedStates();
    };

    window.addEventListener("lobby:quest_claimed", handleClaimedEvent);
    window.addEventListener("lobby:coins_updated", handleCoinsUpdated);
    window.addEventListener("lobby:quest_progress_updated", handleProgressUpdated);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
      window.removeEventListener("lobby:quest_claimed", handleClaimedEvent);
      window.removeEventListener("lobby:coins_updated", handleCoinsUpdated);
      window.removeEventListener("lobby:quest_progress_updated", handleProgressUpdated);
    };
  }, [isOpen, onClose, refreshClaimedStates]);

  // Fast countdown formatting
  const dailyTimer = useMemo(() => getTimeUntilDailyReset().formatted, [timerTick]);
  const weeklyTimer = useMemo(() => getTimeUntilWeeklyReset().formatted, [timerTick]);

  const handleClaim = async (quest: Quest) => {
    if (!canClaimReward(quest)) return;
    setClaimingId(quest.id);
    try {
      const newBalance = await claimQuestReward(quest);
      if (newBalance !== null) {
        setCoins(newBalance);
      }
      refreshClaimedStates();
    } catch (err) {
      console.error("Failed to claim quest reward:", err);
    } finally {
      setClaimingId(null);
    }
  };

  const handleGoToShop = () => {
    onClose();
    router.push("/shop");
  };

  const activeQuests = activeTab === "daily" ? DAILY_QUESTS : WEEKLY_QUESTS;
  const claimedIds = activeTab === "daily" ? dailyClaimed : weeklyClaimed;
  const completedCount = activeQuests.filter(
    (q) => isQuestCompleted(q) || claimedIds.includes(q.id)
  ).length;
  const totalCount = activeQuests.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalPossibleReward = useMemo(
    () => activeQuests.reduce((sum, q) => sum + q.rewardCoins, 0),
    [activeQuests]
  );
  const earnedReward = useMemo(
    () =>
      activeQuests
        .filter((q) => claimedIds.includes(q.id))
        .reduce((sum, q) => sum + q.rewardCoins, 0),
    [activeQuests, claimedIds]
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Sohbet":
        return "bg-[#E0F2FE] text-[#0369A1] border-[#0284C7]";
      case "Oyun":
        return "bg-[#F3E8FF] text-[#7E22CE] border-[#9333EA]";
      case "Topluluk":
        return "bg-[#DCFCE7] text-[#15803D] border-[#16A34A]";
      case "AI":
        return "bg-[#FEF3C7] text-[#B45309] border-[#D97706]";
      case "Liderlik":
        return "bg-[#FFE4E6] text-[#BE123C] border-[#E11D48]";
      default:
        return "bg-gray-100 text-black border-black";
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl bg-white border-4 border-black brutal-shadow overflow-hidden max-h-[90vh] flex flex-col relative"
        data-slot="dialog-content"
      >
        {/* Top-Right Quick Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Kapat"
          className="absolute top-3.5 right-3.5 w-8 h-8 bg-white hover:bg-black hover:text-white border-2 border-black flex items-center justify-center font-black transition-colors shadow-[2px_2px_0_0_#000] cursor-pointer z-30"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Coin Wallet Banner */}
        <div className="bg-[#FEF08A] p-4 sm:p-5 border-b-4 border-black relative shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black text-[#FEF08A] text-[10px] font-black uppercase tracking-wider mb-1 shadow-[2px_2px_0_0_rgba(0,0,0,0.4)]">
                <Target className="w-3.5 h-3.5" />
                Ödül & Seviye Merkezi
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                Görevler & Ödüller
              </h2>
              <p className="text-xs font-bold text-gray-800 mt-0.5">
                Hedefleri tamamla, Lobby Coin (🪙) topla ve Mağaza'da harca!
              </p>
            </div>

            {/* Live Wallet Pill */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <div
                className="bg-white border-2.5 border-black px-3 py-1.5 brutal-shadow flex items-center gap-2"
                data-testid="modal-wallet-pill"
              >
                <span className="text-lg">🪙</span>
                <div>
                  <span className="block text-[9px] font-black uppercase text-gray-500 leading-none">
                    Cüzdanım
                  </span>
                  <span className="text-base font-black text-black leading-tight">
                    {coins.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls & Countdowns */}
        <div className="bg-[#FAF8F0] border-b-4 border-black p-2.5 sm:px-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("daily")}
              data-testid="tab-daily-quests"
              className={`px-3 py-1.5 font-black text-xs uppercase border-2 border-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "daily"
                  ? "bg-black text-white brutal-shadow -translate-y-0.5"
                  : "bg-white text-black hover:bg-[#FEF08A] shadow-[2px_2px_0_0_#000]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Günlük Görevler</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono border ${
                  activeTab === "daily"
                    ? "bg-[#FEF08A] text-black border-black"
                    : "bg-black text-white border-black"
                }`}
              >
                {dailyClaimed.length}/{DAILY_QUESTS.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("weekly")}
              data-testid="tab-weekly-quests"
              className={`px-3 py-1.5 font-black text-xs uppercase border-2 border-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "weekly"
                  ? "bg-black text-white brutal-shadow -translate-y-0.5"
                  : "bg-white text-black hover:bg-[#FEF08A] shadow-[2px_2px_0_0_#000]"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Haftalık Görevler</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono border ${
                  activeTab === "weekly"
                    ? "bg-[#FEF08A] text-black border-black"
                    : "bg-black text-white border-black"
                }`}
              >
                {weeklyClaimed.length}/{WEEKLY_QUESTS.length}
              </span>
            </button>
          </div>

          {/* Reset countdown indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 bg-white border-2 border-black px-2.5 py-1 shadow-[2px_2px_0_0_#000] self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-black animate-pulse" />
            <span>
              {activeTab === "daily" ? (
                <>
                  Gece 00:00'da sıfırlanır:{" "}
                  <strong className="font-mono text-black">{dailyTimer}</strong>
                </>
              ) : (
                <>
                  Pazartesi sıfırlanır:{" "}
                  <strong className="font-mono text-black">{weeklyTimer}</strong>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-[#FFFDF5]">
          {/* Progress summary banner */}
          <div className="p-3.5 bg-white border-3 border-black shadow-[3px_3px_0_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="space-y-1 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FB923C]" />
                <span className="font-black text-xs uppercase text-black">
                  {activeTab === "daily" ? "Günün Başarı İlerlemesi" : "Haftanın Büyük İlerlemesi"}
                </span>
                <span className="font-mono text-xs font-black text-black">
                  ({progressPercent}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full sm:w-60 h-3 bg-gray-200 border-2 border-black overflow-hidden relative">
                <div
                  className="h-full bg-[#4ADE80] transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="text-right self-end sm:self-auto">
              <span className="text-[10px] font-black uppercase text-gray-500 block">
                Toplanan Ödül
              </span>
              <span className="font-mono font-black text-sm text-black">
                {earnedReward} / {totalPossibleReward} 🪙
              </span>
            </div>
          </div>

          {/* Quests List */}
          <div className="space-y-2.5">
            {activeQuests.map((quest) => {
              const progress = getQuestProgress(quest.id, quest.frequency);
              const isComplete = isQuestCompleted(quest);
              const isClaimed = claimedIds.includes(quest.id);
              const canClaim = isComplete && !isClaimed;
              const progressRatio = Math.min(quest.targetCount, progress);
              const percent = Math.min(100, Math.round((progressRatio / quest.targetCount) * 100));
              const isBusy = claimingId === quest.id;

              return (
                <div
                  key={quest.id}
                  data-testid={`quest-card-${quest.id}`}
                  className={`p-3.5 border-3 border-black transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isClaimed
                      ? "bg-[#DCFCE7]/40 border-black opacity-90"
                      : isComplete
                      ? "bg-[#FEF9C3]/50 border-black shadow-[3px_3px_0_0_#000]"
                      : "bg-white shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000]"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Emoji icon container */}
                    <div className="w-11 h-11 bg-[#FAF8F0] border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0_0_#000] shrink-0">
                      {isClaimed ? "✅" : quest.icon}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-black uppercase border ${getCategoryColor(
                            quest.category
                          )}`}
                        >
                          {quest.category}
                        </span>
                        <h4 className="font-black text-sm uppercase text-black truncate">
                          {quest.title}
                        </h4>
                      </div>
                      <p className="text-xs font-semibold text-gray-600 leading-snug">
                        {quest.description}
                      </p>

                      {/* Progress Bar & Status */}
                      <div className="pt-1 flex items-center gap-2.5">
                        <div className="w-28 sm:w-40 h-2.5 bg-gray-200 border-1.5 border-black overflow-hidden relative">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isClaimed
                                ? "bg-[#4ADE80]"
                                : isComplete
                                ? "bg-[#22C55E]"
                                : "bg-[#3B82F6]"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-black text-black">
                          {progressRatio} / {quest.targetCount} ({percent}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reward & Claim Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t-2 sm:border-t-0 border-gray-100">
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#FEF08A] border-2 border-black shadow-[1.5px_1.5px_0_0_#000]">
                      <span className="font-black text-xs text-black">+{quest.rewardCoins}</span>
                      <span className="text-xs">🪙</span>
                    </div>

                    {isClaimed ? (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#4ADE80] border-2 border-black text-black font-black text-xs shadow-[2px_2px_0_0_#000]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                        Alındı
                      </div>
                    ) : canClaim ? (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleClaim(quest)}
                        data-testid={`claim-quest-${quest.id}`}
                        className="bg-[#4ADE80] hover:bg-[#22c55e] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer uppercase py-1 px-3 animate-pulse"
                      >
                        {isBusy ? "İşleniyor..." : "Ödülü Al 🎁"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={true}
                        data-testid={`claim-quest-${quest.id}`}
                        className="bg-gray-100 text-gray-500 font-bold text-xs border-2 border-gray-400 shadow-none uppercase py-1 px-2.5 cursor-not-allowed opacity-80"
                        title={`Görevi tamamlayın: ${progressRatio}/${quest.targetCount}`}
                      >
                        Devam Ediyor ({progressRatio}/{quest.targetCount})
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAF8F0] p-3 sm:p-4 border-t-4 border-black flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
            <Award className="w-4 h-4 text-black shrink-0" />
            <span>Coin'lerinle mağazadan özel avatar çerçeveleri ve rozetler alabilirsin.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToShop}
              className="bg-[#FEF08A] hover:bg-[#FDE047] text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1" />
              Mağazaya Git
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="border-2 border-black hover:bg-black/10 font-black text-xs uppercase"
            >
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
