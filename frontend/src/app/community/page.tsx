// ============================================================================
// TARGET_DESTINATION: frontend/src/app/community/page.tsx
// PURPOSE: Redesigned Dynamic Community Hub (Bulletin Hero, Quests, Dynamic Filter & Poll)
// ============================================================================

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { lobbiesApi } from "@/lib/api/lobbies";
import { Lobby } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { playBlipSound, playPointSound, playWinSound } from "@/lib/arcadeSounds";
import { 
  Sparkles, 
  Crown, 
  Flame, 
  Users, 
  Swords, 
  MessageSquare, 
  Shuffle, 
  CheckCircle2, 
  Trophy, 
  Compass, 
  Radio, 
  Send,
  Zap,
  Bot,
  Coffee,
  ArrowRight,
  Search,
  CheckSquare,
  Star,
  Activity,
  Layers,
  Coins
} from "lucide-react";
import { NewsSlider } from "@/components/community/NewsSlider";
import { getDailyPoll } from "@/data/polls";
import { DAILY_QUESTS, DailyQuest } from "@/data/dailyQuests";
import { awardCoins, unlockBadge } from "@/lib/badgeManager";

interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dynamic 50-poll pool
  const [dailyPoll] = useState(() => getDailyPoll());
  const [pollOptions, setPollOptions] = useState<PollOption[]>(() =>
    dailyPoll.options.map((opt, idx) => ({ id: idx + 1, text: opt, votes: 35 + (idx * 14) }))
  );
  const [userVotedId, setUserVotedId] = useState<number | null>(null);

  // Daily Quests with coin rewards
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lobby-ai:completed-quests");
      if (saved) setCompletedQuestIds(JSON.parse(saved));
    } catch {}
  }, []);

  const handleClaimQuest = async (quest: DailyQuest) => {
    if (completedQuestIds.includes(quest.id)) return;
    await awardCoins(quest.rewardCoins, `Görev Tamamlandı: ${quest.title}`);
    const next = [...completedQuestIds, quest.id];
    setCompletedQuestIds(next);
    localStorage.setItem("lobby-ai:completed-quests", JSON.stringify(next));
  };

  // Load saved votes from localStorage
  useEffect(() => {
    try {
      const savedVote = localStorage.getItem(`lobby-ai:poll-vote-${dailyPoll.id}`);
      if (savedVote !== null) {
        setUserVotedId(Number(savedVote));
      }
    } catch {
      // localStorage not available
    }
  }, [dailyPoll.id]);

  // Fetch Public Lobbies
  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        const list = await lobbiesApi.getLobbies();
        const publicOnly = list.filter((l) => l.visibility === "PUBLIC");
        setLobbies(publicOnly);
      } catch (err) {
        console.error("Lobbies could not be fetched", err);
      } finally {
        setIsLoadingLobbies(false);
      }
    };
    fetchLobbies();
  }, []);

  const totalVotes = pollOptions.reduce((acc, curr) => acc + curr.votes, 0);

  const handleVote = async (optionId: number) => {
    if (userVotedId !== null) {
      toast.add({
        title: "Zaten Oy Verdiniz",
        description: "Günün anketine katıldınız. Katkınız için teşekkürler!",
        type: "info"
      });
      return;
    }

    playPointSound();
    setPollOptions(prev =>
      prev.map(opt => (opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt))
    );
    setUserVotedId(optionId);
    try {
      localStorage.setItem(`lobby-ai:poll-vote-${dailyPoll.id}`, optionId.toString());
    } catch (e) {
      console.error(e);
    }

    await awardCoins(35, "Günün anketine oy kullandınız!");
    await unlockBadge("poll_voter");

    toast.add({
      title: "Oyunuz Kaydedildi! 🎉",
      description: "Günün topluluk anketine görüşünüz eklendi.",
      type: "success"
    });
  };

  // Quick Match / Teleport logic
  const handleQuickMatch = (category?: string) => {
    playWinSound();
    if (lobbies.length === 0) {
      toast.add({
        title: "Aktif Lobi Bulunamadı",
        description: "Henüz açık bir lobi yok. İlk odayı siz kurabilirsiniz!",
        type: "info"
      });
      router.push("/lobbies");
      return;
    }

    let candidateLobbies = lobbies;
    const cat = category || selectedCategory;
    if (cat && cat !== "all") {
      const filtered = lobbies.filter(l => 
        l.name.toLowerCase().includes(cat.toLowerCase()) ||
        (l.description && l.description.toLowerCase().includes(cat.toLowerCase()))
      );
      if (filtered.length > 0) {
        candidateLobbies = filtered;
      }
    }

    const randomIndex = Math.floor(Math.random() * candidateLobbies.length);
    const chosenLobby = candidateLobbies[randomIndex];

    toast.add({
      title: "Işınlanıyorsunuz! 🚀",
      description: `"${chosenLobby.name}" odasına bağlanıyorsunuz...`,
      type: "success"
    });

    setTimeout(() => {
      router.push(`/lobby/${chosenLobby.id}`);
    }, 600);
  };

  // Dynamic filter for lobbies grid
  const dynamicFilteredLobbies = useMemo(() => {
    return lobbies.filter((lobby) => {
      const matchesSearch = 
        !searchQuery.trim() ||
        lobby.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lobby.description && lobby.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = 
        selectedCategory === "all" ||
        lobby.name.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (lobby.description && lobby.description.toLowerCase().includes(selectedCategory.toLowerCase()));

      return matchesSearch && matchesCat;
    });
  }, [lobbies, searchQuery, selectedCategory]);

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto space-y-8 flex flex-col pt-2 pb-16 animate-fade-in">
      
      {/* 1. COMPLETELY REDESIGNED FIRST BLOCK: Community Bulletin & Live Dispatch Station */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Main Bulletin Card (2 Cols) */}
        <div className="lg:col-span-2 p-6 sm:p-8 bg-[#FFFDF5] border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-sm space-y-4 relative overflow-hidden">
          {/* Top Ticker Bar */}
          <div className="flex items-center justify-between border-b-2 border-black pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping inline-block" />
              <span className="font-mono text-xs font-black uppercase tracking-wider text-black bg-[#FEF08A] px-2 py-0.5 border border-black">
                CANLI YAYIN :: BÜLTEN
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1 font-mono">
                <Users className="w-3.5 h-3.5 text-black" /> {lobbies.length} Aktif Lobi
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Activity className="w-3.5 h-3.5 text-emerald-600" /> Ağ Stabil
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-black leading-none">
              TOPLULUK MEYDANI
            </h1>
            <p className="text-gray-800 font-bold text-sm sm:text-base leading-snug">
              Odaların nabzını tutun, günün anketine katılın ve modunuza göre canlı bir lobiye ışınlanın.
            </p>
          </div>

          {/* Quick Category Mood Filters (Directly alters below list) */}
          <div className="pt-2">
            <span className="text-[11px] font-black uppercase text-gray-500 block mb-2">
              Kategoriye Göre Anında Filtrele:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "Tüm Odalar", icon: <Layers className="w-3.5 h-3.5" /> },
                { id: "sohbet", label: "💬 Sohbet & Tanışma", icon: <MessageSquare className="w-3.5 h-3.5" /> },
                { id: "oyun", label: "⚔️ Düello & Oyun", icon: <Swords className="w-3.5 h-3.5" /> },
                { id: "ai", label: "🤖 Yapay Zeka", icon: <Bot className="w-3.5 h-3.5" /> },
                { id: "chill", label: "☕ Sakin & Chill", icon: <Coffee className="w-3.5 h-3.5" /> },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      playBlipSound();
                      setSelectedCategory(cat.id);
                    }}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-black text-xs uppercase transition-all rounded-xs cursor-pointer
                      ${isSelected 
                        ? "bg-black text-white shadow-[2px_2px_0_0_rgba(255,255,255,1)] translate-x-0.5" 
                        : "bg-white text-black hover:bg-[#FEF08A] shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-px"}
                    `}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Teleport Portal Card (1 Col) */}
        <div className="p-6 bg-[#FEF08A] border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-black text-[#FEF08A] px-2.5 py-1 text-[10px] font-black uppercase">
              <Zap className="w-3.5 h-3.5 text-[#FEF08A]" /> HIZLI IŞINLAYICI
            </div>
            <h3 className="font-black text-2xl uppercase tracking-tight text-black leading-tight">
              Rastgele Bir Lobiye Katıl
            </h3>
            <p className="text-xs font-bold text-black/80 leading-relaxed">
              Kararsız mısın? Tek tıkla açık ve hareketli bir odaya anında ışınlan, yeni insanlarla tanış!
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              onClick={() => handleQuickMatch()}
              size="lg"
              className="w-full h-12 bg-black hover:bg-neutral-800 text-white font-black text-xs uppercase border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Shuffle className="w-4 h-4 animate-spin [animation-duration:8s]" />
              Hemen Işınlan
            </Button>
            <Link href="/lobbies" className="block">
              <Button
                variant="outline"
                className="w-full bg-white hover:bg-gray-100 text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
              >
                Yeni Oda Aç
              </Button>
            </Link>
          </div>
        </div>

      </div>

      {/* 2. Main Content Grid: Daily Poll & Quests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Community Daily Pulse & Poll */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dynamic Daily Poll */}
          <div className="p-6 bg-[#FFFDF5] border-3 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-sm space-y-5">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#F472B6] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <Flame className="w-4 h-4 text-black" />
                </span>
                <h2 className="font-black text-xl uppercase tracking-tight text-black">
                  Günün Tartışması & Topluluk Anketi
                </h2>
              </div>
              <Badge className="bg-black text-[#FEF08A] font-black text-[10px] border border-black uppercase tracking-wider">
                GÜNLÜK NABIZ
              </Badge>
            </div>

            <div className="bg-[#FEF08A]/60 p-4 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-wider">
                  {dailyPoll.category}
                </span>
                <span className="text-[10px] font-bold text-gray-700">Günün Konusu #{dailyPoll.id}</span>
              </div>
              <p className="font-black text-base sm:text-lg text-black">
                "{dailyPoll.question}"
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/30 text-xs font-bold text-black/80">
                <span>Toplam Katılım: {totalVotes} Oy</span>
                {userVotedId !== null && (
                  <span className="flex items-center gap-1 text-emerald-800 font-black">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Oyunuz Kaydedildi (+35 🪙)
                  </span>
                )}
              </div>
            </div>

            {/* Poll Options */}
            <div className="space-y-3">
              {pollOptions.map((opt, index) => {
                const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                const isSelected = userVotedId === opt.id;
                const colors = ["bg-[#FB923C]", "bg-[#4ADE80]", "bg-[#60A5FA]", "bg-[#F472B6]"];
                const barColor = colors[index % colors.length];

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleVote(opt.id)}
                    className={`
                      relative p-3.5 border-2 border-black rounded-sm transition-all overflow-hidden cursor-pointer
                      ${isSelected 
                        ? "bg-black text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)]" 
                        : "bg-white hover:bg-gray-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5"}
                    `}
                  >
                    {/* Background fill bar representing percentage */}
                    <div 
                      className={`absolute left-0 top-0 bottom-0 opacity-25 ${barColor} pointer-events-none transition-all duration-700 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`
                          w-6 h-6 rounded-full border-2 border-black flex items-center justify-center font-black text-xs
                          ${isSelected ? "bg-[#FEF08A] text-black" : "bg-[#F4F0E6] text-black"}
                        `}>
                          {index + 1}
                        </span>
                        <span className={`font-black text-xs sm:text-sm ${isSelected ? "text-white" : "text-black"}`}>
                          {opt.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-black text-sm">{percentage}%</span>
                        <span className="text-[11px] font-bold opacity-75">({opt.votes})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Developer & Community News Slider */}
            <div className="mt-6 pt-5 border-t-2 border-dashed border-gray-300">
              <NewsSlider />
            </div>
          </div>

          {/* Dynamic Active Public Lobbies Feed */}
          <div className="p-6 bg-[#FFFDF5] border-3 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#4ADE80] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <Compass className="w-4 h-4 text-black" />
                </span>
                <div>
                  <h2 className="font-black text-xl uppercase tracking-tight text-black">
                    Canlı ve Öne Çıkan Lobiler
                  </h2>
                  <p className="text-xs font-bold text-gray-500">
                    Seçili kategori: <strong className="text-black uppercase">{selectedCategory}</strong> ({dynamicFilteredLobbies.length} Oda)
                  </p>
                </div>
              </div>

              {/* Live search input */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Lobi ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border-2 border-black text-xs font-bold rounded-sm focus:outline-hidden text-black"
                />
              </div>
            </div>

            {isLoadingLobbies ? (
              <div className="p-8 text-center font-bold text-sm text-gray-500 animate-pulse">
                Lobiler taranıyor...
              </div>
            ) : dynamicFilteredLobbies.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-sm space-y-2 bg-white">
                <p className="font-bold text-xs text-gray-600">Bu filtrelere uygun lobi bulunamadı.</p>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                  className="text-xs font-black uppercase underline hover:text-[#FB923C] cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {dynamicFilteredLobbies.slice(0, 6).map((lobby, index) => {
                  const colors = ["bg-[#FEF08A]", "bg-[#FB923C]", "bg-[#F472B6]", "bg-[#4ADE80]"];
                  const headerBg = colors[index % colors.length];

                  return (
                    <div 
                      key={lobby.id}
                      onClick={() => router.push(`/lobby/${lobby.id}`)}
                      className="p-4 bg-white border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer rounded-sm flex flex-col justify-between group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black ${headerBg} text-black rounded-xs`}>
                            GENEL LOBİ
                          </span>
                          <span className="flex items-center gap-1 font-mono text-xs font-bold text-gray-600">
                            <Users className="w-3.5 h-3.5 text-black" />
                            {lobby.member_count} üye
                          </span>
                        </div>
                        <h4 className="font-black text-sm uppercase group-hover:underline text-black truncate">
                          {lobby.name}
                        </h4>
                        <p className="text-xs text-gray-600 font-medium line-clamp-2">
                          {lobby.description || "Bu lobide gerçek zamanlı sohbet ve interaktif oyunlar devam ediyor."}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                          CANLI ODA
                        </span>
                        <span className="text-xs font-black uppercase text-black flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          Katıl <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Community Quests & Badges Goals (Replaces old leaderboard) */}
        <div className="space-y-6">
          
          {/* Daily Quests Widget */}
          <div className="p-6 bg-[#FFFDF5] border-3 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-sm space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#FEF08A] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <CheckSquare className="w-4 h-4 text-black" />
                </span>
                <h3 className="font-black text-base uppercase tracking-tight text-black">
                  Topluluk Görevleri & Rozetler
                </h3>
              </div>
              <Badge className="bg-black text-[#4ADE80] font-black text-[9px] border border-black uppercase">
                GÜNLÜK HEDEF
              </Badge>
            </div>

            <p className="text-xs font-bold text-gray-600">
              Görevleri tamamlayarak profilinizde sergileyebileceğiniz coinler ve rozetler kazanın:
            </p>

            {/* Quests List */}
            <div className="space-y-2.5 pt-1">
              {DAILY_QUESTS.map((quest) => {
                const isClaimed = completedQuestIds.includes(quest.id);
                return (
                  <div
                    key={quest.id}
                    className={`
                      p-3 border-2 border-black rounded-sm flex items-center justify-between gap-3 text-xs transition-all
                      ${isClaimed ? "bg-[#4ADE80]/20 border-emerald-800" : "bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]"}
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">
                        {isClaimed ? "✅" : quest.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="font-black text-black truncate leading-tight">
                          {quest.title}
                        </p>
                        <span className="text-[10px] font-bold text-gray-500">
                          Ödül: +{quest.rewardCoins} 🪙 ({quest.description})
                        </span>
                      </div>
                    </div>

                    {isClaimed ? (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase border border-black bg-[#DCFCE7] text-green-900 shrink-0">
                        Alındı
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaimQuest(quest)}
                        className="px-2 py-1 text-[9px] font-black uppercase border-2 border-black bg-[#FEF08A] hover:bg-[#FDE047] text-black shrink-0 shadow-[1px_1px_0_0_#000] active:translate-y-px cursor-pointer"
                      >
                        Tamamla
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Profile Badges Quick Link */}
            <div className="pt-2">
              <Link href="/profile" className="block">
                <Button 
                  size="sm" 
                  className="w-full bg-[#FEF08A] hover:bg-[#FDE047] text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all flex items-center justify-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-black" />
                  Rozet Koleksiyonuma Git
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Feature Guide */}
          <div className="p-5 bg-[#FFFDF5] border-3 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-sm space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FB923C]" />
              Lobi İçi Etkileşim Rehberi
            </h3>
            <ul className="text-xs font-bold space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-black">⚔️</span>
                <span><strong>RPS (Taş-Kağıt-Makas) Düelloları:</strong> Lobi sohbetinde arkadaşına veya lobi üyelerine anında meydan oku.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">🧠</span>
                <span><strong>Bilgi Yarışması (Trivia):</strong> Tüm odayı kapsayan hızlı soru-cevap yarışması başlat.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">🎲</span>
                <span><strong>Zar & Yazı-Tura:</strong> Kararsız anlarda sohbete görsel şans zarları fırlat.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">📊</span>
                <span><strong>Canlı Anketler:</strong> Odaya özel çoktan seçmeli anlık oylamalar düzenle.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
