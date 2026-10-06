import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Bot, 
  UserPlus, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check, 
  Edit3, 
  Loader2,
  Flag,
  Coins,
  Award,
  Palette,
  ArrowLeft,
  Save
} from "lucide-react";
import { BADGE_CATALOG } from "@/data/badges";
import { ReportUserModal } from "@/components/moderation/ReportUserModal";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api/users";
import { friendsApi } from "@/lib/api/friends";
import { getAvatarUrl, getBannerStyle } from "@/lib/avatar";
import { PublicUserProfile } from "@/types";
import { toast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { READY_AVATARS } from "@/lib/readyAvatars";
import { AvatarFrame } from "@/components/avatar/AvatarFrame";
import { 
  getEquippedCosmetics, 
  getBorderClass, 
  getTitleBadge, 
  EquippedCosmetics 
} from "@/lib/cosmetics";

const BANNER_THEMES = [
  { id: "theme:cyan", name: "Cyber Cyan", color: "bg-[#06B6D4]" },
  { id: "theme:purple", name: "Electric Violet", color: "bg-[#8B5CF6]" },
  { id: "theme:emerald", name: "Emerald Matrix", color: "bg-[#10B981]" },
  { id: "theme:yellow", name: "Warm Yellow", color: "bg-[#FEF08A]" },
  { id: "theme:sunset", name: "Sunset Coral", color: "bg-gradient-to-r from-[#F472B6] to-[#FB923C]" },
  { id: "theme:dark", name: "Midnight Dark", color: "bg-[#18181B]" },
  { id: "theme:pink", name: "Rose Pink", color: "bg-[#F472B6]" },
];

interface UserProfileDialogProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileDialog({ userId, isOpen, onClose }: UserProfileDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSendingFriendReq, setIsSendingFriendReq] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [equippedCosmetics, setEquippedCosmetics] = useState<EquippedCosmetics>({});

  // Sync cosmetics
  useEffect(() => {
    setEquippedCosmetics(getEquippedCosmetics());
    const handleCosmeticsUpdate = (e: any) => {
      if (e.detail) {
        setEquippedCosmetics(e.detail);
      }
    };
    window.addEventListener("lobby:cosmetics_updated", handleCosmeticsUpdate);
    return () => {
      window.removeEventListener("lobby:cosmetics_updated", handleCosmeticsUpdate);
    };
  }, []);

  // Profile Dialog Inline Customization State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string>("");
  const [customBanner, setCustomBanner] = useState<string>("");
  const [customBio, setCustomBio] = useState<string>("");
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      setError(null);
      usersApi.getUserProfile(userId)
        .then((data) => {
          setProfile(data);
          if (user && user.id === data.id) {
            setCustomAvatar(user.avatar_url || data.avatar_url || "");
            setCustomBanner(user.banner_url || data.banner_url || "theme:cyan");
            setCustomBio(user.bio || data.bio || "");
          }
        })
        .catch(err => {
          console.error("Failed to load profile", err);
          setError("Profil yüklenemedi.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, userId, user]);

  useEffect(() => {
    if (!isOpen) {
      setIsCustomizing(false);
    }
  }, [isOpen]);

  const handleSaveCustomization = async () => {
    if (!profile) return;
    setIsSavingCustomization(true);
    try {
      const updated = await usersApi.updateProfile({
        avatar_url: customAvatar,
        banner_url: customBanner,
        bio: customBio,
      });
      updateUser(updated);
      setProfile((prev) => prev ? {
        ...prev,
        avatar_url: updated.avatar_url,
        banner_url: updated.banner_url,
        bio: updated.bio,
      } : null);
      if (typeof window !== "undefined") {
        localStorage.setItem(`lobby-ai:user-status-${profile.id}`, customBio);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(profile.id) });
      toast.add({
        title: "Profil Güncellendi",
        description: "Görünüm ayarlarınız başarıyla kaydedildi.",
        type: "success",
      });
      setIsCustomizing(false);
    } catch (err: any) {
      toast.add({
        title: "Hata",
        description: err.response?.data?.error?.message || "Profil güncellenemedi.",
        type: "error",
      });
    } finally {
      setIsSavingCustomization(false);
    }
  };

  const handleCopyUsername = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`@${profile.username}`);
    setCopied(true);
    toast.add({
      title: "Kopyalandı",
      description: `@${profile.username} panoya kopyalandı.`,
      type: "info",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendFriendRequest = async () => {
    if (!profile) return;
    setIsSendingFriendReq(true);
    try {
      await friendsApi.sendFriendRequest({ username: profile.username });
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      toast.add({
        title: "İstek Gönderildi",
        description: `@${profile.username} kullanıcısına arkadaşlık isteği iletildi.`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "İstek Gönderilemedi",
        description: err.response?.data?.error?.message || "Arkadaşlık isteği gönderilirken hata oluştu.",
        type: "error",
      });
    } finally {
      setIsSendingFriendReq(false);
    }
  };

  const isSelf = Boolean(
    (user && profile && user.id === profile.id) ||
    (user && userId && user.id === userId)
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-testid="profile-card-dialog-content" className="sm:max-w-[480px] w-[95vw] max-h-[90vh] bg-white brutal-border border-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none p-0 overflow-hidden flex flex-col">
        {loading ? (
          <div className="h-[420px] flex flex-col items-center justify-center gap-3 bg-yellow-50">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <p className="font-black text-sm uppercase tracking-wider">Profil Yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="h-[420px] flex flex-col items-center justify-center gap-2 p-6 text-center bg-red-50">
            <p className="font-black text-base text-red-600 uppercase">Profil Yüklenemedi</p>
            <p className="text-xs font-bold text-gray-600">{error}</p>
            <Button 
              size="sm"
              onClick={onClose} 
              className="mt-4 brutal-btn bg-white text-black text-xs font-black"
            >
              Kapat
            </Button>
          </div>
        ) : profile ? (
          isCustomizing ? (
            <div className="flex flex-col max-h-[90vh] overflow-y-auto">
              {/* Customizer Header */}
              <div className="p-4 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] border-b-4 border-black flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-white" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Görünümü Özelleştir</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomizing(false)}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Geri
                </button>
              </div>

              {/* Live Preview Section */}
              <div className="p-4 bg-[#F4F0E6] border-b-2 border-black space-y-2 shrink-0">
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Canlı Önizleme</p>
                <div className="border-3 border-black bg-white shadow-[4px_4px_0_0_#000] overflow-hidden">
                  {(() => {
                    const bannerStyle = getBannerStyle(customBanner);
                    return (
                      <div className={`h-16 border-b-2 border-black relative p-2 ${bannerStyle.className}`} style={bannerStyle.style}>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-[#FEF08A] text-black border border-black shadow-[1px_1px_0_0_#000]">
                          🛡️ ÜYE
                        </span>
                      </div>
                    );
                  })()}
                  <div className="px-3 pb-3 pt-0">
                    <div className="flex items-end justify-between -mt-8 mb-1.5">
                      <Avatar className="w-14 h-14 border-3 border-black shadow-[2px_2px_0_0_#000] bg-[#FEF9C3]">
                        <AvatarImage src={getAvatarUrl(customAvatar)} alt={profile.username} className="object-cover" />
                        <AvatarFallback className="bg-[#06B6D4] font-black text-xl text-black">
                          {profile.display_name?.charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-right">
                        <span className="text-xs font-black text-black">@{profile.username}</span>
                      </div>
                    </div>
                    {customBio && (
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-[#FEF08A] border border-black shadow-[1px_1px_0_0_#000] text-[10px] font-black text-black">
                        <span>💬 {customBio}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customization Controls */}
              <div className="p-4 space-y-4">
                {/* 1. Banner Theme */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5 mb-2">
                    <Palette className="w-3.5 h-3.5 text-[#06B6D4]" /> Kapak Teması
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {BANNER_THEMES.map((theme) => {
                      const isSelected = customBanner === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setCustomBanner(theme.id)}
                          className={`flex flex-col items-center gap-1 p-1.5 border-2 border-black rounded-sm cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[#FEF08A] ring-2 ring-black shadow-[2px_2px_0_0_#000] -translate-y-0.5"
                              : "bg-white hover:bg-gray-100 shadow-[1px_1px_0_0_#000]"
                          }`}
                          title={theme.name}
                        >
                          <div className={`w-full h-6 rounded-xs border border-black ${theme.color} relative`}>
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check className="w-3 h-3 text-black font-black drop-shadow" />
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] font-bold truncate w-full text-center text-black">{theme.name.split(" ")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Ready Avatars (100 JPGs) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" /> Hazır Avatar Koleksiyonu ({READY_AVATARS.length})
                    </label>
                    <span className="text-[9px] font-mono font-black bg-neutral-100 px-1.5 py-0.5 border border-black">
                      Seçili: #{customAvatar ? customAvatar.replace(/[^0-9]/g, "") || "1" : "—"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 p-2 bg-[#F4F0E6] border-2 border-black shadow-[2px_2px_0_0_#000]">
                    {READY_AVATARS.map((ravatar) => {
                      const isSelected = customAvatar === ravatar.path;
                      return (
                        <button
                          key={ravatar.id}
                          type="button"
                          onClick={() => setCustomAvatar(ravatar.path)}
                          className={`relative p-0.5 bg-white border-2 border-black rounded-xs cursor-pointer transition-all ${
                            isSelected
                              ? "ring-2 ring-emerald-500 bg-[#FEF08A] -translate-y-0.5 shadow-[2px_2px_0_0_#000]"
                              : "hover:bg-[#FEF08A] hover:-translate-y-0.5 shadow-[1px_1px_0_0_#000]"
                          }`}
                          title={ravatar.name}
                        >
                          <div className="w-8 h-8 border border-black overflow-hidden bg-gray-100 relative">
                            <img src={ravatar.path} alt={ravatar.name} className="w-full h-full object-cover" loading="lazy" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-emerald-500/40 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-black font-black drop-shadow" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Durum Mesajı / Bio */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5 mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#06B6D4]" /> Durum Mesajı / Biyografi
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={customBio}
                    onChange={(e) => setCustomBio(e.target.value)}
                    placeholder="Örn: Kod yazıyor, kahve içiyor... ☕"
                    className="w-full bg-white h-10 px-3 border-2 border-black font-bold text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
                  />
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mt-1">
                    <span>Profil kartında rozetlerin üstünde görüntülenir.</span>
                    <span>{customBio.length}/100</span>
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="pt-2 flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setIsCustomizing(false)}
                    className="flex-1 bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer h-10"
                  >
                    İptal
                  </Button>
                  <Button
                    type="button"
                    disabled={isSavingCustomization}
                    onClick={handleSaveCustomization}
                    className="flex-1 bg-[#10B981] hover:bg-[#059669] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer h-10 flex items-center justify-center gap-1.5"
                  >
                    {isSavingCustomization ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSavingCustomization ? "Kaydediliyor..." : "Kaydet & Uygula"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Header Cover Banner */}
              {(() => {
                const activeBannerUrl = (user && user.id === profile.id) ? (user.banner_url ?? profile.banner_url) : profile.banner_url;
                const bannerStyle = getBannerStyle(activeBannerUrl);
                return (
                  <div 
                    className={`h-28 border-b-4 border-black relative p-3 flex items-start justify-start ${bannerStyle.className}`}
                    style={bannerStyle.style}
                  >
                    <span className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      profile.is_bot ? "bg-[#F472B6] text-black" : "bg-[#FEF08A] text-black"
                    }`}>
                      {profile.is_bot ? "🤖 YAPAY ZEKA BOTU" : "🛡️ ÜYE"}
                    </span>
                  </div>
                );
              })()}

              {/* Profile Avatar & Identity */}
              <div className="px-6 pb-6 pt-0 relative">
                <div className="flex items-end justify-between -mt-14 mb-4">
                  <div className="relative">
                    <AvatarFrame
                      borderId={isSelf ? equippedCosmetics.border : null}
                      animationId={isSelf ? equippedCosmetics.avatar_animation : null}
                      size="lg"
                    >
                      <div data-testid="profile-card-avatar-border" className="rounded-full transition-all">
                        <Avatar className="w-24 h-24 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-[#FEF9C3]">
                          <AvatarImage src={getAvatarUrl(profile.avatar_url)} alt={profile.username} className="object-cover" />
                          <AvatarFallback className="bg-[#06B6D4] font-black text-3xl text-black">
                            {profile.is_bot ? (
                              <Bot className="w-12 h-12 text-black" />
                            ) : (
                              profile.display_name?.charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase()
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </AvatarFrame>
                    {/* Status dot */}
                    <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#4ADE80] border-2 border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] z-10" title="Çevrim İçi" />
                  </div>

                  {/* Copy handle button */}
                  <button
                    type="button"
                    onClick={handleCopyUsername}
                    className="px-2.5 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-px transition-all cursor-pointer flex items-center gap-1.5"
                    title="Kullanıcı Adını Kopyala"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                    <span className="text-black">{copied ? "Kopyalandı" : "Kopyala"}</span>
                  </button>
                </div>

                {/* Names & Handle */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-black text-black tracking-tight flex items-center gap-2">
                      {profile.display_name || profile.username}
                      {profile.is_bot && (
                        <span className="text-xs bg-black text-white px-2 py-0.5 rounded font-black uppercase">
                          BOT
                        </span>
                      )}
                    </h2>
                    {isSelf && (() => {
                      const activeTitle = getTitleBadge(equippedCosmetics.title);
                      if (!activeTitle) return null;
                      return (
                        <span
                          data-testid="profile-card-title-badge"
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-black uppercase ${activeTitle.className}`}
                          title={`Kuşanılan Ünvan: ${activeTitle.name}`}
                        >
                          <span>{activeTitle.icon}</span>
                          <span>{activeTitle.name}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-sm font-bold text-gray-600 flex items-center gap-1">
                    <span>@{profile.username}</span>
                  </p>
                </div>

                {/* Status Tagline */}
                {(() => {
                  const userTagline = profile.tagline || (typeof window !== "undefined" ? localStorage.getItem(`lobby-ai:user-status-${profile.id}`) : null);
                  if (!userTagline) return null;
                  return (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF08A] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-xs font-black text-black">
                      <span>💬 {userTagline}</span>
                    </div>
                  );
                })()}

                {/* Stats Bar */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t-2 border-black/20">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E0F4FF] !text-blue-950 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-black uppercase">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" />
                    <span>Katılım: {new Date(profile.created_at).toLocaleDateString("tr-TR")}</span>
                  </div>
                  {!profile.is_bot && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FEF08A] !text-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-black uppercase">
                      <Coins className="w-3.5 h-3.5 text-black" />
                      <span>{profile.coins ?? 0} Coin</span>
                    </div>
                  )}
                  {profile.is_bot ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F3E8FF] !text-purple-950 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-black uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                      <span>Otonom Ajan</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#DCFCE7] !text-emerald-950 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[11px] font-black uppercase">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Doğrulanmış Üye</span>
                    </div>
                  )}
                </div>

                {/* Bio & Public Bio Box */}
                {profile.is_bot ? (
                  <div className="mt-3 bg-[#CFFAFE] border-2 border-black p-3.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-cyan-900 flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5" /> Ajan Açıklaması & Görevi
                      </p>
                      {profile.owner_username && (
                        <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                          Oluşturan: @{profile.owner_username}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-800 break-words leading-relaxed">
                      {profile.public_bio || profile.bio || "Bu yapay zeka ajanı lobide sohbet etmek ve oyunlara katılmak için yapılandırıldı."}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 bg-[#FEF08A] border-2 border-black p-3.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-black uppercase tracking-wider !text-black font-mono mb-1">
                      Biyografi
                    </p>
                    <p className="text-xs font-bold !text-black break-words leading-relaxed">
                      {profile.bio || "Bu kullanıcı henüz bir biyografi eklemedi."}
                    </p>
                  </div>
                )}

                {/* Badges Section */}
                {profile.badges && profile.badges.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-black/70 mb-1.5 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" /> Rozetler & Başarımlar ({profile.badges.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      {profile.badges.map((badgeId) => {
                        const badgeMeta = BADGE_CATALOG.find((b) => b.id === badgeId) || {
                          id: badgeId,
                          name: badgeId,
                          icon: "🎖️",
                          description: "Kazanılmış Rozet",
                        };
                        return (
                          <div
                            key={badgeId}
                            className="flex items-center gap-1 px-2 py-0.5 bg-[#FDFBF7] hover:bg-[#FEF08A] border border-black text-[10px] font-black text-black rounded-xs shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-colors cursor-default"
                            title={`${badgeMeta.name}: ${badgeMeta.description}`}
                          >
                            <span>{badgeMeta.icon}</span>
                            <span>{badgeMeta.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-5 pt-2 flex flex-col sm:flex-row gap-2.5">
                  {isSelf ? (
                    <div className="flex gap-2 w-full">
                      <Button
                        onClick={() => setIsCustomizing(true)}
                        className="flex-1 bg-[#06B6D4] hover:bg-[#0891B2] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer h-10 flex items-center justify-center gap-1.5"
                      >
                        <Palette className="w-4 h-4" />
                        Görünümü Özelleştir
                      </Button>
                      <Button
                        onClick={() => {
                          router.push("/profile");
                          onClose();
                        }}
                        className="px-3 bg-white hover:bg-gray-100 text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer h-10 flex items-center justify-center gap-1"
                        title="Tam Profil Sayfası"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Detaylı Düzenle</span>
                      </Button>
                    </div>
                  ) : (
                  <>
                    {!profile.is_bot && (
                      <Button
                        onClick={() => {
                          router.push(`/messages?userId=${profile.id}`);
                          onClose();
                        }}
                        className="flex-1 bg-[#FEF08A] hover:bg-[#fde047] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer h-10"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mesaj Gönder
                      </Button>
                    )}

                    {!profile.is_bot && (
                      <Button
                        onClick={handleSendFriendRequest}
                        disabled={isSendingFriendReq}
                        className="flex-1 bg-[#4ADE80] hover:bg-[#22c55e] text-black border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer h-10"
                      >
                        {isSendingFriendReq ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        Arkadaş Ekle
                      </Button>
                    )}

                    {!profile.is_bot && (
                      <Button
                        variant="outline"
                        onClick={() => setReportModalOpen(true)}
                        className="h-10 px-3 bg-[#FFE4E6] hover:bg-[#FECDD3] text-red-700 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer"
                        title="Kullanıcıyı Şikayet Et"
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    )}

                    {profile.is_bot && (
                      <div className="w-full text-center py-2 bg-purple-50 border-2 border-black text-xs font-black uppercase text-purple-900">
                        🤖 Yapay Zeka Ajanı • Lobilerde @{profile.username} ile bahsedebilirsiniz
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      ) : null}

        {/* Report User Modal */}
        {profile && (
          <ReportUserModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            targetUser={{
              id: profile.id,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
