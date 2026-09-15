"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { lobbiesApi } from "@/lib/api/lobbies";
import { Badge } from "@/components/ui/badge";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { Crown, Sparkles, User, Settings } from "lucide-react";

export default function MainPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [ownedLobbies, setOwnedLobbies] = useState<Lobby[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      lobbiesApi.getLobbies()
        .then(data => {
          const mine = data.filter(l => l.owner_id === user.id);
          setOwnedLobbies(mine);
        })
        .catch(console.error)
        .finally(() => setIsFetching(false));
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  // --- Authenticated Dashboard ---
  if (isAuthenticated) {
    return (
      <div className="flex-1 w-full max-w-6xl mx-auto space-y-10 flex flex-col pt-4 pb-12">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 p-6 sm:p-8 brutal-border brutal-shadow rounded-sm relative overflow-hidden animate-fade-in-up bg-[#FEF08A]">
          {/* Animated Background */}
          <div 
            className="absolute inset-0 z-0 animate-breathe bg-gradient-to-br from-[#FEF08A] via-[#C084FC] to-[#581C87]"
          />
          <div className="relative z-10 space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">
              Welcome Back,
            </h1>
            <h2 className="text-3xl sm:text-4xl font-black bg-white inline-block px-4 py-1 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              {user?.username}!
            </h2>
            <p className="text-lg font-bold mt-2 opacity-80 max-w-md">
              Your dashboard overview. Jump back into active conversations or configure your upcoming AI agents.
            </p>
          </div>
          <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
            <Button size="lg" className="bg-[#A78BFA] text-black hover:bg-[#8b5cf6] font-black w-full shadow-[4px_4px_0_0_rgba(0,0,0,1)]" onClick={() => router.push("/lobbies")}>
              BROWSE ALL LOBBIES
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Activity Area (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <span className="bg-[#FEF08A] p-1.5 rounded-sm brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"><Crown className="w-6 h-6" /></span> 
                Owned Rooms
              </h3>
              <Link href="/lobbies" className="font-bold underline underline-offset-4 hover:text-[#A78BFA] transition-colors cursor-pointer">
                View All
              </Link>
            </div>

            {isFetching ? (
              <div className="h-[400px] flex items-center justify-center brutal-border bg-white brutal-shadow">
                <span className="font-bold animate-pulse text-xl">Loading rooms...</span>
              </div>
            ) : ownedLobbies.length > 0 ? (
              <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                  {ownedLobbies.map((lobby, index) => (
                    <Card key={lobby.id} onClick={() => router.push(`/lobby/${lobby.id}`)} className={`cursor-pointer flex flex-col h-[180px] bg-white brutal-border brutal-shadow hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 animate-pop-in border-4`} style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                      <CardHeader className="pb-2 cursor-pointer">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-lg font-black line-clamp-1">{lobby.name}</CardTitle>
                          <Badge variant={lobby.visibility === "PRIVATE" ? "destructive" : "default"} className="font-bold border-2 border-black whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {lobby.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC"}
                          </Badge>
                        </div>
                        <CardDescription className="font-bold text-black/70 line-clamp-2 text-sm mt-1">
                          {lobby.description || "No description"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto pb-4 cursor-pointer">
                        <span className="text-xs font-black bg-[#E0F4FF] px-2 py-1 border-2 border-black rounded-sm inline-flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          {lobby.member_count} Members
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center brutal-border bg-white brutal-shadow text-center p-6 gap-4 border-4">
                <p className="font-black text-2xl text-black/60">You don't own any rooms yet.</p>
                <Button variant="outline" className="bg-[#4ADE80] font-black border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all text-black uppercase cursor-pointer" onClick={() => router.push("/lobbies")}>
                  CREATE ONE
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar / Feature Area (1 col) */}
          <div className="space-y-6 animate-fade-in-up delay-200">
            <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <span className="bg-white p-1.5 rounded-sm brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">⚙️</span> Management
            </h3>
            
            <Card className="bg-[#E0F4FF] brutal-border brutal-shadow border-4">
              <CardHeader className="pb-2">
                <CardTitle className="font-black text-2xl flex items-center gap-2">
                  <User className="w-6 h-6" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 font-bold mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#A78BFA] border-4 border-black brutal-shadow-sm flex items-center justify-center text-2xl font-black text-white">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xl font-black">{user?.display_name || user?.username}</div>
                    <div className="text-sm font-bold text-black/60">@{user?.username}</div>
                  </div>
                </div>
                <div className="flex justify-between border-b-4 border-black pb-2 pt-2">
                  <span>Account Type:</span>
                  <span className="font-black text-[#8b5cf6] flex items-center gap-1">
                    {user?.is_bot ? <><Sparkles className="w-4 h-4"/> AI Agent</> : "Human"}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full font-black bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all uppercase cursor-pointer" onClick={() => setProfileOpen(true)}>
                  View Profile
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-[#F472B6] brutal-border brutal-shadow opacity-90 border-4">
              <CardHeader>
                <CardTitle className="font-black text-xl flex items-center gap-2">🤖 AI Agents</CardTitle>
                <CardDescription className="font-bold text-black/70">
                  Configure personal bot assistants.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-bold bg-white p-3 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] mb-4 text-sm">
                  Build and manage personalized AI agents to participate in your lobbies. Phase 3 is live!
                </p>
                <Button 
                  className="w-full font-black bg-black text-white hover:bg-gray-800 border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase" 
                  onClick={() => router.push("/agents")}
                >
                  OPEN AI BUILDER
                </Button>
              </CardContent>
            </Card>

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
          <div className="border-b-[3px] border-black bg-[#E0F4FF] p-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-black"></div>
            <div className="w-3 h-3 rounded-full bg-black"></div>
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
          <div className="bg-[#4ADE80] border-[4px] border-black px-4 md:px-6 py-2 transform -rotate-3 z-10 shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)]">
            <span className="font-black text-5xl md:text-8xl tracking-tighter uppercase text-black">LOBBY</span>
          </div>
          <div className="bg-[#FEF08A] border-[4px] border-black px-4 md:px-6 py-2 transform rotate-3 z-0 shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)]">
            <span className="font-black text-5xl md:text-8xl tracking-tighter uppercase text-black">AI</span>
          </div>
        </div>
        
        <div className="pt-4 animate-pop-in delay-200">
          <p className="text-xl sm:text-3xl font-black bg-[#A78BFA] inline-block px-4 py-2 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-1">
            Real-time Social Chat. No Filter.
          </p>
        </div>
      </div>

      <p className="text-lg sm:text-xl font-bold max-w-2xl text-center opacity-90 px-4 bg-white p-4 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-10 animate-fade-in-up delay-300">
        Create and join lobbies. Communicate in real-time. Watch out for our upcoming personalized AI agents that can participate alongside you.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mt-6 z-10 animate-pop-in delay-400">
        <Link href="/register">
          <Button size="lg" className="h-16 px-10 text-xl font-black bg-[#4ADE80] text-black hover:bg-[#22c55e] brutal-shadow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase">
            Start Chatting
          </Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-black bg-white text-black brutal-shadow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase">
            Login
          </Button>
        </Link>
      </div>

      {/* Feature Grid Mini */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-8 z-10">
        <div className="bg-white p-4 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 animate-fade-in-up delay-200">
          <div className="w-10 h-10 bg-[#FEF08A] brutal-border flex items-center justify-center text-xl mb-3 font-black">1</div>
          <h3 className="text-lg font-black uppercase mb-1">Secure Lobbies</h3>
          <p className="font-medium text-xs text-gray-700">Join global public conversations or lock your room with a secure password for private sessions.</p>
        </div>
        <div className="bg-white p-4 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 animate-fade-in-up delay-300">
          <div className="w-10 h-10 bg-[#60A5FA] brutal-border flex items-center justify-center text-xl mb-3 font-black">2</div>
          <h3 className="text-lg font-black uppercase mb-1">Real-Time Sync</h3>
          <p className="font-medium text-xs text-gray-700">Powered by Rust and WebSockets. Experience lightning fast, low-latency communication.</p>
        </div>
        <div className="bg-white p-4 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 animate-fade-in-up delay-400">
          <div className="w-10 h-10 bg-[#F472B6] brutal-border flex items-center justify-center text-xl mb-3 font-black">3</div>
          <h3 className="text-lg font-black uppercase mb-1">AI Integration</h3>
          <p className="font-medium text-xs text-gray-700">Upcoming in Phase 3: Create, manage, and interact with autonomous AI agents directly in your lobbies.</p>
        </div>
      </div>
    </div>
  );
}
