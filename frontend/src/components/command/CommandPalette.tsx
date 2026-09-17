"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { lobbiesApi } from "@/lib/api/lobbies";
import { Lobby } from "@/types";
import { 
  Search, 
  Home, 
  Compass, 
  Bot, 
  Plus, 
  User, 
  LogOut, 
  Users, 
  Lock, 
  Globe, 
  CornerDownLeft, 
  ArrowUpDown, 
  X 
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Lobbies" | "Actions";
  icon: React.ReactNode;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch lobbies when palette is opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      lobbiesApi.getLobbies()
        .then(data => setLobbies(data))
        .catch(err => console.error("Failed to load lobbies for command palette", err));
      
      // Auto focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Build command items list
  const navigationItems: CommandItem[] = useMemo(() => [
    {
      id: "nav-dashboard",
      title: "Dashboard",
      subtitle: "Return to your personal home dashboard",
      category: "Navigation",
      icon: <Home className="w-4 h-4 text-purple-600" />,
      onSelect: () => router.push("/"),
    },
    {
      id: "nav-lobbies",
      title: "Discover Rooms",
      subtitle: "Browse all active public and private lobbies",
      category: "Navigation",
      icon: <Compass className="w-4 h-4 text-blue-600" />,
      onSelect: () => router.push("/lobbies"),
    },
    {
      id: "nav-agents",
      title: "My Agents",
      subtitle: "Manage your autonomous AI bots and API keys",
      category: "Navigation",
      icon: <Bot className="w-4 h-4 text-emerald-600" />,
      onSelect: () => router.push("/agents"),
    },
    {
      id: "nav-builder",
      title: "Build New AI Agent",
      subtitle: "Create and configure a personalized AI participant",
      category: "Navigation",
      icon: <Plus className="w-4 h-4 text-amber-600" />,
      onSelect: () => router.push("/agents/builder"),
    },
    {
      id: "nav-profile",
      title: "My Profile",
      subtitle: "View and edit your personal account details",
      category: "Navigation",
      icon: <User className="w-4 h-4 text-pink-600" />,
      onSelect: () => router.push("/profile"),
    },
  ], [router]);

  const lobbyItems: CommandItem[] = useMemo(() => {
    return lobbies.map((lobby) => ({
      id: `lobby-${lobby.id}`,
      title: lobby.name,
      subtitle: `${lobby.member_count} member${lobby.member_count !== 1 ? "s" : ""} • ${lobby.visibility}`,
      category: "Lobbies" as const,
      icon: lobby.visibility === "PUBLIC" ? (
        <Globe className="w-4 h-4 text-green-600" />
      ) : (
        <Lock className="w-4 h-4 text-amber-600" />
      ),
      onSelect: () => router.push(`/lobby/${lobby.id}`),
    }));
  }, [lobbies, router]);

  const actionItems: CommandItem[] = useMemo(() => [
    {
      id: "action-logout",
      title: "Log Out",
      subtitle: "Sign out of your current session",
      category: "Actions",
      icon: <LogOut className="w-4 h-4 text-red-600" />,
      onSelect: () => {
        logout();
        router.push("/login");
      },
    },
  ], [logout, router]);

  // Combined & Filtered Items
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return [...navigationItems, ...lobbyItems.slice(0, 5), ...actionItems];
    }

    const match = (item: CommandItem) =>
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q));

    const matchedNav = navigationItems.filter(match);
    const matchedLobbies = lobbyItems.filter(match);
    const matchedActions = actionItems.filter(match);

    return [...matchedNav, ...matchedLobbies, ...matchedActions];
  }, [query, navigationItems, lobbyItems, actionItems]);

  // Adjust selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation within the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in-0 duration-100"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white brutal-border border-4 brutal-shadow shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="p-4 border-b-4 border-black bg-[#FEF08A] flex items-center gap-3">
          <Search className="w-6 h-6 text-black shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page name, or lobby title..."
            className="flex-1 bg-transparent font-black text-lg outline-none placeholder:text-black/50 text-black"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="p-1 hover:bg-black/10 rounded-sm cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4 text-black" />
            </button>
          )}
          <kbd className="hidden sm:inline-block bg-black text-white text-[10px] font-black px-2 py-1 uppercase shadow-[1px_1px_0_0_rgba(255,255,255,1)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-gray-100"
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-all border-2 ${
                    isSelected 
                      ? "bg-[#E0F4FF] border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-px" 
                      : "bg-white border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 border-2 border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] shrink-0 ${
                      isSelected ? "bg-white" : "bg-gray-100"
                    }`}>
                      {item.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-black text-sm text-black truncate">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className="text-xs font-bold text-gray-500 truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black uppercase bg-gray-100 border border-black px-1.5 py-0.5 text-gray-600">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-4 h-4 text-black hidden sm:inline-block" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
              <Search className="w-8 h-8 text-gray-400" />
              <p className="font-black text-sm uppercase">No matching results</p>
              <p className="text-xs font-bold text-gray-500">
                Try searching for a different room name or navigation command.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 border-t-2 border-black bg-gray-50 flex items-center justify-between text-[11px] font-bold text-gray-600 px-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> Select
            </span>
          </div>
          <span className="font-mono text-[10px]">
            {filteredItems.length} command{filteredItems.length !== 1 ? "s" : ""} available
          </span>
        </div>
      </div>
    </div>
  );
}
