// ============================================================================
// TARGET_DESTINATION: frontend/src/app/agents/page.tsx
// PURPOSE: Agent Hub listing with custom avatar support, API key management & agent editing
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { aiApi } from "@/lib/api/ai";
import { AiCredential, Agent } from "@/types";
import { CredentialsModal } from "@/components/agents/credentials-modal";
import { toast } from "@/components/ui/toast";
import { getAvatarUrl } from "@/lib/avatar";
import { 
  KeyRound, 
  Plus, 
  Bot, 
  ShieldCheck, 
  Cpu, 
  Settings, 
  Trash2, 
  Sparkles, 
  MessageSquareQuote, 
  Hash, 
  Smile, 
  Compass, 
  Loader2 
} from "lucide-react";

export default function AgentsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [credentials, setCredentials] = useState<AiCredential[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  // Delete dialog state
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCredentials = () => {
    aiApi.getCredentials()
      .then(data => setCredentials(data))
      .catch(console.error);
  };

  const fetchAgents = () => {
    aiApi.getAgents()
      .then(data => setAgents(data))
      .catch(err => {
        console.error(err);
        toast.add({
          title: "Error",
          description: "Failed to load agents list.",
          type: "error",
        });
      })
      .finally(() => setIsFetching(false));
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (isAuthenticated) {
      fetchCredentials();
      fetchAgents();
    }
  }, [isLoading, isAuthenticated, router]);

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;
    setIsDeleting(true);
    try {
      await aiApi.deleteAgent(agentToDelete.id);
      toast.add({
        title: "Agent Deleted",
        description: `${agentToDelete.name} was successfully removed.`,
        type: "success",
      });
      setAgents(prev => prev.filter(a => a.id !== agentToDelete.id));
      setAgentToDelete(null);
    } catch (err: any) {
      toast.add({
        title: "Delete Failed",
        description: err.response?.data?.error?.message || "Could not delete agent.",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3 bg-white p-8 brutal-border border-4 brutal-shadow animate-pulse">
          <Bot className="w-12 h-12 text-[#A78BFA] animate-bounce" />
          <div className="text-2xl font-black uppercase tracking-tight">Loading AI Hub...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 flex flex-col p-4 sm:p-8 animate-fade-in-up">
      
      {/* Header Banner */}
      <div className="bg-[#A78BFA] p-6 sm:p-8 brutal-border border-4 brutal-shadow rounded-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Autonomous Agents
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-black">
              AI Agent Hub
            </h1>
            <p className="text-base sm:text-lg font-bold text-black/80 max-w-2xl">
              Create, configure, and manage custom AI personas with tailored avatars, knowledge, and style.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              size="lg"
              className="bg-[#4ADE80] text-black hover:bg-[#22c55e] border-3 border-black brutal-shadow font-black uppercase text-sm px-6 h-12 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
              onClick={() => router.push("/agents/builder")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </div>
        </div>
      </div>

      {/* Credentials Summary Bar */}
      <div className="bg-white p-4 sm:p-6 brutal-border border-4 brutal-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FEF08A] border-2 border-black flex items-center justify-center font-black shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <KeyRound className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-black uppercase text-base">API Credentials ({credentials.length})</h3>
            <p className="text-xs font-bold text-gray-600">
              Keys are AES-GCM encrypted. Required to power your custom agents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {credentials.map(c => (
            <Badge key={c.id} className="bg-[#E0F4FF] text-black brutal-border border-2 font-black text-xs px-2.5 py-1 flex items-center gap-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              {c.provider}
            </Badge>
          ))}
          <Button 
            size="sm"
            onClick={() => setIsCredsModalOpen(true)}
            className="bg-black text-white hover:bg-gray-800 font-black text-xs uppercase brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Manage Keys
          </Button>
        </div>
      </div>

      {/* Agents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center gap-2">
            <Bot className="w-7 h-7 text-[#A78BFA]" />
            Your Configured Agents ({agents.length})
          </h2>
          {agents.length > 0 && (
            <span className="text-xs font-bold text-gray-500 uppercase">
              Click Edit to reconfigure personality, avatar & behavior
            </span>
          )}
        </div>

        {agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => {
              const username = agent.username || agent.name.toLowerCase().replace(/\s+/g, '_');
              const personalities = Array.isArray(agent.personality_config) ? agent.personality_config : [];
              const interests = Array.isArray(agent.interest_config) ? agent.interest_config : [];
              const communications = Array.isArray(agent.communication_config) ? agent.communication_config : [];

              return (
                <div 
                  key={agent.id} 
                  className="bg-white brutal-border border-4 brutal-shadow flex flex-col justify-between hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all duration-150"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b-4 border-black bg-[#FEF08A] flex items-start justify-between gap-3">
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2.5">
                        {/* Custom Agent Avatar or Fallback Icon */}
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-black overflow-hidden flex items-center justify-center font-black text-xs shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                          {agent.avatar_url ? (
                            <img
                              src={getAvatarUrl(agent.avatar_url)}
                              alt={agent.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Bot className="w-5 h-5 text-black" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-xl truncate" title={agent.name}>{agent.name}</h3>
                          <div className="inline-block bg-white px-2 py-0.5 brutal-border border font-mono font-bold text-xs text-purple-700 shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                            @{username}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className="bg-[#4ADE80] text-black brutal-border border-2 font-black text-xs flex items-center gap-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        <Cpu className="w-3 h-3" />
                        {agent.provider}
                      </Badge>
                      <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.5 rounded-none">
                        {agent.model}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4 flex-1">
                    {/* Personality & Style Tags */}
                    {personalities.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1 tracking-wider">
                          <Smile className="w-3 h-3 text-yellow-600" /> Personality
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {personalities.slice(0, 3).map((p: string) => (
                            <span key={p} className="bg-pink-100 text-pink-900 border border-black text-[10px] font-bold px-2 py-0.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                              {p}
                            </span>
                          ))}
                          {personalities.length > 3 && (
                            <span className="text-[10px] font-bold text-gray-500">+{personalities.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {communications.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1 tracking-wider">
                          <MessageSquareQuote className="w-3 h-3 text-blue-600" /> Style
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {communications.slice(0, 2).map((c: string) => (
                            <span key={c} className="bg-blue-100 text-blue-900 border border-black text-[10px] font-bold px-2 py-0.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {interests.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1 tracking-wider">
                          <Compass className="w-3 h-3 text-emerald-600" /> Interests
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {interests.slice(0, 3).map((i: string) => (
                            <span key={i} className="bg-emerald-100 text-emerald-900 border border-black text-[10px] font-bold px-2 py-0.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                              {i}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {agent.custom_instructions && (
                      <div className="bg-gray-50 p-2.5 brutal-border border text-xs font-bold text-gray-700 italic line-clamp-2">
                        "{agent.custom_instructions}"
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 border-t-4 border-black bg-gray-50 flex items-center justify-between gap-3">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-white hover:bg-gray-100 text-black font-black uppercase brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer text-xs"
                      onClick={() => router.push(`/agents/${agent.id}/edit`)}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1.5" />
                      Edit Config
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="bg-[#FFE4E6] hover:bg-red-200 text-red-700 font-black uppercase brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer text-xs"
                      onClick={() => setAgentToDelete(agent)}
                      title="Delete Agent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white brutal-border border-4 brutal-shadow p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#E0F4FF] brutal-border border-4 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <Bot className="w-10 h-10 text-black" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-2xl font-black uppercase">No Active Agents Yet</h3>
              <p className="text-sm font-bold text-gray-600">
                You haven't built any personalized AI agents. Build your first bot to give it personality, interests, and conversational intelligence!
              </p>
            </div>
            <Button 
              size="lg"
              className="bg-[#4ADE80] text-black hover:bg-[#22c55e] border-4 border-black brutal-shadow shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-black uppercase text-base px-8 h-12 cursor-pointer"
              onClick={() => router.push("/agents/builder")}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Agent
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
        <AlertDialogContent className="brutal-border border-4 brutal-shadow bg-[#FEF08A] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-red-600" />
              Delete Agent?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-black/80 text-sm">
              Are you sure you want to delete <span className="underline font-black">{agentToDelete?.name}</span>? This action cannot be undone. Any lobbies where this agent is participating will no longer receive automated replies from it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-2 pt-2">
            <AlertDialogCancel 
              disabled={isDeleting}
              className="font-black uppercase bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAgent();
              }}
              disabled={isDeleting}
              className="font-black uppercase bg-red-500 hover:bg-red-600 text-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete Agent"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* API Key Modal */}
      <CredentialsModal 
        isOpen={isCredsModalOpen}
        onClose={() => setIsCredsModalOpen(false)}
        onSuccess={fetchCredentials}
      />
    </div>
  );
}
