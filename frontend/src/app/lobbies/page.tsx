"use client";

import { useEffect, useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { lobbiesApi, JoinLobbyRequest } from "@/lib/api/lobbies";
import { CreateLobbyModal } from "@/components/lobby/CreateLobbyModal";
import { Lobby } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Lock, 
  Globe, 
  Users, 
  Sparkles, 
  ArrowUpDown, 
  Plus, 
  Flame,
  Radio
} from "lucide-react";
import { FullPagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 6;

export default function LobbiesPage() {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisibility, setFilterVisibility] = useState<"ALL" | "PUBLIC" | "PRIVATE" | "POPULAR">("ALL");
  const [sortBy, setSortBy] = useState<"members" | "newest" | "name">("members");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterVisibility, sortBy]);

  // Create lobby modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Join lobby state
  const [joinLobbyId, setJoinLobbyId] = useState<string | null>(null);
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const fetchLobbies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await lobbiesApi.getLobbies();
      setLobbies(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Lobiler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLobbies();
    }
  }, [isAuthenticated]);

  const handleJoinLobby = async (lobby: Lobby, e?: React.FormEvent) => {
    e?.preventDefault();
    setJoinError(null);
    
    try {
      if (lobby.visibility === "PRIVATE" && joinLobbyId !== lobby.id) {
        setJoinLobbyId(lobby.id);
        setJoinPassword("");
        return;
      }
      
      const request: JoinLobbyRequest = {
        password: lobby.visibility === "PRIVATE" ? joinPassword : undefined,
      };
      
      await lobbiesApi.joinLobby(lobby.id, request);
      router.push(`/lobby/${lobby.id}`);
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.data?.error?.message?.includes("Already a member")) {
        router.push(`/lobby/${lobby.id}`);
      } else {
        setJoinError(err.response?.data?.error?.message || "Lobiye katılırken hata oluştu");
      }
    }
  };

  // Filter and sort lobbies
  const filteredLobbies = useMemo(() => {
    return lobbies
      .filter((lobby) => {
        const matchesQuery = 
          lobby.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lobby.description && lobby.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        if (!matchesQuery) return false;

        if (filterVisibility === "PUBLIC") return lobby.visibility === "PUBLIC";
        if (filterVisibility === "PRIVATE") return lobby.visibility === "PRIVATE";
        if (filterVisibility === "POPULAR") return lobby.member_count > 1;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "members") return b.member_count - a.member_count;
        if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [lobbies, searchQuery, filterVisibility, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLobbies.length / ITEMS_PER_PAGE) || 1;

  const paginatedLobbies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLobbies.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLobbies, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Aggregate stats
  const totalMembers = useMemo(() => {
    return lobbies.reduce((acc, l) => acc + (l.member_count || 0), 0);
  }, [lobbies]);

  const publicCount = useMemo(() => {
    return lobbies.filter(l => l.visibility === "PUBLIC").length;
  }, [lobbies]);

  const bgColors = [
    "bg-[#FEF9C3]", // pastel yellow
    "bg-[#FCE7F3]", // pastel pink
    "bg-[#FFEDD5]", // pastel orange
    "bg-[#FEF08A]", // vibrant yellow
    "bg-[#FDF2F8]", // light blossom pink
    "bg-[#FFF7ED]", // gentle peach orange
  ];

  return (
    <ProtectedRoute>
      <div className="flex-1 max-w-7xl w-full mx-auto space-y-6 animate-fade-in pb-16">
        
        {/* Header Title & Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-down">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,1)] text-black">
              ODALARI KEŞFET
            </h1>
            <p className="text-base font-bold text-gray-600 max-w-xl">
              Canlı odaları keşfedin, şifreli lobileri açın ve gerçek zamanlı topluluk sohbetlerine katılın!
            </p>
          </div>
          
          <Button 
            size="lg" 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#FB923C] text-black hover:bg-[#F97316] font-black text-lg h-14 px-8 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer rounded-sm shrink-0"
          >
            <Plus className="w-5 h-5 mr-1" /> LOBİ OLUŞTUR
          </Button>

          <CreateLobbyModal 
            isOpen={isCreateModalOpen} 
            onClose={() => {
              setIsCreateModalOpen(false);
              fetchLobbies();
            }} 
          />
        </div>

        {/* Live Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3.5 brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#FEF08A] border-2 border-black flex items-center justify-center font-black">
              <Radio className="w-5 h-5 text-black animate-pulse" />
            </div>
            <div>
              <div className="text-2xl font-black text-black">{lobbies.length}</div>
              <div className="text-[11px] font-black uppercase text-gray-500">Toplam Lobi</div>
            </div>
          </div>

          <div className="bg-white p-3.5 brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#4ADE80] border-2 border-black flex items-center justify-center font-black">
              <Globe className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="text-2xl font-black text-black">{publicCount}</div>
              <div className="text-[11px] font-black uppercase text-gray-500">Herkese Açık</div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white p-3.5 brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#F472B6] border-2 border-black flex items-center justify-center font-black">
              <Users className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="text-2xl font-black text-black">{totalMembers}</div>
              <div className="text-[11px] font-black uppercase text-gray-500">Toplam Üye Katılımı</div>
            </div>
          </div>
        </div>

        {/* Search, Filter Pills & Sort Bar */}
        <div className="bg-white p-4 brutal-border border-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Lobi adı veya açıklama ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              className="pl-9 bg-gray-50 brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] h-11 font-bold text-sm focus-visible:ring-[#FB923C]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterVisibility("ALL")}
              className={`px-3 py-1.5 text-xs font-black uppercase brutal-border border-2 transition-all cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                filterVisibility === "ALL" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              Hepsi ({lobbies.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterVisibility("PUBLIC")}
              className={`px-3 py-1.5 text-xs font-black uppercase brutal-border border-2 transition-all cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                filterVisibility === "PUBLIC" ? "bg-[#4ADE80] text-black" : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              Açık
            </button>
            <button
              type="button"
              onClick={() => setFilterVisibility("PRIVATE")}
              className={`px-3 py-1.5 text-xs font-black uppercase brutal-border border-2 transition-all cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                filterVisibility === "PRIVATE" ? "bg-[#F472B6] text-black" : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              Şifreli
            </button>
            <button
              type="button"
              onClick={() => setFilterVisibility("POPULAR")}
              className={`px-3 py-1.5 text-xs font-black uppercase brutal-border border-2 transition-all cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-1 ${
                filterVisibility === "POPULAR" ? "bg-[#FEF08A] text-black" : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#EA580C]" /> Popüler
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-gray-500 hidden sm:inline flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sırala:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] h-11 px-3 text-xs font-black uppercase cursor-pointer focus:outline-none"
            >
              <option value="members">En Çok Üye</option>
              <option value="newest">En Yeni</option>
              <option value="name">Alfabetik (A-Z)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/20 text-destructive brutal-border p-4 rounded-sm font-bold flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" className="bg-white font-black" onClick={fetchLobbies}>Tekrar Dene</Button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-60 bg-muted brutal-border brutal-shadow rounded-sm" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLobbies.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-white brutal-border border-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-sm space-y-4">
                  <p className="text-2xl font-black text-black uppercase">Aramanızla Eşleşen Lobi Bulunamadı</p>
                  <p className="text-sm font-bold text-gray-500">Filtrelerinizi değiştirmeyi deneyin ya da yeni bir lobi oluşturun!</p>
                  <Button 
                    variant="outline" 
                    onClick={() => { setSearchQuery(""); setFilterVisibility("ALL"); }}
                    className="brutal-border font-black text-xs uppercase"
                  >
                    Filtreleri Temizle
                  </Button>
                </div>
              ) : (
                paginatedLobbies.map((lobby, index) => {
                  const bgClass = bgColors[index % bgColors.length];
                  const isJoiningPrivate = joinLobbyId === lobby.id;
                  const topBarColors = ["bg-[#FB923C]", "bg-[#F472B6]", "bg-[#FEF08A]", "bg-[#4ADE80]"];
                  const accentColor = topBarColors[index % topBarColors.length];
                  
                  return (
                    <Card 
                      key={lobby.id} 
                      className={`group flex flex-col h-[290px] ${bgClass} brutal-border border-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 animate-slide-up relative overflow-hidden rounded-sm`}
                      style={{ animationDelay: `${(index % 6) * 60}ms` }}
                    >
                      {/* Full card hover linear sweep */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FEF08A]/40 via-[#FB923C]/25 to-[#F472B6]/40 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 pointer-events-none z-0" />

                      {/* Top linear accent line */}
                      <div className={`absolute top-0 left-0 right-0 h-2 ${accentColor} scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200 z-10`} />

                      <CardHeader className="pb-2 relative z-10 pt-5">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-xl font-black line-clamp-1 text-black">{lobby.name}</CardTitle>
                          <Badge 
                            className={`font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] shrink-0 ${
                              lobby.visibility === "PRIVATE" ? "bg-[#F472B6] text-black" : "bg-white text-black"
                            }`}
                          >
                            {lobby.visibility === "PRIVATE" ? (
                              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> ÖZEL</span>
                            ) : (
                              <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-emerald-600" /> HERKESE AÇIK</span>
                            )}
                          </Badge>
                        </div>
                        <CardDescription className="text-black/80 font-bold line-clamp-2 text-sm mt-1">
                          {lobby.description || "Açıklama belirtilmemiş."}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="mt-auto pb-3 relative z-10">
                        <div className="flex items-center gap-2 text-xs font-black">
                          <span className="bg-white px-2.5 py-1 rounded-sm brutal-border border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 text-black">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ADE80]"></span>
                            </span>
                            {lobby.member_count} Üye
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-0 border-t-0 relative z-10">
                        {isJoiningPrivate ? (
                          <form onSubmit={(e) => handleJoinLobby(lobby, e)} className="w-full flex gap-2" autoComplete="off">
                            <Input 
                              type="password" 
                              placeholder="Şifre girin..." 
                              value={joinPassword}
                              onChange={(e) => setJoinPassword(e.target.value)}
                              autoComplete="off"
                              className="bg-white h-10 brutal-border border-2 font-bold text-sm"
                              required
                              autoFocus
                            />
                            <Button type="submit" size="sm" className="h-10 bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs cursor-pointer">Katıl</Button>
                            <Button type="button" size="sm" variant="ghost" className="bg-white hover:bg-gray-100 brutal-border border-2 h-10 font-bold text-xs cursor-pointer" onClick={() => {
                              setJoinLobbyId(null);
                              setJoinError(null);
                            }}>İptal</Button>
                          </form>
                        ) : (
                          <div className="w-full">
                            {joinError && joinLobbyId === lobby.id && (
                              <p className="text-red-600 text-xs font-black mb-1.5 bg-white p-1 brutal-border border">{joinError}</p>
                            )}
                            <Button 
                              className="w-full bg-black hover:bg-neutral-800 text-white font-black text-sm h-11 uppercase brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all cursor-pointer"
                              onClick={() => handleJoinLobby(lobby)}
                            >
                              {lobby.visibility === "PRIVATE" ? "Şifre Gir ve Katıl" : "Lobiye Katıl"}
                            </Button>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Bottom Pagination Control with Page Numbers, Prev/Next, Ellipsis, and UIPageControl Dots */}
            {filteredLobbies.length > 0 && (
              <div className="pt-4 flex flex-col items-center gap-4 bg-white/60 p-5 rounded-sm brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] mt-4">
                <div className="flex flex-col sm:flex-row items-center justify-between w-full text-xs font-black uppercase text-black/70 gap-2 border-b border-black/10 pb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FB923C]" />
                    Toplam <span className="text-black font-black">{filteredLobbies.length}</span> lobi bulundu
                  </span>
                  <span>
                    Sayfa <span className="text-black font-black">{currentPage}</span> / {totalPages} (Gösterilen: {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredLobbies.length)} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredLobbies.length)})
                  </span>
                </div>
                <FullPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
