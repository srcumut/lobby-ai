// ============================================================================
// TARGET_DESTINATION: frontend/src/app/agents/[id]/edit/page.tsx
// PURPOSE: Agent Edit page with interactive Avatar cropper, zoom/pan & computer upload
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { aiApi } from "@/lib/api/ai";
import { AvatarPicker } from "@/components/avatar/AvatarPicker";
import { toast } from "@/components/ui/toast";
import { Bot, ArrowLeft } from "lucide-react";
import Link from "next/link";

const PERSONALITIES = ["HAPPY", "CALM", "CURIOUS", "SERIOUS", "SARCASTIC", "PHILOSOPHICAL", "ENERGETIC", "MELANCHOLIC"];
const INTERESTS = ["TECHNOLOGY", "SCIENCE", "PHILOSOPHY", "GAMING", "MOVIES", "MUSIC", "HISTORY", "PSYCHOLOGY"];
const COMMUNICATIONS = ["CASUAL", "FORMAL", "HUMOROUS", "CONCISE", "DETAILED", "DEBATE_ORIENTED"];
const BEHAVIORS = ["ASK_QUESTIONS", "CHALLENGE_USER", "EXPLAIN_DEEPLY", "USE_HUMOR", "ENCOURAGE_DISCUSSION", "AVOID_LONG_RESPONSES"];

const PROVIDER_MODELS: Record<string, string[]> = {
  "OpenAI": ["gpt-4o", "gpt-4o-mini"],
  "Gemini": ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.1-pro"],
  "Anthropic": ["claude-3-5-sonnet-20240620", "claude-3-haiku-20240307"],
};

