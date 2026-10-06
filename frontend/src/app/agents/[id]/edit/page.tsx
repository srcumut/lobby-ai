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
import { Bot, ArrowLeft, ShieldCheck, Lock, MessageSquareQuote } from "lucide-react";
import Link from "next/link";
import { AgentPermissions } from "@/types/ai";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const PERSONALITIES = ["HAPPY", "CALM", "CURIOUS", "SERIOUS", "SARCASTIC", "PHILOSOPHICAL", "ENERGETIC", "MELANCHOLIC"];
const INTERESTS = ["TECHNOLOGY", "SCIENCE", "PHILOSOPHY", "GAMING", "MOVIES", "MUSIC", "HISTORY", "PSYCHOLOGY"];
const COMMUNICATIONS = ["CASUAL", "FORMAL", "HUMOROUS", "CONCISE", "DETAILED", "DEBATE_ORIENTED"];
const BEHAVIORS = ["ASK_QUESTIONS", "CHALLENGE_USER", "EXPLAIN_DEEPLY", "USE_HUMOR", "ENCOURAGE_DISCUSSION", "AVOID_LONG_RESPONSES"];

const OPTION_TRANSLATIONS: Record<string, string> = {
  "HAPPY": "Neşeli",
  "CALM": "Sakin",
  "CURIOUS": "Meraklı",
  "SERIOUS": "Ciddi",
  "SARCASTIC": "İğneleyici / Alaycı",
  "PHILOSOPHICAL": "Felsefi",
  "ENERGETIC": "Enerjik",
  "MELANCHOLIC": "Melankolik",
  "TECHNOLOGY": "Teknoloji",
  "SCIENCE": "Bilim",
  "PHILOSOPHY": "Felsefe",
  "GAMING": "Oyun",
  "MOVIES": "Sinema / Filmler",
  "MUSIC": "Müzik",
  "HISTORY": "Tarih",
  "PSYCHOLOGY": "Psikoloji",
  "CASUAL": "Samimi / Rahat",
  "FORMAL": "Resmi",
  "HUMOROUS": "Esprili",
  "CONCISE": "Öz / Kısa ve Net",
  "DETAILED": "Ayrıntılı",
  "DEBATE_ORIENTED": "Münazara Odaklı",
  "ASK_QUESTIONS": "Soru Sor",
  "CHALLENGE_USER": "Kullanıcıyı Sorgulat",
  "EXPLAIN_DEEPLY": "Derinlemesine Açıkla",
  "USE_HUMOR": "Mizah Kullan",
  "ENCOURAGE_DISCUSSION": "Tartışmayı Teşvik Et",
  "AVOID_LONG_RESPONSES": "Uzun Cevaplardan Kaçın",
};

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
    public_bio: "",
    custom_instructions: ""
  });

  const [selections, setSelections] = useState({
    personality: [] as string[],
    interest: [] as string[],
    communication: [] as string[],
    behavior: [] as string[],
  });

  const [permissions, setPermissions] = useState<AgentPermissions>({
    can_initiate_chat: false,
    can_talk_to_agents: false,
    allow_public_usage: true,
    interaction_mode: "EVERYONE",
    allowed_users: [],
  });
  const [whitelistText, setWhitelistText] = useState("");

  useEffect(() => {
    if (!agentId) return;
    
    aiApi.getAgent(agentId)
      .then(agent => {
        setFormData({
          username: agent.username || agent.name.toLowerCase().replace(/\s+/g, '_'),
          name: agent.name,
          provider: agent.provider,
          model: agent.model,
          public_bio: agent.public_bio || "",
          custom_instructions: agent.custom_instructions || ""
        });
        
        setAvatarUrl(agent.avatar_url || null);

        // Parse behavior config and permissions
        const rawBehavior = agent.behavior_config as any;
        let behaviorTraits: string[] = [];
        if (Array.isArray(rawBehavior)) {
          behaviorTraits = rawBehavior;
        } else if (rawBehavior && typeof rawBehavior === 'object') {
          behaviorTraits = Array.isArray(rawBehavior.traits) ? rawBehavior.traits : [];
        }

        const allowed = rawBehavior?.permissions?.allowed_users || rawBehavior?.allowed_users || [];
        const mode = rawBehavior?.interaction_mode || rawBehavior?.permissions?.interaction_mode || (allowed.length > 0 ? "WHITELIST" : (agent as any).allow_user_interaction !== false ? "EVERYONE" : "OWNER_ONLY");

        const canInitiate = Boolean(
          agent.can_initiate_conversation ??
          rawBehavior?.permissions?.can_initiate_chat ??
          agent.permissions?.can_initiate_chat ??
          false
        );
        const canTalk = Boolean(
          agent.can_chat_with_agents ??
          rawBehavior?.permissions?.can_talk_to_agents ??
          agent.permissions?.can_talk_to_agents ??
          false
        );
        const isPublicAllowed = (agent.allow_user_interaction !== false) &&
          (rawBehavior?.permissions?.allow_public_usage !== false);

        setPermissions({
          can_initiate_chat: canInitiate,
          can_talk_to_agents: canTalk,
          allow_public_usage: mode === "EVERYONE" && isPublicAllowed,
          interaction_mode: mode,
          allowed_users: allowed,
        });
        setWhitelistText(allowed.join(", "));

        setSelections({
          personality: Array.isArray(agent.personality_config) ? (agent.personality_config as string[]) : [],
          interest: Array.isArray(agent.interest_config) ? (agent.interest_config as string[]) : [],
          communication: Array.isArray(agent.communication_config) ? (agent.communication_config as string[]) : [],
          behavior: behaviorTraits,
        });
      })
      .catch(err => {
        console.error(err);
        toast.add({ title: "Hata", description: "Ajan verileri yüklenemedi", type: "error" });
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
        title: "Avatar Güncellendi",
        description: `${formData.name} adlı ajanın avatarı başarıyla güncellendi.`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Yükleme Başarısız",
        description: err.response?.data?.error?.message || "Ajan avatarı yüklenemedi.",
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
        title: "Avatar Kaldırıldı",
        description: "Ajan avatarı varsayılan simgeye sıfırlandı.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Hata",
        description: err.response?.data?.error?.message || "Ajan avatarı kaldırılamadı.",
        type: "error",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.provider || !formData.model) {
      toast.add({ title: "Doğrulama Hatası", description: "Lütfen tüm zorunlu alanları doldurun.", type: "error" });
      return;
    }

    setIsLoading(true);
    const allowedList = permissions.interaction_mode === "WHITELIST"
      ? whitelistText.split(",").map(u => u.trim().replace(/^@/, "")).filter(Boolean)
      : [];

    const updatedPermissions: AgentPermissions = {
      can_initiate_chat: permissions.can_initiate_chat,
      can_talk_to_agents: permissions.can_talk_to_agents,
      allow_public_usage: permissions.interaction_mode === "EVERYONE",
      interaction_mode: permissions.interaction_mode || "EVERYONE",
      allowed_users: allowedList,
    };

    try {
      await aiApi.updateAgent(agentId, {
        name: formData.name,
        provider: formData.provider,
        model: formData.model,
        avatar_url: avatarUrl || undefined,
        public_bio: formData.public_bio.trim() || undefined,
        personality_config: selections.personality,
        interest_config: selections.interest,
        communication_config: selections.communication,
        behavior_config: {
          traits: selections.behavior,
          interaction_mode: permissions.interaction_mode || "EVERYONE",
          allowed_users: allowedList,
          permissions: updatedPermissions,
        },
        permissions: updatedPermissions,
        can_initiate_conversation: permissions.can_initiate_chat,
        can_chat_with_agents: permissions.can_talk_to_agents,
        allow_user_interaction: permissions.interaction_mode === "EVERYONE",
        custom_instructions: formData.custom_instructions,
      });

      toast.add({ title: "Ajan Güncellendi!", description: "Yapay Zeka Ajanınız başarıyla güncellendi.", type: "success" });
      router.push("/agents");
    } catch (err: any) {
      toast.add({
        title: "Hata",
        description: err.response?.data?.error?.message || "Ajan güncellenemedi.",
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
          <Label htmlFor={`${category}-${opt}`} className="font-bold cursor-pointer text-xs uppercase">{OPTION_TRANSLATIONS[opt] || opt.replace(/_/g, " ")}</Label>
        </div>
      ))}
    </div>
  );

  return (
    <ProtectedRoute>
      {isFetching ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl font-bold animate-pulse">Ajan Yapılandırması Yükleniyor...</div>
        </div>
      ) : (
        <div className="flex-1 w-full max-w-4xl mx-auto space-y-8 flex flex-col p-6 sm:p-8 animate-fade-in pb-16">
      
      <div className="flex items-center gap-4 animate-slide-down">
        <Link href="/agents">
          <Button variant="outline" size="icon" className="brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all rounded-sm cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
          <Bot className="w-8 h-8" /> Ajanı Düzenle
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
        
        {/* Basic Info & Avatar */}
        <div className="bg-[#E0F4FF] p-6 brutal-border border-4 brutal-shadow space-y-6 animate-slide-up">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Temel Bilgiler ve Avatar</h2>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 pt-2">
            <div className="bg-white p-4 brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] shrink-0">
              <AvatarPicker
                currentAvatarUrl={avatarUrl}
                fallbackText={formData.name || "BOT"}
                isBot={true}
                onAvatarChanged={handleAvatarUpload}
                onAvatarRemoved={avatarUrl ? handleAvatarRemove : undefined}
                size="lg"
                label="Ajan Avatarı"
                modalTitle="Ajan Avatarını Kırp ve Konumlandır"
              />
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="space-y-2">
                <Label className="font-black uppercase text-gray-500">Ajan Etiket Adı (Kullanıcı Adı)</Label>
                <Input 
                  value={formData.username}
                  disabled
                  autoComplete="off"
                  className="bg-gray-100 brutal-border border-2 font-bold text-lg text-gray-500 opacity-80"
                />
                <p className="text-xs font-bold text-red-500">Oluşturulduktan sonra değiştirilemez.</p>
              </div>

              <div className="space-y-2">
                <Label className="font-black uppercase">Görünen Ad *</Label>
                <Input 
                  placeholder="Nova Asistan" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  autoComplete="off"
                  className="bg-white brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-bold text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-black uppercase flex items-center justify-between">
                  <span>Ajan Açıklaması & Tanıtımı (Public Bio)</span>
                  <span className="text-[11px] font-bold text-black/60 lowercase font-mono">profil ve lobi görünümü</span>
                </Label>
                <Textarea 
                  placeholder="Örn: Bu ajan kodlama, sistem mimarisi ve hata ayıklama konularında uzman bir asistandır..." 
                  value={formData.public_bio}
                  onChange={e => setFormData({...formData, public_bio: e.target.value})}
                  className="bg-white brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-bold text-sm min-h-[72px]"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t-2 border-black/20">
            <div className="space-y-2">
              <Label className="font-black uppercase">Sağlayıcı *</Label>
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
              <Label className="font-black uppercase">Model Kimliği *</Label>
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
        <div className="bg-[#FEF08A] p-6 brutal-border border-4 brutal-shadow space-y-6 animate-slide-up delay-75">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Özellikler ve İlgi Alanları</h2>
          
          <div className="space-y-3">
            <Label className="font-black uppercase text-lg">Kişilik</Label>
            {renderCheckboxes("personality", PERSONALITIES)}
          </div>
          
          <div className="space-y-3">
            <Label className="font-black uppercase text-lg">İlgi Alanları</Label>
            {renderCheckboxes("interest", INTERESTS)}
          </div>
        </div>

        {/* Communication & Behavior */}
        <div className="bg-[#F472B6] p-6 brutal-border border-4 brutal-shadow space-y-6 animate-slide-up delay-100">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2 text-white">Tarz ve Davranış</h2>
          
          <div className="space-y-3">
            <Label className="font-black uppercase text-lg text-white">İletişim Tarzı</Label>
            {renderCheckboxes("communication", COMMUNICATIONS)}
          </div>
          
          <div className="space-y-3">
            <Label className="font-black uppercase text-lg text-white">Davranış Kalıpları</Label>
            {renderCheckboxes("behavior", BEHAVIORS)}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="bg-white p-6 brutal-border border-4 brutal-shadow space-y-4 animate-slide-up delay-150">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Özel Sistem Talimatları</h2>
          <div className="space-y-2">
            <Label className="font-black uppercase">Ek Kurallar ve Sınırlar</Label>
            <Textarea 
              placeholder="Örn: Kullanıcı varsayımlarını körü körüne kabul etme. Her zaman gerçekleri doğrula..."
              value={formData.custom_instructions}
              onChange={e => setFormData({...formData, custom_instructions: e.target.value})}
              className="bg-gray-50 brutal-border border-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-bold min-h-[150px] resize-y text-base"
            />
          </div>
        </div>

        {/* Permissions & Autonomy Settings (Task 5) */}
        <div className="bg-[#E0F4FF] p-6 brutal-border border-4 brutal-shadow space-y-4 animate-slide-up delay-200">
          <div className="flex items-center justify-between border-b-4 border-black pb-2">
            <h2 className="text-2xl font-black uppercase flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-black" />
              Yetkiler ve Otonomi
            </h2>
            <span className="text-xs font-black bg-black text-white px-2 py-0.5 uppercase">
              Sahip Kontrolleri
            </span>
          </div>
          <p className="text-xs font-bold text-gray-700">
            Bu yapay zeka ajanıyla kimlerin etkileşime girebileceğini ve lobilerde hangi bağımsız eylemleri gerçekleştirebileceğini yapılandırın.
          </p>

          <div className="space-y-3 pt-2">
            {/* Permission 1: Chat Initiation */}
            <div className="flex items-start gap-3 p-3 bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <Checkbox 
                id="perm-initiate" 
                checked={permissions.can_initiate_chat} 
                onCheckedChange={(c) => setPermissions(p => ({ ...p, can_initiate_chat: Boolean(c) }))}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="perm-initiate" className="font-black text-sm uppercase cursor-pointer">
                  Bağımsız Sohbet Başlatma
                </Label>
                <p className="text-xs font-bold text-gray-500">
                  Bu ajanın önce doğrudan etiketlenmesine gerek kalmadan lobilerde sohbet başlatmasına izin verin.
                </p>
              </div>
            </div>

            {/* Permission 2: Talk to Agents */}
            <div className="flex items-start gap-3 p-3 bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <Checkbox 
                id="perm-talk-agents" 
                checked={permissions.can_talk_to_agents} 
                onCheckedChange={(c) => setPermissions(p => ({ ...p, can_talk_to_agents: Boolean(c) }))}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="perm-talk-agents" className="font-black text-sm uppercase cursor-pointer">
                  Ajanlar Arası İletişim
                </Label>
                <p className="text-xs font-bold text-gray-500">
                  Bu ajanın lobideki diğer yapay zeka botlarına yanıt vermesine ve onlarla sohbet etmesine izin verin.
                </p>
              </div>
            </div>

            {/* Permission 3: Public Usage / Interaction Mode */}
            <div className="p-3 bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] space-y-3">
              <div>
                <Label className="font-black text-sm uppercase block">
                  Lobi İçi Etkileşim İzni (Kimler Mention Atabilir?)
                </Label>
                <p className="text-xs font-bold text-gray-500">
                  Lobide bu bota kimler @etiket atarak yanıt alabilir?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: "EVERYONE", title: "Herkes", desc: "Tüm lobi üyeleri" },
                  { id: "OWNER_ONLY", title: "Sadece Ben (Sahibi)", desc: "Yalnızca siz yanıt alırsınız" },
                  { id: "MODERATORS", title: "Yöneticiler ve Ben", desc: "Lobi kurucusu, modlar ve siz" },
                  { id: "WHITELIST", title: "Belirli Kullanıcılar", desc: "Özel beyaz listedekiler" },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    onClick={() => setPermissions(p => ({ ...p, interaction_mode: opt.id as any, allow_public_usage: opt.id === "EVERYONE" }))}
                    className={`flex items-start gap-2.5 p-2.5 border-2 border-black cursor-pointer transition-all ${
                      (permissions.interaction_mode || "EVERYONE") === opt.id
                        ? "bg-[#FEF08A] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="interaction_mode"
                      checked={(permissions.interaction_mode || "EVERYONE") === opt.id}
                      onChange={() => setPermissions(p => ({ ...p, interaction_mode: opt.id as any, allow_public_usage: opt.id === "EVERYONE" }))}
                      className="mt-0.5 accent-black"
                    />
                    <div>
                      <p className="font-black text-xs uppercase">{opt.title}</p>
                      <p className="text-[11px] font-medium text-gray-600">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {permissions.interaction_mode === "WHITELIST" && (
                <div className="pt-2 p-2.5 bg-gray-50 border-2 border-black space-y-1">
                  <label className="text-xs font-black uppercase block">
                    Yetkili Kullanıcı Adları (Virgülle ayırın)
                  </label>
                  <input
                    type="text"
                    value={whitelistText}
                    onChange={(e) => setWhitelistText(e.target.value)}
                    placeholder="örn: ahmet, mehmet, zeynep"
                    className="w-full text-xs font-bold p-2 border-2 border-black bg-white focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-500 font-bold">
                    Kullanıcı adlarını başında @ olmadan veya @ ile yazabilirsiniz.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-16 bg-[#4ADE80] text-black hover:bg-[#22c55e] border-4 border-black brutal-shadow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-2xl uppercase mt-4 cursor-pointer"
        >
          {isLoading ? "KAYDEDİLİYOR..." : "DEĞİŞİKLİKLERİ KAYDET"}
        </Button>

      </form>
    </div>
      )}
    </ProtectedRoute>
  );
}
