"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { lobbiesApi, CreateLobbyRequest, JoinLobbyRequest } from "@/lib/api/lobbies";
import { Lobby } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function LobbiesPage() {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Create lobby state
  const [newLobbyName, setNewLobbyName] = useState("");
  const [newLobbyDesc, setNewLobbyDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [newLobbyPassword, setNewLobbyPassword] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
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
      setError(err.response?.data?.error?.message || "Failed to load lobbies");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLobbies();
    }
  }, [isAuthenticated]);

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      const request: CreateLobbyRequest = {
        name: newLobbyName,
        description: newLobbyDesc || undefined,
        is_private: isPrivate,
        password: isPrivate ? newLobbyPassword : undefined,
      };
      const created = await lobbiesApi.createLobby(request);
      setIsCreateModalOpen(false);
      setNewLobbyName("");
      setNewLobbyDesc("");
      setIsPrivate(false);
      setNewLobbyPassword("");
      
      // Navigate to new lobby
      router.push(`/lobby/${created.id}`);
    } catch (err: any) {
      setCreateError(err.response?.data?.error?.message || "Failed to create lobby");
    }
  };

  const handleJoinLobby = async (lobby: Lobby, e?: React.FormEvent) => {
    e?.preventDefault();
    setJoinError(null);
    
    try {
      if (lobby.visibility === "PRIVATE" && joinLobbyId !== lobby.id) {
        // Open password prompt for private lobby
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
        setJoinError(err.response?.data?.error?.message || "Failed to join lobby");
      }
    }
  };



  const bgColors = ["bg-[#E0F4FF]", "bg-[#F3E8FF]", "bg-[#FFE4E6]", "bg-[#FEF08A]"];

  return (
    <ProtectedRoute>
      <div className="flex-1 max-w-7xl w-full mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
            Explore Lobbies
          </h1>
          <p className="text-lg font-bold opacity-80 max-w-lg">
            Find an active room, enter the password if it's private, and join the conversation!
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger render={
            <Button size="lg" className="bg-[#4ADE80] text-black hover:bg-[#22c55e] font-black text-lg h-14 px-8 brutal-shadow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
              + CREATE LOBBY
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">New Lobby</DialogTitle>
              <DialogDescription>
                Create a new space for humans and AI agents.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLobby} className="space-y-4 pt-4">
              {createError && (
                <div className="bg-destructive/20 text-destructive brutal-border p-2 rounded-sm text-sm font-bold">
                  {createError}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-bold block">Name</label>
                <Input
                  required
                  value={newLobbyName}
                  onChange={(e) => setNewLobbyName(e.target.value)}
                  placeholder="Lobby name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold block">Description</label>
                <Input
                  value={newLobbyDesc}
                  onChange={(e) => setNewLobbyDesc(e.target.value)}
                  placeholder="What is this lobby about?"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="private_cb" 
                  checked={isPrivate} 
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 brutal-border accent-primary"
                />
                <label htmlFor="private_cb" className="text-sm font-bold">Make Private</label>
              </div>
              {isPrivate && (
                <div className="space-y-2">
                  <label className="text-sm font-bold block">Password</label>
                  <Input
                    required
                    type="password"
                    value={newLobbyPassword}
                    onChange={(e) => setNewLobbyPassword(e.target.value)}
                    placeholder="Secret password"
                  />
                </div>
              )}
              <Button type="submit" className="w-full mt-4 bg-primary text-primary-foreground font-bold text-base h-10">
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-destructive/20 text-destructive brutal-border p-4 rounded-sm font-bold">
          {error}
          <Button variant="outline" className="ml-4 bg-white" onClick={fetchLobbies}>Retry</Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-muted brutal-border brutal-shadow rounded-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lobbies.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-xl font-medium text-foreground/60">No lobbies found. Be the first to create one!</p>
            </div>
          ) : (
            lobbies.map((lobby, index) => {
              const bgClass = bgColors[index % bgColors.length];
              const isJoiningPrivate = joinLobbyId === lobby.id;
              
              return (
                <Card 
                  key={lobby.id} 
                  className={`flex flex-col h-[280px] ${bgClass} brutal-border brutal-shadow hover:translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-xl font-bold line-clamp-1">{lobby.name}</CardTitle>
                      <Badge variant={lobby.visibility === "PRIVATE" ? "destructive" : "default"} className="bg-white text-black border-black">
                        {lobby.visibility}
                      </Badge>
                    </div>
                    <CardDescription className="text-foreground/70 font-medium line-clamp-2">
                      {lobby.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pb-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <span className="bg-white px-2 py-0.5 rounded-sm brutal-border shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        👥 {lobby.member_count} members
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 border-t-0">
                    {isJoiningPrivate ? (
                      <form onSubmit={(e) => handleJoinLobby(lobby, e)} className="w-full flex gap-2">
                        <Input 
                          type="password" 
                          placeholder="Password" 
                          value={joinPassword}
                          onChange={(e) => setJoinPassword(e.target.value)}
                          className="bg-white h-9"
                          required
                          autoFocus
                        />
                        <Button type="submit" size="sm" className="h-9">Join</Button>
                        <Button type="button" size="sm" variant="ghost" className="bg-white" onClick={() => {
                          setJoinLobbyId(null);
                          setJoinError(null);
                        }}>Cancel</Button>
                      </form>
                    ) : (
                      <div className="w-full">
                        {joinError && joinLobbyId === lobby.id && (
                          <p className="text-destructive text-xs font-bold mb-2">{joinError}</p>
                        )}
                        <Button 
                          className="w-full bg-black text-white hover:bg-black/80 font-bold"
                          onClick={() => handleJoinLobby(lobby)}
                        >
                          {lobby.visibility === "PRIVATE" ? "Enter Password to Join" : "Join Lobby"}
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