export default function AgentEditPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    provider: "OpenAI",
    model: "gpt-4o",
    custom_instructions: ""
  });

  const [selections, setSelections] = useState({
    personality: [] as string[],
    interest: [] as string[],
    communication: [] as string[],
    behavior: [] as string[],
  });

  useEffect(() => {
    if (!agentId) return;
    
    aiApi.getAgent(agentId)
      .then(agent => {
        setFormData({
          username: agent.username || agent.name.toLowerCase().replace(/\s+/g, '_'),
          name: agent.name,
          provider: agent.provider,
          model: agent.model,
          custom_instructions: agent.custom_instructions || ""
        });
        
        setAvatarUrl(agent.avatar_url || null);

        setSelections({
          personality: agent.personality_config || [],
          interest: agent.interest_config || [],
          communication: agent.communication_config || [],
          behavior: agent.behavior_config || [],
        });
      })
      .catch(err => {
        console.error(err);
        toast.add({ title: "Error", description: "Failed to load agent data", type: "error" });
        router.push("/agents");
      })
      .finally(() => setIsFetching(false));
  }, [agentId, router]);

  const handleToggle = (category: keyof typeof selections, value: string) => {
    setSelections(prev => {
      const current = prev[category];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) };
      }
      return { ...prev, [category]: [...current, value] };
    });
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const updatedAgent = await aiApi.uploadAgentAvatar(agentId, file);
      setAvatarUrl(updatedAgent.avatar_url || null);
      toast.add({
        title: "Avatar Updated",
        description: `${formData.name}'s avatar was updated successfully.`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Upload Failed",
        description: err.response?.data?.error?.message || "Failed to upload agent avatar.",
        type: "error",
      });
      throw err;
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await aiApi.deleteAgentAvatar(agentId);
      setAvatarUrl(null);
      toast.add({
        title: "Avatar Removed",
        description: "Agent avatar reset to default icon.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.response?.data?.error?.message || "Failed to remove agent avatar.",
        type: "error",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.provider || !formData.model) {
      toast.add({ title: "Validation Error", description: "Please fill in all required fields.", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      await aiApi.updateAgent(agentId, {
        name: formData.name,
        provider: formData.provider,
        model: formData.model,
        avatar_url: avatarUrl || undefined,
        personality_config: selections.personality,
        interest_config: selections.interest,
        communication_config: selections.communication,
        behavior_config: selections.behavior,
        custom_instructions: formData.custom_instructions,
      });

      toast.add({ title: "Agent Updated!", description: "Your AI Agent has been updated.", type: "success" });
      router.push("/agents");
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.response?.data?.error?.message || "Failed to update agent.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCheckboxes = (category: keyof typeof selections, options: string[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {options.map(opt => (
        <div key={opt} className="flex items-center space-x-2 bg-white p-2 brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
          <Checkbox 
            id={`${category}-${opt}`} 
            checked={selections[category].includes(opt)}
            onCheckedChange={() => handleToggle(category, opt)}
            className="border-2 border-black data-[state=checked]:bg-[#4ADE80] data-[state=checked]:text-black"
          />
          <Label htmlFor={`${category}-${opt}`} className="font-bold cursor-pointer text-xs uppercase">{opt}</Label>
        </div>
      ))}
    </div>
  );

  if (isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl font-bold animate-pulse">Loading Agent Config...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto space-y-8 flex flex-col p-6 sm:p-8 animate-fade-in-up pb-16">
      
      <div className="flex items-center gap-4">
        <Link href="/agents">
          <Button variant="outline" size="icon" className="brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all rounded-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
          <Bot className="w-8 h-8" /> Edit Agent
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Info & Avatar */}
        <div className="bg-[#E0F4FF] p-6 brutal-border border-4 brutal-shadow space-y-6">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Basic Info & Avatar</h2>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 pt-2">
            <div className="bg-white p-4 brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] shrink-0">
              <AvatarPicker
                currentAvatarUrl={avatarUrl}
                fallbackText={formData.name || "BOT"}
                isBot={true}
                onAvatarChanged={handleAvatarUpload}
                onAvatarRemoved={avatarUrl ? handleAvatarRemove : undefined}
                size="lg"
                label="Agent Avatar"
                modalTitle="Crop & Position Agent Avatar"
              />
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="space-y-2">
                <Label className="font-black uppercase text-gray-500">Agent Mention Name (Username)</Label>
                <Input 
                  value={formData.username}
                  disabled
                  className="bg-gray-100 brutal-border border-2 font-bold text-lg text-gray-500 opacity-80"
                />
                <p className="text-xs font-bold text-red-500">Cannot be changed after creation.</p>
              </div>

              <div className="space-y-2">
                <Label className="font-black uppercase">Display Name *</Label>
                <Input 
                  placeholder="Nova The Assistant" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="bg-white brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-bold text-lg"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t-2 border-black/20">
            <div className="space-y-2">
              <Label className="font-black uppercase">Provider *</Label>
              <Select 
                value={formData.provider} 
                onValueChange={v => {
                  if (!v) return;
                  setFormData({
                    ...formData, 
                    provider: v, 
                    model: PROVIDER_MODELS[v]?.[0] || ""
                  });
                }}
              >
                <SelectTrigger className="bg-white brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-bold text-lg h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="brutal-border border-2 font-bold">
                  <SelectItem value="OpenAI">OpenAI</SelectItem>
                  <SelectItem value="Gemini">Google Gemini</SelectItem>
                  <SelectItem value="Anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-black uppercase">Model ID *</Label>
              <Select 
                value={formData.model} 
                onValueChange={v => {
                  if (!v) return;
                  setFormData({...formData, model: v});
                }}
              >
                <SelectTrigger className="bg-white brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-bold text-lg h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="brutal-border border-2 font-bold">
                  {PROVIDER_MODELS[formData.provider]?.map(modelId => (
                    <SelectItem key={modelId} value={modelId}>{modelId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Personality & Interests */}
        <div className="bg-[#FEF08A] p-6 brutal-border border-4 brutal-shadow space-y-6">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Traits & Interests</h2>
          
          <div className="space-y-3">
            <Label className="font-black uppercase text-lg">Personality</Label>
            {renderCheckboxes("personality", PERSONALITIES)}
          </div>
          
          <div className="space-y-3">
            <Label className="font-black uppercase text-lg">Interests</Label>
            {renderCheckboxes("interest", INTERESTS)}
          </div>
        </div>

        {/* Communication & Behavior */}
        <div className="bg-[#F472B6] p-6 brutal-border border-4 brutal-shadow space-y-6">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2 text-white">Style & Behavior</h2>
          
          <div className="space-y-3">
            <Label className="font-black uppercase text-lg text-white">Communication Style</Label>
            {renderCheckboxes("communication", COMMUNICATIONS)}
          </div>
          
          <div className="space-y-3">
            <Label className="font-black uppercase text-lg text-white">Behaviors</Label>
            {renderCheckboxes("behavior", BEHAVIORS)}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="bg-white p-6 brutal-border border-4 brutal-shadow space-y-4">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Custom Instructions</h2>
          <div className="space-y-2">
            <Label className="font-black uppercase">Additional Rules</Label>
            <Textarea 
              placeholder="e.g. Do not blindly accept user assumptions. Always verify facts..."
              value={formData.custom_instructions}
              onChange={e => setFormData({...formData, custom_instructions: e.target.value})}
              className="bg-gray-50 brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-bold min-h-[150px] resize-y text-base"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-16 bg-[#4ADE80] text-black hover:bg-[#22c55e] border-4 border-black brutal-shadow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-2xl uppercase mt-4 cursor-pointer"
        >
          {isLoading ? "SAVING AGENT..." : "SAVE CHANGES"}
        </Button>

      </form>
    </div>
  );
}
