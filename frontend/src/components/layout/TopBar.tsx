"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import { QuestsModal } from "@/components/quests/QuestsModal";

interface TopBarProps {
  onMenuClick: () => void;
  onSearchClick?: () => void;
}

export function TopBar({ onMenuClick, onSearchClick }: TopBarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [coins, setCoins] = useState<number>(user?.coins ?? 0);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user?.coins !== undefined) {
      setCoins(user.coins);
    }
    const handleUpdate = (e: any) => {
      if (e.detail?.coins !== undefined) {
        setCoins(e.detail.coins);
      }
    };
    const handleOpenQuests = () => {
      setIsQuestsOpen(true);
    };

    window.addEventListener("lobby:coins_updated", handleUpdate);
    window.addEventListener("lobby:badge_unlocked", handleUpdate);
    window.addEventListener("lobby:open_quests", handleOpenQuests);

    return () => {
      window.removeEventListener("lobby:coins_updated", handleUpdate);
      window.removeEventListener("lobby:badge_unlocked", handleUpdate);
      window.removeEventListener("lobby:open_quests", handleOpenQuests);
    };
  }, [user?.coins]);
  
  const getPageTitle = () => {
    if (pathname === "/") return "KONTROL PANELİ";
    if (pathname.startsWith("/lobbies")) return "ODALARI KEŞFET";
    if (pathname.startsWith("/agents")) return "AJANLARIM";
    if (pathname.startsWith("/community")) return "TOPLULUK MEYDANI";
    if (pathname.startsWith("/shop")) return "LOBBY MAĞAZASI";
    if (pathname.startsWith("/messages")) return "DİREKT MESAJLAR";
    if (pathname.startsWith("/lobby/")) return "LOBİ ODASI";
    if (pathname === "/profile") return "PROFİLİM";
    return "KONTROL PANELİ";
  };

  return (
    <header className="h-16 w-full border-b-2 border-black bg-[#FDFBF7] flex items-center justify-between sticky top-0 z-40 shrink-0 select-none relative">
      {/* Neo-brutalist top accent bar: Cyan -> Yellow -> Violet */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#06B6D4] via-[#FEF08A] to-[#8B5CF6] z-50" />

      {/* 1. Left Logo Area: Responsive width on mobile (auto), 260px on md+ to align with sidebar */}
      <div className="topbar-logo-area w-auto px-3 sm:px-4 md:w-[260px] h-full shrink-0 flex items-center justify-center relative border-r-0 md:border-r-2 border-black bg-[#FDFBF7] select-none">
        <Link href="/" className="flex items-center group cursor-pointer">
          <div className="flex -space-x-1.5 items-center">
            <div className="logo-lobby-box bg-[#4ADE80] border-2.5 border-black px-2.5 sm:px-3 py-1 transform -rotate-3 group-hover:rotate-0 transition-all duration-200 shadow-[2.5px_2.5px_0_0_rgba(0,0,0,1)] group-hover:shadow-[3.5px_3.5px_0_0_rgba(0,0,0,1)]">
              <span className="font-black text-lg sm:text-xl tracking-tight uppercase text-black">LOBBY</span>
            </div>
            <div className="logo-ai-box bg-[#FEF08A] border-2.5 border-black px-2.5 sm:px-3 py-1 transform rotate-3 group-hover:rotate-0 transition-all duration-200 shadow-[2.5px_2.5px_0_0_rgba(0,0,0,1)] group-hover:shadow-[3.5px_3.5px_0_0_rgba(0,0,0,1)] flex items-center gap-1.5">
              <span className="font-black text-lg sm:text-xl tracking-tight uppercase text-black">AI</span>
              <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse border border-black" />
            </div>
          </div>
        </Link>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden ml-2 text-black hover:bg-black/10 h-8 w-8 p-0 shrink-0"
          onClick={onMenuClick}
          aria-label="Menüyü aç/kapat"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* 2. Page Title Area: Hidden on small mobile screens to prevent overflow */}
      <div className="hidden sm:flex items-center gap-2 pl-4 sm:pl-6 shrink-0">
        <h1 className="topbar-title text-[15px] sm:text-[17px] font-black uppercase tracking-wider text-black">
          {getPageTitle()}
        </h1>
        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-xs bg-[#CFFAFE] text-[#0891B2] border border-black text-[9px] font-black tracking-widest uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
          CANLI
        </span>
      </div>

      {/* 3. Center Search Bar (Horizontally Centered) */}
      <div className="flex-1 flex justify-center max-w-xl mx-auto px-2 sm:px-4 min-w-0">
        <button 
          type="button"
          onClick={onSearchClick}
          className="topbar-search-btn w-full max-w-md h-10 px-2.5 sm:px-3.5 bg-white hover:bg-[#FFFBEB] border-2 border-black font-bold text-sm flex items-center justify-between shadow-[2px_2px_0_0_rgba(0,0,0,1)] sm:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all rounded-sm cursor-pointer group"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 text-gray-500 group-hover:text-black min-w-0">
            <Search className="w-4 h-4 font-black transition-transform group-hover:scale-110 group-hover:text-[#06B6D4] shrink-0" />
            <span className="text-xs sm:text-sm font-semibold truncate">Oda veya komut ara...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 bg-[#FEF08A] border-2 border-black text-[10px] font-black px-2 py-0.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)] group-hover:bg-[#06B6D4] group-hover:text-black transition-colors shrink-0">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* 4. Right Side: Quests Button, Coin Pill & Notification Bell */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 pr-2.5 sm:pr-6 shrink-0">
        {isMounted && user && (
          <>
            <button
              type="button"
              onClick={() => setIsQuestsOpen(true)}
              data-testid="nav-quests-button"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-[#4ADE80] hover:bg-[#22c55e] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
              title="Günlük ve Haftalık Görevler"
            >
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">Görevler</span>
            </button>

            <Link 
              href="/shop" 
              className="topbar-coin-pill flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
              title="Lobby Mağazası & Cüzdan"
              data-testid="nav-coins-pill"
            >
              <span>🪙</span>
              <span className="font-mono">{coins.toLocaleString()}</span>
            </Link>
          </>
        )}
        <NotificationCenter />
      </div>

      {/* Quests Interactive Modal (Mounted only when opened) */}
      {isQuestsOpen && (
        <QuestsModal 
          isOpen={isQuestsOpen} 
          onClose={() => setIsQuestsOpen(false)} 
        />
      )}
    </header>
  );
}
