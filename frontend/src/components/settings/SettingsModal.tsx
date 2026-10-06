"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toast";
import {
  getEquippedCosmetics,
  setEquippedCosmetic,
  EquippedCosmetics,
} from "@/lib/cosmetics";
import {
  Settings,
  Palette,
  Bell,
  Shield,
  User,
  Check,
  Globe,
  Sparkles,
  ExternalLink,
  MessageSquare,
  LogOut,
  Coins,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GLOBAL_THEME_ID = "global_theme_deep_galaxy";

const DM_THEME_OPTIONS = [
  {
    id: null,
    name: "Standart Neo-Brutalist",
    previewClass: "bg-[#FEF9C3] text-black border-2 border-black",
    desc: "Klasik sarı ve beyaz kontrastlı retro sohbet stili",
  },
  {
    id: "dm_theme_midnight_purple",
    name: "Gece Moru & Eflatun",
    previewClass: "bg-[#2E1065] text-[#E9D5FF] border-2 border-[#A855F7]",
    desc: "Koyu mor ve parlak neon hatlar",
  },
  {
    id: "dm_theme_emerald_secure",
    name: "Şifreli Zümrüt Yeşili",
    previewClass: "bg-[#064E3B] text-[#A7F3D0] border-2 border-[#10B981]",
    desc: "Karanlık siber güvenlik ve zümrüt yeşili",
  },
  {
    id: "dm_theme_sunset_vibes",
    name: "Günbatımı Şöleni",
    previewClass: "bg-gradient-to-r from-[#F472B6] to-[#FB923C] text-white border-2 border-black",
    desc: "Canlı pembe ve turuncu günbatımı tonları",
  },
];

const LOBBY_THEME_OPTIONS = [
  {
    id: null,
    name: "Standart Neo-Brutalist",
    previewClass: "bg-[#f3e8ff] text-black border-2 border-black",
    desc: "Varsayılan ferah mor & beyaz lobi baloncukları",
  },
  {
    id: "lobby_theme_cyber_neon",
    name: "Siber Neon Lobi",
    previewClass: "bg-[#0B1120] text-[#38BDF8] border-2 border-[#06B6D4]",
    desc: "Karanlık galaktik lacivert & camgöbeği neon",
  },
  {
    id: "lobby_theme_retro_arcade",
    name: "Retro Atari Salonu",
    previewClass: "bg-[#FEF08A] text-black border-2 border-black",
    desc: "Kehribar sarısı nostaljik atari stili",
  },
  {
    id: "lobby_theme_matrix_hacker",
    name: "Matrix Terminali",
    previewClass: "bg-[#051509] text-[#22C55E] border-2 border-[#22C55E]",
    desc: "Koyu yeşil hacker terminali",
  },
  {
    id: "lobby_theme_lavender_haze",
    name: "Pastel Lavanta",
    previewClass: "bg-[#E9D5FF] text-[#581C87] border-2 border-[#7E22CE]",
    desc: "Yumuşak ve dinlendirici pastel lavanta moru",
  },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("appearance");
  const [equipped, setEquipped] = useState<EquippedCosmetics>({});

  // Notification settings
  const [lobbyMentionsOnly, setLobbyMentionsOnly] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setEquipped(getEquippedCosmetics());

      const n = localStorage.getItem("lobby-ai:browser_notifications");
      if (n !== null) setBrowserNotifications(n === "true");
    }

    const handleUpdate = (e: any) => {
      if (e.detail) setEquipped(e.detail);
    };
    window.addEventListener("lobby:cosmetics_updated", handleUpdate);
    return () => window.removeEventListener("lobby:cosmetics_updated", handleUpdate);
  }, [isOpen]);

  const isGlobalGalaxyActive = equipped.global_theme === GLOBAL_THEME_ID;

  const handleToggleGlobalGalaxy = () => {
    const next = isGlobalGalaxyActive ? null : GLOBAL_THEME_ID;
    const updated = setEquippedCosmetic("global_theme", next);
    setEquipped(updated);
    toast.add({
      title: next ? "Derin Galaksi Teması Aktif! 🌌" : "Varsayılan Temaya Dönüldü",
      description: next
        ? "Tüm projede koyu galaksi mavisi ve mor renk paleti uygulandı."
        : "Proje geneli standart görünüme sıfırlandı.",
      type: "success",
    });
  };

  const handleSelectDmTheme = (themeId: string | null) => {
    const updated = setEquippedCosmetic("dm_theme", themeId);
    setEquipped(updated);
    toast.add({
      title: "DM Teması Güncellendi ✨",
      description: "Özel mesajlaşma pencereniz anında yeni temaya uyarlandı.",
      type: "success",
    });
  };

  const handleSelectLobbyTheme = (themeId: string | null) => {
    const updated = setEquippedCosmetic("lobby_theme", themeId);
    setEquipped(updated);
    toast.add({
      title: "Lobi Sohbet Teması Güncellendi ✨",
      description: "Lobi içi mesaj baloncuklarınız seçtiğiniz temaya uyarlandı.",
      type: "success",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[94vw] p-0 border-3 border-black shadow-[6px_6px_0_0_#000] rounded-sm overflow-hidden bg-white text-black max-h-[88vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-[#1E1B4B] via-[#2E1065] to-[#1E1B4B] p-4 md:p-5 border-b-2 border-[#334155] shrink-0 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#0B1120] border-2 border-[#818CF8] flex items-center justify-center shadow-[2px_2px_0_0_#818CF8]">
              <Settings className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div>
              <DialogTitle className="text-xl md:text-2xl font-black uppercase text-white tracking-tight">
                Sistem & Uygulama Ayarları
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-slate-300">
                Tema, bildirim ve hesap tercihlerinizi tek bir noktadan yönetin.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs & Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start gap-1 p-2 bg-[#F4F4F5] border-b-2 border-black shrink-0 overflow-x-auto no-scrollbar">
            <TabsTrigger
              value="appearance"
              className="flex items-center gap-1.5 font-black text-xs uppercase px-3 py-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-[#FEF08A] data-[state=active]:shadow-[2px_2px_0_0_#000] cursor-pointer rounded-xs"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Görünüm & Temalar</span>
            </TabsTrigger>

            <TabsTrigger
              value="notifications"
              className="flex items-center gap-1.5 font-black text-xs uppercase px-3 py-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-[#FEF08A] data-[state=active]:shadow-[2px_2px_0_0_#000] cursor-pointer rounded-xs"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Bildirimler</span>
            </TabsTrigger>

            <TabsTrigger
              value="account"
              className="flex items-center gap-1.5 font-black text-xs uppercase px-3 py-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-[#FEF08A] data-[state=active]:shadow-[2px_2px_0_0_#000] cursor-pointer rounded-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Hesap & Güvenlik</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* 1. APPEARANCE & THEMES TAB */}
            <TabsContent value="appearance" className="space-y-6 m-0">
              {/* Global Theme Toggle Card */}
              <div className="p-4 border-2 border-black brutal-shadow rounded-xs bg-[#FDFBF7] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-black bg-[#070B14] flex items-center justify-center text-xl shadow-[2px_2px_0_0_#000]">
                      🌌
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase text-black flex items-center gap-1.5">
                        <span>Derin Galaksi Küresel Teması</span>
                        {isGlobalGalaxyActive && (
                          <span className="text-[10px] bg-[#4ADE80] text-black font-black px-1.5 py-0.5 border border-black">
                            AKTİF
                          </span>
                        )}
                      </h4>
                      <p className="text-xs font-bold text-gray-600">
                        Tüm projeyi koyu galaksi mavisi, mor hatlar ve yüksek kontrastlı modern karanlık moda geçirir.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleToggleGlobalGalaxy}
                    className={`font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer shrink-0 ${
                      isGlobalGalaxyActive
                        ? "bg-[#FFE4E6] hover:bg-[#FECDD3] text-black"
                        : "bg-[#06B6D4] hover:bg-[#0891B2] text-black"
                    }`}
                  >
                    {isGlobalGalaxyActive ? "Temayı Devre Dışı Bırak" : "Galaksi Temasını Aç"}
                  </Button>
                </div>
              </div>

              {/* DM Chat Themes Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                    <span>Özel Mesaj (DM) Sohbet Teması</span>
                  </h4>
                  <span className="text-[10px] font-bold text-gray-500">
                    Birebir mesaj kutularınızda anında uygulanır
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DM_THEME_OPTIONS.map((opt) => {
                    const isSelected = (equipped.dm_theme || null) === opt.id;
                    return (
                      <div
                        key={String(opt.id)}
                        onClick={() => handleSelectDmTheme(opt.id)}
                        className={`p-3 border-2 border-black rounded-xs cursor-pointer transition-all ${
                          isSelected
                            ? "bg-white shadow-[3px_3px_0_0_#000] -translate-y-0.5 ring-2 ring-purple-600"
                            : "bg-gray-50 hover:bg-white shadow-[1px_1px_0_0_#000]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-xs text-black">{opt.name}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#4ADE80] border border-black flex items-center justify-center text-[10px] font-black text-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className={`p-2 rounded-xs text-[11px] font-bold mb-1.5 ${opt.previewClass}`}>
                          "Merhaba, nasılsın? 🚀"
                        </div>
                        <p className="text-[10px] font-medium text-gray-500">{opt.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lobby Chat Themes Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Kişisel Lobi Sohbet Teması</span>
                  </h4>
                  <span className="text-[10px] font-bold text-gray-500">
                    Lobi içi mesaj baloncuklarınız için stil
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LOBBY_THEME_OPTIONS.map((opt) => {
                    const isSelected = (equipped.lobby_theme || null) === opt.id;
                    return (
                      <div
                        key={String(opt.id)}
                        onClick={() => handleSelectLobbyTheme(opt.id)}
                        className={`p-3 border-2 border-black rounded-xs cursor-pointer transition-all ${
                          isSelected
                            ? "bg-white shadow-[3px_3px_0_0_#000] -translate-y-0.5 ring-2 ring-cyan-600"
                            : "bg-gray-50 hover:bg-white shadow-[1px_1px_0_0_#000]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-xs text-black">{opt.name}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#4ADE80] border border-black flex items-center justify-center text-[10px] font-black text-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className={`p-2 rounded-xs text-[11px] font-bold mb-1.5 ${opt.previewClass}`}>
                          "Lobiye hoş geldin! 💬"
                        </div>
                        <p className="text-[10px] font-medium text-gray-500">{opt.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>


            {/* 3. NOTIFICATIONS TAB */}
            <TabsContent value="notifications" className="space-y-4 m-0">
              <div className="space-y-3">
                <div className="p-4 border-2 border-black brutal-shadow rounded-xs bg-[#FDFBF7] flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-black text-sm uppercase text-black">
                      Tarayıcı Masaüstü Bildirimleri
                    </h4>
                    <p className="text-xs font-bold text-gray-600">
                      Sekme arka plandayken gelen yeni özel mesajlarda bildirim gönder.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (!browserNotifications && typeof window !== "undefined" && "Notification" in window) {
                        Notification.requestPermission().then((perm) => {
                          if (perm === "granted") {
                            setBrowserNotifications(true);
                            localStorage.setItem("lobby-ai:browser_notifications", "true");
                            toast.add({
                              title: "Bildirim İzni Verildi 🔔",
                              description: "Tarayıcı bildirimleri başarıyla etkinleştirildi.",
                              type: "success",
                            });
                          } else {
                            toast.add({
                              title: "İzin Reddedildi",
                              description: "Tarayıcı ayarlarından bildirim iznini açabilirsiniz.",
                              type: "error",
                            });
                          }
                        });
                      } else {
                        const next = !browserNotifications;
                        setBrowserNotifications(next);
                        localStorage.setItem("lobby-ai:browser_notifications", String(next));
                      }
                    }}
                    className={`font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer shrink-0 ${
                      browserNotifications
                        ? "bg-[#4ADE80] hover:bg-[#22C55E] text-black"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    {browserNotifications ? "AÇIK 🔔" : "KAPALI 🔕"}
                  </Button>
                </div>

                <div className="p-4 border-2 border-black brutal-shadow rounded-xs bg-[#FDFBF7] flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-black text-sm uppercase text-black">
                      Lobi Bildirim Filtresi
                    </h4>
                    <p className="text-xs font-bold text-gray-600">
                      Lobilerde sadece @senin_adin bahsetmelerinde bildirim al.
                    </p>
                  </div>
                  <Button
                    onClick={() => setLobbyMentionsOnly(!lobbyMentionsOnly)}
                    className={`font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer shrink-0 ${
                      lobbyMentionsOnly
                        ? "bg-[#FEF08A] hover:bg-[#FDE047] text-black"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    {lobbyMentionsOnly ? "Sadece Mention" : "Tüm Mesajlar"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* 4. ACCOUNT & SECURITY TAB */}
            <TabsContent value="account" className="space-y-4 m-0">
              {user && (
                <div className="p-4 border-2 border-black brutal-shadow rounded-xs bg-[#FDFBF7] space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10">
                    <div className="w-12 h-12 rounded-full border-2 border-black bg-[#F472B6] flex items-center justify-center font-black text-base text-black shadow-[2px_2px_0_0_#000]">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-base text-black">
                        {user.display_name || user.username}
                      </h4>
                      <p className="text-xs font-bold text-gray-500">@{user.username}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-[#FEF08A] border-2 border-black font-black text-xs text-black shadow-[1.5px_1.5px_0_0_#000]">
                      <Coins className="w-3.5 h-3.5 text-yellow-600" />
                      <span>{user.coins?.toLocaleString() ?? 0} Coin</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white border-2 border-black">
                      <span className="font-bold text-gray-500 block">Kullanıcı ID</span>
                      <span className="font-mono font-black text-black select-all text-[11px] truncate block">
                        {user.id}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white border-2 border-black">
                      <span className="font-bold text-gray-500 block">E-posta Adresi</span>
                      <span className="font-black text-black select-all text-[11px] truncate block">
                        {user.email || "Kayıtlı e-posta yok"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      onClick={() => {
                        onClose();
                        router.push("/profile");
                      }}
                      className="bg-[#FEF08A] hover:bg-[#FDE047] text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 mr-1" />
                      Profilimi Görüntüle & Düzenle
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        onClose();
                        logout();
                      }}
                      className="bg-[#FFE4E6] hover:bg-[#fecdd3] text-red-700 font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer ml-auto"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1" />
                      Oturumu Kapat
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
