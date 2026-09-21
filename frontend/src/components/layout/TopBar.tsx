"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";

interface TopBarProps {
  onMenuClick: () => void;
  onSearchClick?: () => void;
}

export function TopBar({ onMenuClick, onSearchClick }: TopBarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [coins, setCoins] = useState<number>(user?.coins ?? 100);

  useEffect(() => {
    if (user?.coins !== undefined) {
      setCoins(user.coins);
    }
    const handleUpdate = (e: any) => {
      if (e.detail?.coins !== undefined) {
        setCoins(e.detail.coins);
      }
    };
    window.addEventListener("lobby:coins_updated", handleUpdate);
    window.addEventListener("lobby:badge_unlocked", handleUpdate);
    return () => {
      window.removeEventListener("lobby:coins_updated", handleUpdate);
      window.removeEventListener("lobby:badge_unlocked", handleUpdate);
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
      {/* Neo-brutalist Tricolor top accent bar: Yellow -> Orange -> Pink */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FEF08A] via-[#FB923C] to-[#F472B6] z-50" />

      {/* 1. Left Logo Area: Exactly 260px wide to match sidebar below, centered logo, warm bg, with border-r-2 border-black */}
      <div className="w-[260px] h-full shrink-0 flex items-center justify-center relative border-r-2 border-black bg-[#FDFBF7] select-none">
        <Link href="/" className="flex items-center group cursor-pointer">
          <div className="flex -space-x-1.5 items-center">
            <div className="bg-[#4ADE80] border-2.5 border-black px-3 py-1 transform -rotate-3 group-hover:rotate-0 transition-all duration-200 shadow-[2.5px_2.5px_0_0_rgba(0,0,0,1)] group-hover:shadow-[3.5px_3.5px_0_0_rgba(0,0,0,1)]">
              <span className="font-black text-xl tracking-tight uppercase text-black">LOBBY</span>
            </div>
            <div className="bg-[#FEF08A] border-2.5 border-black px-3 py-1 transform rotate-3 group-hover:rotate-0 transition-all duration-200 shadow-[2.5px_2.5px_0_0_rgba(0,0,0,1)] group-hover:shadow-[3.5px_3.5px_0_0_rgba(0,0,0,1)] flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight uppercase text-black">AI</span>
              <span className="w-2 h-2 rounded-full bg-[#FB923C] animate-pulse border border-black" />
            </div>
          </div>
        </Link>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden absolute right-2 text-black hover:bg-black/10 h-8 w-8 p-0"
          onClick={onMenuClick}
          aria-label="Menüyü aç/kapat"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* 2. Page Title Area (Right after the 260px separator line) */}
      <div className="flex items-center gap-2 pl-4 sm:pl-6 shrink-0">
        <h1 className="text-[15px] sm:text-[17px] font-black uppercase tracking-wider text-black">
          {getPageTitle()}
        </h1>
        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-xs bg-[#FFEDD5] text-[#EA580C] border border-black text-[9px] font-black tracking-widest uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
          CANLI
        </span>
      </div>

      {/* 3. Center Search Bar (Horizontally Centered) */}
      <div className="flex-1 flex justify-center max-w-xl mx-auto px-4">
        <button 
          type="button"
          onClick={onSearchClick}
          className="w-full max-w-md h-10 px-3.5 bg-white hover:bg-[#FFFBEB] border-2 border-black font-bold text-sm flex items-center justify-between shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all rounded-sm cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 text-gray-500 group-hover:text-black">
            <Search className="w-4 h-4 font-black transition-transform group-hover:scale-110 group-hover:text-[#FB923C]" />
            <span className="text-xs sm:text-sm font-semibold truncate">Oda veya komut ara...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 bg-[#FEF08A] border-2 border-black text-[10px] font-black px-2 py-0.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)] group-hover:bg-[#FB923C] group-hover:text-white transition-colors">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* 4. Right Side: Coin Pill & Notification Bell */}
      <div className="flex items-center gap-3 pr-4 sm:pr-6 shrink-0">
        <Link 
          href="/shop" 
          className="flex items-center gap-1.5 px-3 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 transition-all cursor-pointer"
          title="Lobby Mağazası & Cüzdan"
        >
          <span>🪙</span>
          <span>{coins.toLocaleString()}</span>
        </Link>
        <NotificationCenter />
      </div>
    </header>
  );
}
