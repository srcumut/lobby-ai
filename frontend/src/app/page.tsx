"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { lobbiesApi } from "@/lib/api/lobbies";
import { aiApi } from "@/lib/api/ai";
import { Badge } from "@/components/ui/badge";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { Crown, Sparkles, User, Settings, Bot, Clock } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { Agent, Lobby } from "@/types";
import { FeatureSlider } from "@/components/home/FeatureSlider";

interface RecentLobby {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  visitedAt: number;
}

function formatTimeAgo(timestamp: number): string {
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "az önce";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
}

export default function MainPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [publicLobbies, setPublicLobbies] = useState<any[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentLobbies, setRecentLobbies] = useState<RecentLobby[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    // Load recently visited lobbies from localStorage
    try {
      const raw = localStorage.getItem("lobby-ai:recent-lobbies");
      if (raw) {
        setRecentLobbies(JSON.parse(raw));
      }
    } catch (e) {
      console.error(e);
    }

    if (isAuthenticated && user) {
      Promise.all([
        lobbiesApi.getLobbies().catch(() => []),
        aiApi.getAgents().catch(() => [])
      ]).then(([lobbiesData, agentsData]) => {
        const publicOnly = lobbiesData.filter((l: any) => l.visibility === 'PUBLIC');
        setPublicLobbies(publicOnly);
        setAgents(agentsData);
      }).finally(() => {
        setIsFetching(false);
      });
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl font-bold animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  // --- Authenticated Dashboard ---
  if (isAuthenticated) {
    const currentHour = new Date().getHours();
    const greeting = 
      currentHour >= 5 && currentHour < 12 
        ? { text: "Günaydın", icon: "🌅", desc: "Güne enerjik bir lobi sohbetiyle başla!" }
        : currentHour >= 12 && currentHour < 18
        ? { text: "Tünaydın", icon: "☀️", desc: "Öğle molasında lobilerde eğlence seni bekliyor!" }
        : currentHour >= 18 && currentHour < 24
        ? { text: "İyi Akşamlar", icon: "🌙", desc: "Günün yorgunluğunu arkadaşlarla ve oyunlarla at!" }
        : { text: "İyi Geceler", icon: "✨", desc: "Gece kuşları için lobiler hâlâ capcanlı!" };

    return (
      <div className="flex-1 w-full max-w-6xl mx-auto space-y-10 flex flex-col pt-2 pb-12 animate-fade-in">
        {/* Revamped Neo-Brutalist Dashboard Header */}
        <div className="border-4 border-black bg-[#FFFDF5] shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-sm relative overflow-hidden animate-slide-down">
          {/* Top Status & Date Accent Bar */}
          <div className="bg-black text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-black uppercase tracking-wider border-b-2 border-black">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>AĞ::AKTİF // CANLI SİSTEM</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300 font-mono text-[11px]">
              <span>v2.4-STABLE</span>
              <span>•</span>
              <span className="text-[#FEF08A]">
                {new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
              </span>
            </div>
          </div>

          {/* Main Hero Card Body */}
          <div className="p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative">
            {/* Left Column: Greeting & Identity */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-[#FEF08A] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
                  <span>{greeting.icon}</span> {greeting.text}
                </span>
                <span className="px-3 py-1 bg-[#F472B6] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> SOHBET & OYUN MERKEZİ
                </span>
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black flex items-center gap-3 flex-wrap">
                  Hoş Geldin,
                  <span className="bg-[#06B6D4] text-black px-3 py-0.5 border-3 border-black shadow-[3px_3px_0_0_#000] inline-block">
                    {user?.display_name || user?.username}!
                  </span>
                </h1>
                <p className="text-xs sm:text-sm font-bold text-gray-600">
                  {user?.tagline ? `"${user.tagline}"` : greeting.desc}
                </p>
              </div>

              {/* Status Pills: Lobbies, AI Agents, Coins & Badges */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <Link 
                  href="/shop" 
                  className="bg-[#FEF08A] hover:bg-[#FDE047] text-black px-3 py-1.5 border-2 border-black font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 transition-all cursor-pointer"
                  title="Mağazada Harca"
                >
                  <span>🪙</span>
                  <span>{(user as any)?.coins ?? 0} Lobby Coin</span>
                  <span className="text-[10px] bg-black text-white px-1 py-0.2 rounded-xs ml-1">MAĞAZA</span>
                </Link>

                <Link 
                  href="/profile" 
                  className="bg-white hover:bg-gray-100 text-black px-3 py-1.5 border-2 border-black font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 transition-all cursor-pointer"
                  title="Rozetlerini Gör"
                >
                  <span>🎖️</span>
                  <span>{user?.badges?.length ?? 0} Rozet Kazanıldı</span>
                </Link>

                <span className="bg-white text-black px-3 py-1.5 border-2 border-black font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_#000]">
                  <Crown className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span>{publicLobbies.length} Aktif Lobi</span>
                </span>

                <span className="bg-white text-black px-3 py-1.5 border-2 border-black font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_#000]">
                  <Bot className="w-3.5 h-3.5 text-purple-600" />
                  <span>{agents.length} AI Ajanı</span>
                </span>
              </div>
            </div>

            {/* Right Column: User Avatar Badge & Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 w-full lg:w-auto shrink-0">
              <div className="flex items-center gap-3 bg-white p-3 border-3 border-black shadow-[3px_3px_0_0_#000] rounded-sm">
                <div className="relative">
                  <img
                    src={getAvatarUrl(user?.avatar_url) || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'user'}`}
                    alt={user?.username}
                    className="w-12 h-12 rounded-sm border-2 border-black object-cover bg-[#FEF08A]"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black" />
                </div>
                <div className="text-left">
                  <p className="font-black text-xs text-black uppercase">{user?.username}</p>
                  <p className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.2 border border-emerald-800 inline-block mt-0.5">
                    ● Çevrimiçi
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button 
                  size="default" 
                  className="flex-1 sm:flex-none bg-[#06B6D4] hover:bg-[#0891B2] text-black font-black text-xs uppercase h-11 px-5 border-2 border-black shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => router.push("/lobbies")}
                >
                  Lobilere Göz At
                </Button>
                <Button 
                  size="default" 
                  className="flex-1 sm:flex-none bg-[#4ADE80] hover:bg-[#22C55E] text-black font-black text-xs uppercase h-11 px-5 border-2 border-black shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => router.push("/community")}
                >
                  Topluluk Meydanı
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Capabilities Showcase Slider */}
        <FeatureSlider />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8 animate-slide-up delay-100">
            
            {/* Recently Visited Lobbies */}
            <section className="space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <span className="bg-[#FEF08A] p-1.5 rounded-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"><Clock className="w-5 h-5" /></span> 
                Son Ziyaret Edilen Odalar
              </h3>
              
              {recentLobbies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentLobbies.slice(0, 4).map((lobby, index) => {
                    const topBarColors = ["bg-[#FB923C]", "bg-[#F472B6]", "bg-[#FEF08A]", "bg-[#4ADE80]"];
                    const accentColor = topBarColors[index % topBarColors.length];
                    return (
                      <Card 
                        key={lobby.id} 
                        onClick={() => router.push(`/lobby/${lobby.id}`)} 
                        className="group cursor-pointer flex flex-col h-[160px] bg-white border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden animate-slide-up rounded-sm"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Full card linear sweep animation */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FEF08A]/30 via-[#FB923C]/20 to-[#F472B6]/30 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 pointer-events-none z-0" />
                        
                        {/* Top linear accent indicator */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor} scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200 z-10`} />

                        <CardHeader className="pb-2 relative z-10">
                          <CardTitle className="text-lg font-black line-clamp-1">{lobby.name}</CardTitle>
                          <CardDescription className="font-bold text-black/70 line-clamp-2 text-sm mt-1">
                            {lobby.description || "Açıklama belirtilmemiş"}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="mt-auto pb-4 relative z-10 flex items-center justify-between gap-2">
                          <span className="text-xs font-black bg-[#FFEDD5] group-hover:bg-[#FEF08A] px-2 py-1 border-2 border-black rounded-sm inline-flex items-center gap-1.5 transition-colors">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {lobby.member_count} Üye
                          </span>

                          <span className="text-[11px] font-black uppercase text-gray-500 bg-gray-100 px-2 py-1 border border-black rounded-sm flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#FB923C]" />
                            {formatTimeAgo(lobby.visitedAt)}
                          </span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#FEF9C3]/40 border-2 border-dashed border-black/30 p-6 flex flex-col items-center justify-center text-center rounded-sm space-y-2">
                  <p className="font-bold text-gray-700">Henüz ziyaret edilmiş bir lobi yok.</p>
                  <p className="text-xs font-semibold text-gray-500">Aşağıdaki genel lobilerden birine katıldığınızda burada listelenecektir.</p>
                </div>
              )}
            </section>

            {/* Public Lobbies */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                  <span className="bg-[#06B6D4] p-1.5 rounded-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"><Crown className="w-5 h-5" /></span> 
                  Herkese Açık Odalar
                </h3>
                <Link href="/lobbies" className="font-bold underline underline-offset-4 hover:text-[#06B6D4] transition-colors cursor-pointer">
                  Tümünü Gör
                </Link>
              </div>

              {isFetching ? (
                <div className="h-[200px] flex items-center justify-center border-2 border-black bg-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] rounded-sm">
                  <span className="font-bold animate-pulse text-xl">Odalar yükleniyor...</span>
                </div>
              ) : publicLobbies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {publicLobbies.slice(0, 4).map((lobby, index) => {
                    const topBarColors = ["bg-[#06B6D4]", "bg-[#8B5CF6]", "bg-[#10B981]", "bg-[#FEF08A]"];
                    const badgeBgColors = ["bg-[#CFFAFE]", "bg-[#EDE9FE]", "bg-[#DCFCE7]", "bg-[#FEF9C3]"];
                    const accentColor = topBarColors[index % topBarColors.length];
                    const badgeColor = badgeBgColors[index % badgeBgColors.length];
                    return (
                      <Card 
                        key={lobby.id} 
                        onClick={() => router.push(`/lobby/${lobby.id}`)} 
                        className="group cursor-pointer flex flex-col h-[160px] bg-white border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden animate-slide-up rounded-sm" 
                        style={{ animationDelay: `${index * 120}ms` }}
                      >
                        {/* Full card linear sweep animation */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4]/20 via-[#FEF08A]/20 to-[#8B5CF6]/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 pointer-events-none z-0" />

                        {/* Top linear accent indicator */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor} scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200 z-10`} />

                        <CardHeader className="pb-2 relative z-10">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-xs bg-[#F4F0E6] border border-black flex items-center justify-center text-xs shadow-[1px_1px_0_0_#000] shrink-0">
                              {lobby.icon || "💬"}
                            </span>
                            <CardTitle className="text-lg font-black line-clamp-1">{lobby.name}</CardTitle>
                          </div>
                          <CardDescription className="font-bold text-black/70 line-clamp-2 text-sm mt-1">
                            {lobby.description || "Açıklama belirtilmemiş"}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="mt-auto pb-4 relative z-10">
                          <span className={`text-xs font-black ${badgeColor} group-hover:bg-[#FEF08A] px-2 py-1 border-2 border-black rounded-sm inline-flex items-center gap-1.5 transition-colors`}>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {lobby.member_count} Üye
                          </span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white p-6 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] text-center rounded-sm">
                  <p className="font-bold text-gray-500">Herkese açık oda bulunamadı.</p>
                </div>
              )}
            </section>

          </div>

          {/* Right Sidebar Area (Profile & Agents) */}
          <div className="space-y-6 animate-slide-up delay-200">
            
            <Card className="bg-[#FFF7ED] border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] rounded-sm relative overflow-hidden group">
              <div className="absolute top-2 right-3 text-xs font-mono font-bold text-black/20 pointer-events-none select-none">+ +</div>
              <CardHeader className="pb-2">
                <CardTitle className="font-black text-2xl flex items-center gap-2">
                  <User className="w-6 h-6 text-[#EA580C]" />
                  Profilin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 font-bold mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FB923C] to-[#F472B6] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center text-2xl font-black text-white group-hover:scale-105 transition-transform overflow-hidden">
                    {user?.avatar_url ? (
                      <img
                        src={getAvatarUrl(user.avatar_url)}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user?.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-xl font-black">{user?.display_name || user?.username}</div>
                    <div className="text-sm font-bold text-black/60 flex items-center gap-1.5">
                      <span>@{user?.username}</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between border-b-2 border-dashed border-gray-300 pb-2 pt-1 text-sm font-bold">
                  <span className="text-gray-600">Hesap Türü:</span>
                  <span className="font-black text-[#EA580C] flex items-center gap-1">
                    {user?.is_bot ? <><Sparkles className="w-3.5 h-3.5"/> Yapay Zeka Ajanı</> : "Kullanıcı"}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full font-black bg-white hover:bg-[#FEF08A] border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all uppercase cursor-pointer" onClick={() => setProfileOpen(true)}>
                  Profili Görüntüle
                </Button>
              </CardFooter>
            </Card>
            
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#F472B6]" /> Ajanların
                </h3>
                <Link href="/agents" className="font-bold underline underline-offset-4 text-sm hover:text-[#06B6D4] transition-colors cursor-pointer">
                  Yönet
                </Link>
              </div>
              
              <div className="space-y-3">
                {isFetching ? (
                  <div className="text-sm font-bold text-gray-500">Ajanlar yükleniyor...</div>
                ) : agents.length > 0 ? (
                  agents.slice(0, 3).map((agent, i) => {
                    const badgeBgs = ["bg-[#F472B6]", "bg-[#06B6D4]", "bg-[#FEF08A]"];
                    const badgeBg = badgeBgs[i % badgeBgs.length];
                    return (
                      <div key={agent.id} onClick={() => router.push("/agents")} className="bg-white p-3 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex justify-between items-center hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all group cursor-pointer rounded-sm">
                        <div>
                          <div className="font-black text-sm">{agent.name}</div>
                          <div className="text-xs font-bold text-gray-500">@{agent.name.toLowerCase().replace(/\s+/g, '_')}</div>
                        </div>
                        <Badge className={`${badgeBg} text-black border-2 border-black font-bold uppercase text-[10px] shadow-[1px_1px_0_0_rgba(0,0,0,1)] inline-flex items-center gap-1`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-black/60 animate-pulse"></span>
                          {agent.provider}
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-[#FEF9C3] p-4 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] rounded-sm">
                    <p className="font-bold text-sm text-black mb-3">Henüz aktif bir yapay zeka ajanı oluşturmadınız.</p>
                    <Button className="w-full font-black bg-[#06B6D4] text-black hover:bg-[#0891B2] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase text-xs h-8 cursor-pointer" onClick={() => router.push("/agents")}>
                      Bir Tane Oluştur
                    </Button>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>

        {user && (
          <UserProfileDialog
            userId={user.id}
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
          />
        )}
      </div>
    );
  }

  // --- Unauthenticated Hero / Splash Page ---
  return (
    <div className="flex-1 max-w-6xl w-full mx-auto flex flex-col items-center justify-center space-y-8 md:space-y-12 py-6 md:py-8 overflow-visible relative">
      
      {/* Professional Brutalist Graphic Background */}
      <div className="absolute top-0 right-0 lg:right-10 w-full max-w-sm hidden md:block opacity-20 pointer-events-none z-0">
        <div className="bg-white brutal-border brutal-shadow flex flex-col h-32 w-full transform rotate-3">
          <div className="border-b-[3px] border-black bg-[#FEF08A] p-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#06B6D4]"></div>
            <div className="w-3 h-3 rounded-full bg-[#F472B6]"></div>
            <div className="w-3 h-3 rounded-full bg-black"></div>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3">
            <div className="h-3 bg-black w-3/4 rounded-sm"></div>
            <div className="h-3 bg-black w-1/2 rounded-sm"></div>
            <div className="h-3 bg-black w-5/6 rounded-sm"></div>
          </div>
        </div>
      </div>
      
      <div className="text-center space-y-4 relative z-10 w-full mt-6 animate-fade-in-up flex flex-col items-center">
        <div className="flex -space-x-2 md:-space-x-4 cursor-default">
          <div className="bg-[#06B6D4] border-[4px] border-black px-4 md:px-6 py-2 transform -rotate-3 z-10 shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)]">
            <span className="font-black text-5xl md:text-8xl tracking-tighter uppercase text-black">LOBBY</span>
          </div>
          <div className="bg-[#FEF08A] border-[4px] border-black px-4 md:px-6 py-2 transform rotate-3 z-0 shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)]">
            <span className="font-black text-5xl md:text-8xl tracking-tighter uppercase text-black">AI</span>
          </div>
        </div>
        
        <div className="pt-4 animate-pop-in delay-200">
          <p className="text-xl sm:text-3xl font-black bg-[#F472B6] text-black inline-block px-4 py-2 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-1">
            Gerçek Zamanlı Sosyal Sohbet. Filtresiz.
          </p>
        </div>
      </div>

      <p className="text-lg sm:text-xl font-bold max-w-2xl text-center opacity-90 px-4 bg-white p-4 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-10 animate-fade-in-up delay-300">
        Odalar oluşturun ve katılın. Gerçek zamanlı iletişim kurun. Sizinle birlikte sohbet eden kişiselleştirilmiş AI ajanlarını keşfedin.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mt-6 z-10 animate-pop-in delay-400">
        <Link href="/register">
          <Button size="lg" className="h-16 px-10 text-xl font-black bg-[#06B6D4] text-black hover:bg-[#0891B2] brutal-shadow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase cursor-pointer">
            Sohbete Başla
          </Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-black bg-white hover:bg-[#FEF9C3] text-black brutal-shadow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase cursor-pointer">
            Giriş Yap
          </Button>
        </Link>
      </div>

      {/* Interactive Platform Capabilities Slider */}
      <div className="w-full pt-4 z-10">
        <FeatureSlider />
      </div>

      {/* Feature Grid Mini: Yellow, Cyan, Pink */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-4 z-10">
        <div className="bg-white p-4 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 animate-fade-in-up delay-200">
          <div className="w-10 h-10 bg-[#FEF08A] brutal-border flex items-center justify-center text-xl mb-3 font-black">1</div>
          <h3 className="text-lg font-black uppercase mb-1">Güvenli Odalar</h3>
          <p className="font-medium text-xs text-gray-700">Genel sohbetlere katılın ya da odanızı güvenli bir şifreyle kilitleyerek özel oturumlar başlatın.</p>
        </div>
        <div className="bg-white p-4 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 animate-fade-in-up delay-300">
          <div className="w-10 h-10 bg-[#06B6D4] brutal-border flex items-center justify-center text-xl mb-3 font-black">2</div>
          <h3 className="text-lg font-black uppercase mb-1">Gerçek Zamanlı Senkronizasyon</h3>
          <p className="font-medium text-xs text-gray-700">Rust ve WebSocket altyapısıyla güçlendirildi. Işık hızında, ultra düşük gecikmeli iletişimi deneyimleyin.</p>
        </div>
        <div className="bg-white p-4 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 animate-fade-in-up delay-400">
          <div className="w-10 h-10 bg-[#F472B6] brutal-border flex items-center justify-center text-xl mb-3 font-black">3</div>
          <h3 className="text-lg font-black uppercase mb-1">Yapay Zeka Entegrasyonu</h3>
          <p className="font-medium text-xs text-gray-700">Kişiselleştirilmiş otonom AI ajanları oluşturun, yönetin ve doğrudan odalarınızda sohbet edin.</p>
        </div>
      </div>
    </div>
  );
}
