"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "@/components/command/CommandPalette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const isChatView = pathname.startsWith("/lobby/") || pathname.startsWith("/messages");

  // Reset scroll position on route changes so pages never start scrolled down or clipped under navbar
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
      mainRef.current.scrollLeft = 0;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  // Global Ctrl + K / Cmd + K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-[#FAF8F0] overflow-hidden relative">
      {/* Project ambient tech backdrop (Pink, Orange & Yellow warmth) */}
      <div className="absolute inset-0 bg-tech-grid pointer-events-none opacity-50 z-0" />
      <div className="absolute -top-40 -left-20 w-[440px] h-[440px] bg-[#F472B6]/12 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-subtle" />
      <div className="absolute top-1/3 -right-28 w-[420px] h-[420px] bg-[#FB923C]/12 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-subtle [animation-delay:2s]" />
      <div className="absolute -bottom-32 left-1/4 w-[480px] h-[480px] bg-[#FEF08A]/20 rounded-full blur-3xl pointer-events-none z-0" />

      {/* 1. Full-width top navbar from screen left to screen right */}
      <TopBar 
        onMenuClick={() => setIsSidebarOpen(true)} 
        onSearchClick={() => setIsCommandPaletteOpen(true)}
      />

      {/* 2. Below the navbar: Sidebar on the left + Main on the right */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden z-10">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main 
          ref={mainRef}
          key={pathname}
          className={`flex-1 min-w-0 flex flex-col relative z-10 ${
            isChatView ? "overflow-hidden p-2 md:p-3" : "overflow-y-auto p-4 md:p-6"
          }`}
        >
          {children}
        </main>
      </div>

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </div>
  );
}
