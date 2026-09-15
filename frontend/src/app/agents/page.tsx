"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aiApi } from "@/lib/api/ai";
import { AiCredential, Agent } from "@/types";
import { CredentialsModal } from "@/components/agents/credentials-modal";
import { KeyRound, Plus, Bot, ShieldCheck, Cpu } from "lucide-react";

export default function AgentsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [credentials, setCredentials] = useState<AiCredential[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchCredentials = () => {
    aiApi.getCredentials()
      .then(data => setCredentials(data))
      .catch(console.error);
  };

  const fetchAgents = () => {
    aiApi.getAgents()
      .then(data => setAgents(data))
      .catch(console.error)
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

  if (isLoading || isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl font-bold animate-pulse">Loading AI Hub...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto space-y-8 flex flex-col p-6 sm:p-8 animate-fade-in-up">
      
      {/* Header */}
      <div className="bg-[#A78BFA] p-8 brutal-border border-4 brutal-shadow rounded-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black flex items-center gap-3">
              <Bot className="w-10 h-10 md:w-12 md:h-12" />
              AI Agent Builder
            </h1>
            <p className="text-lg font-bold max-w-lg text-black/80">
              Create, configure, and manage autonomous AI agents. Bring your lobbies to life with personalized bot participants.
            </p>
          </div>
          <Button 
            size="lg" 
            className="bg-[#4ADE80] text-black hover:bg-[#22c55e] border-4 border-black brutal-shadow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xl uppercase h-16 px-8 whitespace-nowrap"
            onClick={() => router.push("/agents/builder")}
          >
            <Plus className="w-6 h-6 mr-2" />
            Build New Agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Credentials Section */}
        <Card className="bg-white brutal-border border-4 brutal-shadow flex flex-col">
          <CardHeader className="border-b-4 border-black bg-[#E0F4FF] pb-4">
            <CardTitle className="text-2xl font-black uppercase flex items-center gap-2">
              <KeyRound className="w-6 h-6" /> API Credentials
            </CardTitle>
            <CardDescription className="font-bold text-black/70">
              Manage API keys for different providers (OpenAI, Gemini, Anthropic). Keys are stored securely and encrypted.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col">
            {credentials.length > 0 ? (
              <div className="space-y-3 mb-6">
                {credentials.map(c => (
                  <div key={c.id} className="bg-gray-100 p-3 brutal-border border-2 flex items-center justify-between shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 font-black uppercase">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      {c.provider}
                    </div>
                    <div className="text-xs font-bold text-gray-500">
                      Added {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-400 p-6 flex flex-col items-center justify-center text-center gap-2 mb-6 flex-1 min-h-[150px]">
                <KeyRound className="w-8 h-8 text-gray-400" />
                <p className="font-bold text-gray-500">No credentials added yet.</p>
              </div>
            )}

            <Button 
              className="w-full mt-auto font-black uppercase bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
              onClick={() => setIsCredsModalOpen(true)}
            >
              Add Credential
            </Button>
          </CardContent>
        </Card>

        {/* Existing Agents Section */}
        <Card className="bg-[#FEF08A] brutal-border border-4 brutal-shadow flex flex-col">
          <CardHeader className="border-b-4 border-black bg-white pb-4">
            <CardTitle className="text-2xl font-black uppercase flex items-center gap-2">
              <Bot className="w-6 h-6" /> Your Agents
            </CardTitle>
            <CardDescription className="font-bold text-black/70">
              Agents you have created and configured. Tag them in lobbies via @username.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col">
            {agents.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2">
                {agents.map(agent => (
                  <div key={agent.id} className="bg-white p-3 brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-black text-lg">{agent.name}</div>
                      <div className="bg-[#4ADE80] text-xs px-2 py-1 brutal-border border-2 font-bold flex items-center">
                        <Cpu className="w-3 h-3 mr-1" />
                        {agent.provider}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-600 mb-1">
                      Model: <span className="text-black bg-gray-200 px-1">{agent.model}</span>
                    </div>
                    <div className="text-xs font-bold text-gray-500">
                      Mention: <span className="text-[#A78BFA] px-1 bg-gray-100 brutal-border border">@{agent.name.toLowerCase().replace(/\s+/g, '_')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-400 p-6 flex flex-col items-center justify-center text-center gap-2 flex-1 min-h-[150px]">
                <p className="font-black text-xl mb-2">Ready for Action</p>
                <p className="font-bold text-gray-600 text-sm">You haven't built any active agents yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CredentialsModal 
        isOpen={isCredsModalOpen}
        onClose={() => setIsCredsModalOpen(false)}
        onSuccess={fetchCredentials}
      />
    </div>
  );
}
