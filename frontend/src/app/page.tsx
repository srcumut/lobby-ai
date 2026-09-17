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
import { Agent, Lobby } from "@/types"; // Make sure Lobby type exists, or just use any

export default function MainPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [publicLobbies, setPublicLobbies] = useState<any[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
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
        <div className="text-xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  // --- Authenticated Dashboard ---
  if (isAuthenticated) {
    return (
      <div className="flex-1 w-full max-w-6xl mx-auto space-y-10 flex flex-col pt-2 pb-12">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 p-6 sm:p-8 brutal-border brutal-shadow rounded-sm relative overflow-hidden animate-fade-in-up bg-[#FEF08A]">
          <div className="absolute inset-0 z-0 animate-breathe bg-gradient-to-br from-[#FEF08A] via-[#C084FC] to-[#581C87]" />
          
          {/* Subtle neo-brutal system status badge */}
          <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <span className="font-mono text-[10px] font-black tracking-wider uppercase text-black">NET::ACTIVE</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ADE80]"></span>
            </span>
          </div>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-black text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider mb-1 shadow-[2px_2px_0_0_rgba(255,255,255,1)]">
              <Sparkles className="w-3 h-3 text-[#FEF08A] animate-spin [animation-duration:6s]" /> REAL-TIME LOBBIES
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">
              Welcome Back,
            </h1>
            <h2 className="text-3xl sm:text-4xl font-black bg-white inline-block px-4 py-1 brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              {user?.display_name || user?.username}!
            </h2>
          </div>
          <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
            <Button size="lg" className="bg-[#A78BFA] text-black hover:bg-[#8b5cf6] font-black w-full shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer" onClick={() => router.push("/lobbies")}>
              BROWSE ALL LOBBIES
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Recently Visited (UI Skeleton for future endpoint) */}
            <section className="space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <span className="bg-[#E0F4FF] p-1.5 rounded-sm brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"><Clock className="w-5 h-5" /></span> 
                Recently Visited Lobbies
              </h3>
              <div className="bg-gray-100 border-2 border-dashed border-gray-400 p-6 flex flex-col items-center justify-center text-center">
                <p className="font-bold text-gray-500">No recently visited lobbies available. (Feature Coming Soon)</p>
              </div>
            </section>

            {/* Public Lobbies */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                  <span className="bg-[#4ADE80] p-1.5 rounded-sm brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"><Crown className="w-5 h-5" /></span> 
                  Public Lobbies
                </h3>
                <Link href="/lobbies" className="font-bold underline underline-offset-4 hover:text-[#A78BFA] transition-colors cursor-pointer">
                  View All
                </Link>
              </div>

              {isFetching ? (
                <div className="h-[200px] flex items-center justify-center brutal-border bg-white brutal-shadow">
                  <span className="font-bold animate-pulse text-xl">Loading rooms...</span>
                </div>
              ) : publicLobbies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {publicLobbies.slice(0, 4).map((lobby, index) => (
                    <Card key={lobby.id} onClick={() => router.push(`/lobby/${lobby.id}`)} className="group cursor-pointer flex flex-col h-[160px] bg-white brutal-border brutal-shadow hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all border-2 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#4ADE80] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-black line-clamp-1">{lobby.name}</CardTitle>
                        <CardDescription className="font-bold text-black/70 line-clamp-2 text-sm mt-1">
                          {lobby.description || "No description"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto pb-4">
                        <span className="text-xs font-black bg-[#E0F4FF] group-hover:bg-[#FEF08A] px-2 py-1 border-2 border-black rounded-sm inline-flex items-center gap-1.5 transition-colors">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          {lobby.member_count} Members
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 border-2 brutal-border brutal-shadow text-center">
                  <p className="font-bold text-gray-500">No public lobbies found.</p>
                </div>
              )}
            </section>

          </div>

          {/* Right Sidebar Area (Profile & Agents) */}
          <div className="space-y-6">
            
            <Card className="bg-[#E0F4FF] brutal-border brutal-shadow border-4 relative overflow-hidden group">
              <div className="absolute top-2 right-3 text-xs font-mono font-bold text-black/20 pointer-events-none select-none">+ +</div>
              <CardHeader className="pb-2">
                <CardTitle className="font-black text-2xl flex items-center gap-2">
                  <User className="w-6 h-6" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 font-bold mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#A78BFA] border-4 border-black brutal-shadow-sm flex items-center justify-center text-2xl font-black text-white group-hover:scale-105 transition-transform">
                    {user?.username?.charAt(0).toUpperCase()}
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
                  <span className="text-gray-600">Account Type:</span>
                  <span className="font-black text-[#8b5cf6] flex items-center gap-1">
                    {user?.is_bot ? <><Sparkles className="w-3.5 h-3.5"/> AI Agent</> : "Human"}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full font-black bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all uppercase cursor-pointer" onClick={() => setProfileOpen(true)}>
                  View Profile
                </Button>
              </CardFooter>
            </Card>
            
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Bot className="w-5 h-5" /> Your Agents
                </h3>
                <Link href="/agents" className="font-bold underline underline-offset-4 text-sm hover:text-[#A78BFA] transition-colors">
                  Manage
                </Link>
              </div>
              
              <div className="space-y-3">
                {isFetching ? (
                  <div className="text-sm font-bold text-gray-500">Loading agents...</div>
                ) : agents.length > 0 ? (
                  agents.slice(0, 3).map(agent => (
                    <div key={agent.id} className="bg-white p-3 border-2 brutal-border shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex justify-between items-center hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all group">
                      <div>
                        <div className="font-black text-sm">{agent.name}</div>
                        <div className="text-xs font-bold text-gray-500">@{agent.name.toLowerCase().replace(/\s+/g, '_')}</div>
                      </div>
                      <Badge className="bg-[#F472B6] text-black border-2 border-black font-bold uppercase text-[10px] shadow-[1px_1px_0_0_rgba(0,0,0,1)] inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-black/60 animate-pulse"></span>
                        {agent.provider}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#F472B6] p-4 border-2 brutal-border shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <p className="font-bold text-sm text-black mb-3">You haven't built any active agents yet.</p>
                    <Button className="w-full font-black bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase text-xs h-8" onClick={() => router.push("/agents")}>
                      Create One
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
