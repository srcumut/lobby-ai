"use client";

import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface TopBarProps {
  onMenuClick: () => void;
  onSearchClick?: () => void;
}

export function TopBar({ onMenuClick, onSearchClick }: TopBarProps) {
  const pathname = usePathname();
  
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname.startsWith("/lobbies")) return "Discover Rooms";
    if (pathname.startsWith("/agents")) return "My Agents";
    if (pathname.startsWith("/lobby/")) return "Lobby";
    if (pathname === "/profile") return "My Profile";
    return "";
  };

  return (
    <header className="h-16 border-b border-black/[0.08] bg-white/90 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-40 shrink-0 gap-4">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-black hover:bg-black/10"
          onClick={onMenuClick}
        >
          <Menu className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black uppercase tracking-wide hidden sm:block">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-2 sm:mx-4">
        <button 
          type="button"
          onClick={onSearchClick}
          className="w-full h-10 px-3 bg-white hover:bg-[#FAF5FF] border-2 border-black font-bold text-sm flex items-center justify-between shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all rounded-none cursor-pointer group"
        >
          <div className="flex items-center gap-2 text-gray-500 group-hover:text-black">
            <Search className="w-4 h-4 font-black transition-transform group-hover:scale-110" />
            <span className="text-xs sm:text-sm">Search rooms or commands...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 bg-[#FEF08A] border border-black text-[10px] font-black px-1.5 py-0.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)] group-hover:bg-[#4ADE80] transition-colors">
            Ctrl + K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <NotificationCenter />
      </div>
    </header>
  );
}
