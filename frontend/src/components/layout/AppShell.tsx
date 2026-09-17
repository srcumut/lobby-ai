"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "@/components/command/CommandPalette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const pathname = usePathname();
  const isChatView = pathname.startsWith("/lobby/") || pathname.startsWith("/messages");

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
    <>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 h-full bg-[#F9F9FB] relative overflow-hidden">
        {/* Project ambient tech backdrop */}
        <div className="absolute inset-0 bg-tech-grid pointer-events-none opacity-50 z-0" />
        <div className="absolute -top-40 -left-20 w-[420px] h-[420px] bg-[#A78BFA]/10 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-subtle" />
        <div className="absolute top-1/3 -right-28 w-[400px] h-[400px] bg-[#4ADE80]/8 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-subtle [animation-delay:2s]" />
        <div className="absolute -bottom-32 left-1/4 w-[460px] h-[460px] bg-[#FEF08A]/15 rounded-full blur-3xl pointer-events-none z-0" />

        <TopBar 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onSearchClick={() => setIsCommandPaletteOpen(true)}
        />
        <main className={`flex-1 min-h-0 flex flex-col relative z-10 ${
          isChatView ? "overflow-hidden p-2 md:p-3" : "overflow-y-auto p-4 md:p-6"
        }`}>
          {children}
        </main>
      </div>

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </>
  );
}
