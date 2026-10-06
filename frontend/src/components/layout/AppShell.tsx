"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "@/components/command/CommandPalette";
import { getEquippedCosmetics, getGlobalThemeStyles } from "@/lib/cosmetics";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [globalThemeId, setGlobalThemeId] = useState<string | null>(null);
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const isChatView = pathname.startsWith("/lobby/") || pathname.startsWith("/messages");

  // Load and listen for project-wide equipped theme changes
  useEffect(() => {
    const equipped = getEquippedCosmetics();
    setGlobalThemeId(equipped.global_theme || null);

    const handleCosmeticsUpdate = (e: any) => {
      setGlobalThemeId(e.detail?.global_theme || null);
    };

    window.addEventListener("lobby:cosmetics_updated", handleCosmeticsUpdate);
    return () => window.removeEventListener("lobby:cosmetics_updated", handleCosmeticsUpdate);
  }, []);

  useEffect(() => {
    const isDark = globalThemeId === "global_theme_deep_galaxy";
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "deep-galaxy");
      document.body.classList.add("theme-deep-galaxy");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.body.classList.remove("theme-deep-galaxy");
    }
  }, [globalThemeId]);

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

  const theme = getGlobalThemeStyles(globalThemeId);

  return (
    <div
      data-theme={theme.isDarkGalaxy ? "deep-galaxy" : "default"}
      data-testid="app-shell-root"
      className={`flex flex-col h-screen w-full overflow-hidden relative transition-colors duration-300 ${theme.shellClass}`}
    >
      {/* Project ambient tech / galaxy backdrop */}
      <div className="absolute inset-0 bg-tech-grid pointer-events-none opacity-50 z-0" />
      <div className={`absolute -top-40 -left-20 w-[480px] h-[480px] ${theme.ambientGlows.glow1} rounded-full blur-3xl pointer-events-none z-0 animate-pulse-subtle`} />
      <div className={`absolute top-1/3 -right-28 w-[450px] h-[450px] ${theme.ambientGlows.glow2} rounded-full blur-3xl pointer-events-none z-0 animate-pulse-subtle [animation-delay:2s]`} />
      <div className={`absolute -bottom-32 left-1/4 w-[500px] h-[500px] ${theme.ambientGlows.glow3} rounded-full blur-3xl pointer-events-none z-0`} />

      {/* Decorative Galaxy Cosmic Dust / Stars when Deep Galaxy Theme is Active */}
      {theme.isDarkGalaxy && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-12 left-1/3 w-1.5 h-1.5 bg-[#38BDF8] rounded-full shadow-[0_0_8px_#38BDF8] animate-ping [animation-duration:3s]" />
          <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-[#A855F7] rounded-full shadow-[0_0_6px_#A855F7] animate-pulse" />
          <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-[#FDE047] rounded-full shadow-[0_0_10px_#FDE047] opacity-75" />
          <div className="absolute top-20 right-1/12 w-1.5 h-1.5 bg-[#06B6D4] rounded-full shadow-[0_0_8px_#06B6D4] animate-ping [animation-duration:4s]" />
        </div>
      )}

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
          className={`flex-1 min-w-0 flex flex-col relative z-10 animate-page-enter ${
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
