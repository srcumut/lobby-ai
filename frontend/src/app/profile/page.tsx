// ============================================================================
// TARGET_DESTINATION: frontend/src/app/profile/page.tsx
// PURPOSE: Enhanced User Profile with 9 Ready Avatars, Status Tagline & Structured Badges
// ============================================================================

"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { usersApi } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AvatarPicker } from "@/components/avatar/AvatarPicker";
import { toast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getBannerStyle, getAvatarUrl } from "@/lib/avatar";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { READY_AVATARS, ALL_PROFILE_BADGES, ReadyAvatar, ProfileBadgeItem } from "@/lib/readyAvatars";
import { playPointSound, playWinSound, playBlipSound } from "@/lib/arcadeSounds";
import { 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  Bot, 
  Camera, 
  Palette,
  Eye,
  Edit3,
  Trash2,
  Trophy,
  CheckCircle2,
  Smile,
  Lock,
  Star,
  Swords,
  Users
} from "lucide-react";

// Neo-brutalist cover themes
const COVER_THEMES = [
  { id: "purple", name: "Mor", bg: "bg-[#A78BFA]" },
  { id: "yellow", name: "Sarı", bg: "bg-[#FEF08A]" },
  { id: "cyan", name: "Cam Göbeği", bg: "bg-[#67e8f9]" },
  { id: "pink", name: "Pembe", bg: "bg-[#f472b6]" },
  { id: "lime", name: "Yeşil", bg: "bg-[#4ADE80]" },
];

export default function ProfilePage() {
  const { user, isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [statusTagline, setStatusTagline] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>("theme:purple");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [showCardModal, setShowCardModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);

  // Badge Category Filter & Featured Badge
  const [badgeFilter, setBadgeFilter] = useState<"all" | "games" | "community" | "ai">("all");
  const [featuredBadgeId, setFeaturedBadgeId] = useState<string>("duel_master");

  // Initialize fields
  useEffect(() => {
    if (user) {
      const parts = (user.display_name || "").trim().split(/\s+/);
      if (parts.length > 1) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(" "));
      } else {
        setFirstName(user.display_name || "");
        setLastName("");
      }
      setBio(user.bio || "");
      setAvatarUrl(user.avatar_url || null);
      setBannerUrl(user.banner_url || "theme:purple");

      try {
        const savedTagline = localStorage.getItem(`lobby-ai:user-status-${user.id}`);
        if (savedTagline) setStatusTagline(savedTagline);
        const savedBadge = localStorage.getItem(`lobby-ai:featured-badge-${user.id}`);
        if (savedBadge) setFeaturedBadgeId(savedBadge);
      } catch (e) {
        console.error(e);
      }
    }
  }, [user, isAuthenticated]);

  const bannerStyle = useMemo(() => getBannerStyle(bannerUrl), [bannerUrl]);

  // Featured badge info
  const featuredBadge = useMemo(() => {
    return ALL_PROFILE_BADGES.find(b => b.id === featuredBadgeId) || ALL_PROFILE_BADGES[0];
  }, [featuredBadgeId]);

  // Handle Ready-Made Avatar Selection
  const handleSelectReadyAvatar = async (avatar: ReadyAvatar) => {
    playPointSound();
    setIsUploadingAvatar(true);
    try {
      // Convert SVG Data URI to a File and upload so it persists across all devices
      const res = await fetch(avatar.dataUri);
      const blob = await res.blob();
      const file = new File([blob], `${avatar.id}.svg`, { type: "image/svg+xml" });
      const updatedUser = await usersApi.uploadAvatar(file);
      setAvatarUrl(updatedUser.avatar_url || null);

      const token = localStorage.getItem("access_token");
      if (token) {
        login(token, updatedUser);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(updatedUser.id) });

      playWinSound();
      toast.add({
        title: "Avatar Güncellendi! 🎨",
        description: `"${avatar.name}" hazır avatarınız başarıyla kaydedildi.`,
        type: "success",
      });
    } catch (err) {
      // Fallback to updateProfile if upload endpoint has SVG restrictions
      try {
        const updatedUser = await usersApi.updateProfile({ avatar_url: avatar.dataUri });
        setAvatarUrl(avatar.dataUri);
        const token = localStorage.getItem("access_token");
        if (token) {
          login(token, updatedUser);
        }
        playWinSound();
        toast.add({
          title: "Avatar Güncellendi! 🎨",
          description: `"${avatar.name}" hazır avatarınız başarıyla kaydedildi.`,
          type: "success",
        });
      } catch (e) {
        toast.add({
          title: "Hata",
          description: "Avatar kaydedilemedi, lütfen tekrar deneyin.",
          type: "error",
        });
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const updatedUser = await usersApi.uploadAvatar(file);
      setAvatarUrl(updatedUser.avatar_url || null);

      const token = localStorage.getItem("access_token");
      if (token) {
        login(token, updatedUser);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(updatedUser.id) });

      toast.add({
        title: "Profil Fotoğrafı Güncellendi",
        description: "Yeni profil fotoğrafınız başarıyla kaydedildi.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Fotoğraf Yüklenemedi",
        description: err.response?.data?.error?.message || "Profil fotoğrafı yüklenirken bir hata oluştu.",
        type: "error",
      });
    }
  };

  const handleAvatarRemove = async () => {
    try {
      const updatedUser = await usersApi.deleteAvatar();
      setAvatarUrl(null);

      const token = localStorage.getItem("access_token");
      if (token) {
        login(token, updatedUser);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(updatedUser.id) });

      toast.add({
        title: "Fotoğraf Kaldırıldı",
        description: "Profil fotoğrafınız başarıyla kaldırıldı.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Hata",
        description: err.response?.data?.error?.message || "Fotoğraf silinemedi.",
        type: "error",
      });
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const updatedUser = await usersApi.uploadBanner(file);
      setBannerUrl(updatedUser.banner_url || null);

      const token = localStorage.getItem("access_token");
      if (token) {
        login(token, updatedUser);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(updatedUser.id) });

      toast.add({
        title: "Kapak Fotoğrafı Yüklendi",
        description: "Yeni kapak fotoğrafınız başarıyla ayarlandı.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Kapak Yüklenemedi",
        description: err.response?.data?.error?.message || "Kapak yüklenirken bir hata oluştu.",
        type: "error",
      });
    } finally {
      setIsUploadingBanner(false);
      e.target.value = "";
    }
  };

  const handleSelectTheme = async (themeId: string) => {
    const newBanner = `theme:${themeId}`;
    setBannerUrl(newBanner);
    try {
      const updatedUser = await usersApi.updateProfile({ banner_url: newBanner });
      const token = localStorage.getItem("access_token");
      if (token) {
        login(token, updatedUser);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(updatedUser.id) });
      toast.add({
        title: "Kapak Teması Seçildi",
        description: "Yeni tema profilinize uygulandı.",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to auto-save theme:", err);
    }
  };

  const handleCoverRemove = async () => {
    try {
      const updatedUser = await usersApi.deleteBanner();
      setBannerUrl("theme:purple");

      const token = localStorage.getItem("access_token");
      if (token) {
        login(token, updatedUser);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(updatedUser.id) });

      toast.add({
        title: "Kapak Sıfırlandı",
        description: "Kapak görseli varsayılan temaya döndürüldü.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Hata",
        description: err.response?.data?.error?.message || "Kapak silinemedi.",
        type: "error",
      });
    }
  };

  const handleSetFeaturedBadge = (badgeId: string) => {
    playBlipSound();
    setFeaturedBadgeId(badgeId);
    if (user) {
      try {
        localStorage.setItem(`lobby-ai:featured-badge-${user.id}`, badgeId);
      } catch (e) {
        console.error(e);
      }
    }
    toast.add({
      title: "Öne Çıkan Rozet Ayarlandı ⭐",
      description: "Seçtiğiniz rozet profilinizde ve sohbet kartlarında vurgulanacak.",
      type: "success",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const combinedName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

    try {
      const updatedUser = await usersApi.updateProfile({
        display_name: combinedName || undefined,
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl?.trim() || undefined,
        banner_url: bannerUrl?.trim() || undefined,
      });

      if (user) {
        try {
          localStorage.setItem(`lobby-ai:user-status-${user.id}`, statusTagline.trim());
        } catch (e) {
          console.error(e);
        }
      }

      const token = localStorage.getItem("access_token");
      if (token) {
        login(token, updatedUser);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(updatedUser.id) });

      playWinSound();
      setMessage({ type: "success", text: "Profil başarıyla kaydedildi!" });
      toast.add({
        title: "Kaydedildi",
        description: "Profil ve durum mesajınız başarıyla kaydedildi.",
        type: "success",
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || "Profil güncellenemedi.";
      setMessage({
        type: "error",
        text: errorMsg,
      });
      toast.add({
        title: "Hata",
        description: errorMsg,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBadges = useMemo(() => {
    if (badgeFilter === "all") return ALL_PROFILE_BADGES;
    return ALL_PROFILE_BADGES.filter(b => b.category === badgeFilter);
  }, [badgeFilter]);

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="flex-1 w-full max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-fade-in-up">
        
        {/* Top Controls: Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
              Kullanıcı Profili & Kimlik
            </h1>
            <p className="text-sm font-bold text-gray-600">
              Profil avatarınızı, durum mesajınızı, kapak görünümünüzü ve rozetlerinizi yönetin.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-[#FDFBF7] p-1 brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer ${
                activeTab === "edit" ? "bg-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]" : "text-black hover:bg-gray-100"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Düzenle
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer ${
                activeTab === "preview" ? "bg-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]" : "text-black hover:bg-gray-100"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Önizleme
            </button>
            <button
              type="button"
              onClick={() => setShowCardModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase bg-[#FEF08A] hover:bg-[#FDE047] text-black border-2 border-black transition-all cursor-pointer shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" /> Profil Kartı
            </button>
          </div>
        </div>

        {/* PROFILE CARD WITH COVER PHOTO BANNER */}
        <div className="bg-[#FFFDF5] brutal-border border-4 brutal-shadow rounded-sm overflow-hidden">
          
          {/* Cover Photo Banner (Kapak Alanı) */}
          <div 
            className={`h-48 sm:h-60 w-full relative p-4 border-b-4 border-black transition-all duration-300 ${bannerStyle.className || "bg-[#A78BFA]"}`}
            style={bannerStyle.style}
          >
            {/* Geometric brutalist accent decor for theme presets */}
            {(!bannerUrl || bannerUrl.startsWith("theme:")) && (
              <>
                <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#FEF08A] brutal-border border-3 rounded-full opacity-50 pointer-events-none transform rotate-12" />
                <div className="absolute right-32 bottom-4 w-12 h-12 bg-white brutal-border border-2 rotate-45 opacity-30 pointer-events-none" />
              </>
            )}

            {/* Hidden file input for custom banner */}
            <input 
              type="file" 
              ref={bannerFileInputRef} 
              accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.jfif,.bmp" 
              onChange={handleCoverUpload} 
              className="hidden" 
            />

            {/* Theme Selector / Cover Styling Bar */}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-2.5 z-10">
              <span className="text-[11px] font-black uppercase flex items-center gap-1 text-black">
                <Palette className="w-3.5 h-3.5 text-[#FB923C]" /> Tema
              </span>
              <div className="flex items-center gap-1.5">
                {COVER_THEMES.map((theme) => {
                  const isSelected = bannerUrl === `theme:${theme.id}` || (!bannerUrl && theme.id === "purple");
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => handleSelectTheme(theme.id)}
                      title={`Tema: ${theme.name}`}
                      className={`w-5 h-5 rounded-full border-2 border-black ${theme.bg} transition-transform cursor-pointer ${
                        isSelected ? "scale-125 ring-2 ring-black" : "hover:scale-110"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Custom Cover Upload & Reset */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
              {bannerUrl && bannerUrl !== "theme:purple" && (
                <button
                  type="button"
                  onClick={handleCoverRemove}
                  className="bg-white hover:bg-red-50 text-red-600 px-2.5 py-1.5 text-xs font-black uppercase flex items-center gap-1.5 brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                  title="Kapağı Sıfırla"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Sıfırla
                </button>
              )}
              <button
                type="button"
                disabled={isUploadingBanner}
                onClick={() => bannerFileInputRef.current?.click()}
                className="bg-black hover:bg-neutral-800 text-white px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1.5 brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                {isUploadingBanner ? (
                  <>Yükleniyor...</>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-[#FEF08A]" /> Özel Kapak Yükle
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Profile Identity Header (Avatar & Badges) */}
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
              
              {/* Avatar Picker / Display */}
              <div className="relative z-20 flex flex-col items-center sm:items-start">
                <AvatarPicker
                  currentAvatarUrl={avatarUrl}
                  fallbackText={user.username}
                  isBot={user.is_bot}
                  onAvatarChanged={handleAvatarUpload}
                  onAvatarRemoved={avatarUrl ? handleAvatarRemove : undefined}
                  size="lg"
                  label="Profil Fotoğrafı"
                  modalTitle="Profil Fotoğrafını Kırp ve Konumlandır"
                />
              </div>

              {/* Active Featured Badge Ribbon */}
              <div className="flex flex-wrap gap-2 items-center">
                <div 
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 brutal-border border-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)] ${featuredBadge.bg} text-black font-black text-xs uppercase`}
                  title={`Öne Çıkan Rozet: ${featuredBadge.description}`}
                >
                  <Star className="w-4 h-4 text-black fill-black" />
                  <span>{featuredBadge.title}</span>
                  <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-xs font-mono ml-1">
                    {featuredBadge.badgeTag}
                  </span>
                </div>
              </div>
            </div>

            {/* User Title, Username & Live Status */}
            <div className="border-b-2 border-black/15 pb-4 space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-3xl font-black text-black">
                  {user.display_name || user.username}
                </h2>
                <span className="text-base font-bold text-gray-500">
                  @{user.username}
                </span>
                {user.is_bot && (
                  <Badge className="bg-black text-white text-xs font-black uppercase">
                    Yapay Zeka Botu
                  </Badge>
                )}
              </div>

              {/* Current Status Message Preview */}
              {statusTagline ? (
                <p className="text-xs font-bold text-black flex items-center gap-1.5 pt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-black inline-block" />
                  <span className="bg-[#FEF08A] px-2 py-0.5 border border-black font-black uppercase text-[11px]">
                    DURUM: {statusTagline}
                  </span>
                </p>
              ) : (
                <p className="text-xs font-bold text-gray-500 italic">
                  Henüz bir durum mesajı belirlemediniz. Aşağıdan ekleyebilirsiniz.
                </p>
              )}
            </div>

            {/* Ready-made Avatars Selector (9 Tarz Avatar) */}
            {activeTab === "edit" && (
              <div className="my-6 p-4 bg-[#F4F0E6] border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FB923C]" />
                    Hazır Neo-Brutalist Avatar Koleksiyonu (9 Tarz)
                  </h3>
                  <span className="text-[10px] font-bold text-gray-600">
                    {isUploadingAvatar ? "Kaydediliyor..." : "Tek tıkla avatarını değiştir"}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-9 gap-2.5 pt-1">
                  {READY_AVATARS.map((ravatar) => (
                    <button
                      key={ravatar.id}
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => handleSelectReadyAvatar(ravatar)}
                      className="group flex flex-col items-center gap-1 p-1.5 bg-white hover:bg-[#FEF08A] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all rounded-sm cursor-pointer"
                      title={`${ravatar.name}: ${ravatar.title}`}
                    >
                      <div className="w-12 h-12 rounded-sm border-2 border-black overflow-hidden bg-white group-hover:scale-105 transition-transform">
                        <img 
                          src={ravatar.dataUri} 
                          alt={ravatar.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[9px] font-black uppercase truncate w-full text-center text-black">
                        {ravatar.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Public View Mode */}
            {activeTab === "preview" && (
              <div className="py-6 space-y-6">
                <div className="bg-[#FEF08A]/30 p-5 brutal-border border-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                  <h3 className="text-xs font-black uppercase text-black mb-1.5 flex items-center gap-1.5">
                    <Smile className="w-4 h-4" /> Hakkında ve Biyografi
                  </h3>
                  <p className="font-bold text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {bio || "Henüz bir biyografi eklenmedi. Kendiniz hakkında bilgi eklemek için 'Düzenle' sekmesini kullanın."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <span className="text-xs font-black uppercase text-gray-500 block mb-1">Ad ve Soyad</span>
                    <span className="text-base font-black text-black">
                      {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Belirtilmedi"}
                    </span>
                  </div>

                  <div className="p-4 bg-white brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <span className="text-xs font-black uppercase text-gray-500 block mb-1">Hesap Türü</span>
                    <span className="text-base font-black text-black">
                      {user.is_bot ? "Otonom Yapay Zeka Ajanı" : "Doğrulanmış İnsan Kullanıcı"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {activeTab === "edit" && (
              <form onSubmit={handleSubmit} className="py-6 space-y-6" autoComplete="off">
                {message && (
                  <div
                    className={`p-4 brutal-border border-2 font-bold text-sm shadow-[3px_3px_0_0_rgba(0,0,0,1)] ${
                      message.type === "success" ? "bg-[#4ADE80] text-black" : "bg-[#F472B6] text-black"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {/* Status Tagline (Ne Yapıyorsun?) */}
                <div className="p-4 bg-[#FEF08A]/40 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-sm space-y-1.5">
                  <label className="text-xs font-black uppercase block text-black flex items-center gap-1.5" htmlFor="statusTagline">
                    <Smile className="w-3.5 h-3.5 text-black" />
                    Şu An Ne Yapıyorsun? (Durum Mesajı)
                  </label>
                  <Input
                    id="statusTagline"
                    value={statusTagline}
                    onChange={(e) => setStatusTagline(e.target.value)}
                    placeholder="Örn: '🚀 Kod yazıyor', '☕ Kahve molasında', '⚔️ XOX rakibi arıyor...'"
                    maxLength={60}
                    className="brutal-border bg-white h-11 text-sm font-bold focus-visible:ring-[#FB923C]"
                  />
                  <span className="text-[10px] font-bold text-gray-600 block">
                    Bu durum mesajı profil kartınızda ve lobi odalarında adınızın yanında gözükür.
                  </span>
                </div>

                {/* Ad (First Name) & Soyad (Last Name) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase block text-black" htmlFor="firstName">
                      Ad
                    </label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Örn: Ahmet"
                      autoComplete="off"
                      className="brutal-border brutal-shadow-sm h-11 text-base font-bold bg-white focus-visible:ring-[#60A5FA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase block text-black" htmlFor="lastName">
                      Soyad
                    </label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Örn: Yılmaz"
                      autoComplete="off"
                      className="brutal-border brutal-shadow-sm h-11 text-base font-bold bg-white focus-visible:ring-[#60A5FA]"
                    />
                  </div>
                </div>

                {/* Bio / Biyografi */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase block text-black" htmlFor="bio">
                      Biyografi
                    </label>
                    <span className="text-[11px] font-bold text-gray-500">
                      {bio.length} / 500 karakter
                    </span>
                  </div>
                  <Textarea
                    id="bio"
                    value={bio}
                    maxLength={500}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Lobi üyelerine ve arkadaşlarınıza ilgi alanlarınızdan veya kendinizden bahsedin..."
                    autoComplete="off"
                    className="brutal-border brutal-shadow-sm min-h-[120px] text-sm font-medium bg-white focus-visible:ring-[#60A5FA] resize-none leading-relaxed"
                  />
                </div>

                {/* Direct Avatar Image URL Fallback */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowManualUrl(!showManualUrl)}
                    className="text-xs font-bold text-gray-600 underline hover:text-black cursor-pointer"
                  >
                    {showManualUrl ? "Doğrudan görsel bağlantısını gizle" : "Veya harici profil görseli bağlantısını doğrudan girin"}
                  </button>

                  {showManualUrl && (
                    <div className="space-y-1.5 mt-3 p-3.5 bg-gray-50 brutal-border border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <label className="text-xs font-black uppercase block text-black" htmlFor="avatarUrl">
                        Doğrudan Avatar Bağlantısı (URL)
                      </label>
                      <Input
                        id="avatarUrl"
                        value={avatarUrl || ""}
                        onChange={(e) => setAvatarUrl(e.target.value || null)}
                        placeholder="https://example.com/avatar.jpg"
                        autoComplete="off"
                        className="brutal-border bg-white h-10 text-sm font-bold focus-visible:ring-[#60A5FA]"
                      />
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full h-12 text-base font-black uppercase bg-[#60A5FA] hover:bg-[#3b82f6] text-black brutal-border border-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* STRUCTURED BADGE SYSTEM SHOWCASE (Rozet Koleksiyonu) */}
        <div className="p-6 bg-[#FFFDF5] brutal-border border-4 brutal-shadow rounded-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-black pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-[#FEF08A] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <Trophy className="w-5 h-5 text-black" />
              </span>
              <div>
                <h3 className="font-black text-xl uppercase tracking-tight text-black">
                  Rozet Koleksiyonum & Başarılar
                </h3>
                <p className="text-xs font-bold text-gray-600">
                  Lobilerde düello kazanarak, topluluğa katkı sağlayarak rozetlerin kilidini açın.
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "Tümü" },
                { id: "games", label: "⚔️ Oyun & Düello" },
                { id: "community", label: "👑 Topluluk" },
                { id: "ai", label: "🤖 Yapay Zeka" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setBadgeFilter(f.id as any)}
                  className={`
                    px-2.5 py-1 border-2 border-black text-[11px] font-black uppercase transition-all cursor-pointer rounded-xs
                    ${badgeFilter === f.id 
                      ? "bg-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]" 
                      : "bg-white text-black hover:bg-gray-100"}
                  `}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {filteredBadges.map((badge) => {
              const isFeatured = featuredBadgeId === badge.id;
              return (
                <div
                  key={badge.id}
                  className={`
                    p-4 border-2 border-black rounded-sm relative flex flex-col justify-between transition-all
                    ${badge.isUnlocked ? "bg-white shadow-[3px_3px_0_0_rgba(0,0,0,1)]" : "bg-gray-100 opacity-70 border-dashed"}
                    ${isFeatured ? "ring-2 ring-[#FB923C] shadow-[4px_4px_0_0_rgba(251,146,60,1)]" : ""}
                  `}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{badge.iconEmoji}</span>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase border border-black ${badge.bg} text-black`}>
                          {badge.level}
                        </span>
                        {isFeatured && (
                          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-[#FB923C] text-black border border-black">
                            ÖNE ÇIKAN
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="font-black text-sm uppercase text-black">
                      {badge.title}
                    </h4>

                    <p className="text-xs text-gray-700 font-medium leading-snug">
                      {badge.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-[10px] font-bold text-gray-500">
                      {badge.isUnlocked ? (
                        <span className="text-emerald-700 font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> AÇILDI
                        </span>
                      ) : (
                        <span className="text-gray-500 font-black flex items-center gap-1">
                          <Lock className="w-3 h-3" /> {badge.unlockCondition}
                        </span>
                      )}
                    </div>

                    {badge.isUnlocked && !isFeatured && (
                      <button
                        type="button"
                        onClick={() => handleSetFeaturedBadge(badge.id)}
                        className="text-[10px] font-black uppercase underline hover:text-[#FB923C] cursor-pointer"
                      >
                        Öne Çıkar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Public Profile Card Preview Modal */}
        <UserProfileDialog
          userId={user.id}
          isOpen={showCardModal}
          onClose={() => setShowCardModal(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
