// ============================================================================
// TARGET_DESTINATION: frontend/src/app/shop/page.tsx
// PURPOSE: Neo-Brutalist in-game Shop (/shop) for avatar borders, titles, themes & badges
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api/client";
import { SHOP_ITEMS, ShopItem } from "@/data/shopItems";
import { 
  getEquippedCosmetics, 
  toggleEquippedCosmetic, 
  CosmeticCategory,
  EquippedCosmetics 
} from "@/lib/cosmetics";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { AvatarFrame } from "@/components/avatar/AvatarFrame";
import { 
  ShoppingBag, 
  Coins, 
  Sparkles, 
  Check, 
  Lock, 
  Tag, 
  Filter,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Target,
  Palette,
  MessageSquare,
  Globe,
  UserCheck,
  Activity
} from "lucide-react";
import Link from "next/link";

export default function ShopPage() {
  return (
    <ProtectedRoute>
      <ShopContent />
    </ProtectedRoute>
  );
}

function ShopContent() {
  const { user } = useAuth();
  const [coins, setCoins] = useState<number>(user?.coins ?? 0);
  const [inventory, setInventory] = useState<string[]>([]);
  const [equippedItems, setEquippedItems] = useState<EquippedCosmetics>({});
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // Fetch current user coins, inventory & equipped cosmetics
  useEffect(() => {
    setEquippedItems(getEquippedCosmetics());

    async function loadData() {
      try {
        const userRes = await apiClient.get<any>("/users/me");
        if (userRes.data?.coins !== undefined) {
          setCoins(userRes.data.coins);
        }
        const invRes = await apiClient.get<string[]>("/shop/inventory");
        if (Array.isArray(invRes.data)) {
          setInventory(invRes.data);
        }
      } catch (err) {
        console.error("Failed to load shop data:", err);
      }
    }
    loadData();

    // Listen to coin updates or badge unlock events
    const handleCoinUpdate = (e: any) => {
      if (e.detail?.coins !== undefined) {
        setCoins(e.detail.coins);
      }
    };

    const handleCosmeticsUpdate = (e: any) => {
      if (e.detail) {
        setEquippedItems(e.detail);
      }
    };

    window.addEventListener("lobby:coins_updated", handleCoinUpdate);
    window.addEventListener("lobby:badge_unlocked", handleCoinUpdate);
    window.addEventListener("lobby:cosmetics_updated", handleCosmeticsUpdate);

    return () => {
      window.removeEventListener("lobby:coins_updated", handleCoinUpdate);
      window.removeEventListener("lobby:badge_unlocked", handleCoinUpdate);
      window.removeEventListener("lobby:cosmetics_updated", handleCosmeticsUpdate);
    };
  }, []);

  const toggleEquip = (item: ShopItem) => {
    const { equipped, cosmetics } = toggleEquippedCosmetic(
      item.type as CosmeticCategory,
      item.id
    );
    setEquippedItems(cosmetics);
    if (equipped) {
      toast.add({
        title: "Kuşanıldı! ✨",
        description: `${item.name} başarıyla profilinize/sohbetinize uygulandı.`,
        type: "success",
      });
    } else {
      toast.add({
        title: "Kuşanma Kaldırıldı",
        description: `${item.name} aktif kozmetiklerinizden çıkarıldı.`,
        type: "info",
      });
    }
  };

  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (selectedFilter === "all") return true;
    return item.type === selectedFilter;
  });

  const handlePurchase = async (item: ShopItem) => {
    if (coins < item.price) {
      toast.add({
        title: "Yetersiz Bakiye!",
        description: `Bu eşya için ${item.price} 🪙 gerekiyor. Mevcut bakiyen: ${coins} 🪙. Günlük ve haftalık görevlerden coin toplayabilirsin!`,
        type: "error",
      });
      return;
    }

    setPurchasingId(item.id);
    try {
      const res = await apiClient.post<{ coins: number; item_id: string }>("/shop/purchase", {
        item_id: item.id,
        item_type: item.type,
        price: item.price,
      });

      setCoins(res.data.coins);
      setInventory((prev) => [...prev, item.id]);

      // Trigger global event so TopBar, QuestsModal, and useAuth get the updated coin count immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("lobby:coins_updated", {
            detail: { coins: res.data.coins },
          })
        );
      }

      // If it's a badge, also trigger unlock
      if (item.type === "badge") {
        await apiClient.post("/users/badges/unlock", { badge: item.id }).catch(() => {});
      }

      toast.add({
        title: `Satın Alındı: ${item.name}!`,
        description: `Tebrikler! ${item.name} envanterine eklendi. Kalan bakiye: ${res.data.coins} 🪙`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Satın Alım Başarısız",
        description: err.response?.data?.error?.message || "Satın alma sırasında bir hata oluştu.",
        type: "error",
      });
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="min-h-full pb-16 space-y-8 animate-fade-in">
      {/* Top Banner & Wallet Status */}
      <div className="bg-[#FEF08A] border-4 border-black p-6 md:p-8 brutal-shadow relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-xs font-black uppercase tracking-wider rounded-none">
              <ShoppingBag className="w-4 h-4 text-[#FEF08A]" />
              Lobby AI Pazarı & Mağazası
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black uppercase">
              Kozmetik & Özelleştirme Dükkanı
            </h1>
            <p className="text-sm md:text-base font-bold text-gray-800 max-w-xl">
              Görevlerden ve lobi başarımlarından kazandığın Lobby Coin'leri harca; avatarını, ünvanını ve sohbet tarzını kişiselleştir!
            </p>
          </div>

          {/* Wallet Card */}
          <div className="bg-white border-4 border-black p-4 brutal-shadow flex items-center gap-4 shrink-0 flex-wrap sm:flex-nowrap">
            <div className="w-12 h-12 bg-[#FEF08A] border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0_0_#000]">
              🪙
            </div>
            <div>
              <span className="text-xs font-black text-gray-500 uppercase tracking-wider block">
                Cüzdan Bakiyesi
              </span>
              <div className="flex items-center gap-1.5">
                <span data-testid="shop-wallet-coins" className="text-2xl md:text-3xl font-black text-black">
                  {coins.toLocaleString()}
                </span>
                <span className="font-black text-sm text-yellow-600 uppercase">Coin</span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto sm:ml-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent("lobby:open_quests"))}
                data-testid="shop-open-quests-button"
                className="border-2 border-black bg-[#E0F2FE] hover:bg-[#bae6fd] font-black text-xs text-black shadow-[2px_2px_0_0_#000] cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 mr-1" />
                Görevler
              </Button>
              <Link href="/profile?tab=inventory">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="shop-open-inventory-button"
                  className="border-2 border-black bg-[#FEF08A] hover:bg-[#FDE047] font-black text-xs text-black shadow-[2px_2px_0_0_#000] cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                  Envanterim
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b-4 border-black pb-4">
        {[
          { id: "all", label: "Tüm Eşyalar", icon: Sparkles },
          { id: "global_theme", label: "Genel Galaksi Teması", icon: Globe },
          { id: "border", label: "Avatar Çerçeveleri", icon: ShieldCheck },
          { id: "avatar_animation", label: "Avatar Animasyonları", icon: Activity },
          { id: "lobby_theme", label: "Lobi Sohbet Temaları", icon: MessageSquare },
          { id: "dm_theme", label: "Özel Mesaj (DM) Temaları", icon: Palette },
          { id: "title", label: "Özel Ünvanlar", icon: Tag },
          { id: "badge", label: "Nadir Rozetler", icon: Coins },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3.5 py-2 border-2 border-black font-black text-xs md:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-black text-white brutal-shadow -translate-y-0.5"
                  : "bg-white text-black hover:bg-[#FAF8F0] shadow-[2px_2px_0_0_#000]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => {
          const isOwned = inventory.includes(item.id);
          const canAfford = coins >= item.price;
          const isBusy = purchasingId === item.id;
          const isEquipped = equippedItems[item.type as keyof EquippedCosmetics] === item.id;

          return (
            <div
              key={item.id}
              className="bg-white border-4 border-black p-5 brutal-shadow flex flex-col justify-between space-y-4 hover:border-black transition-all group relative"
            >
              {/* Badge / Tag if any */}
              {item.tag && (
                <div className="absolute -top-3 -right-2 bg-[#FEF08A] text-black font-black text-[10px] px-2.5 py-0.5 border-2 border-black shadow-[2px_2px_0_0_#000] uppercase tracking-wider rotate-3">
                  {item.tag}
                </div>
              )}

              {/* Item Header / Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-[#FAF8F0] border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0_0_#000] group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 bg-gray-100 border border-black uppercase">
                    {item.type === "border"
                      ? "Çerçeve"
                      : item.type === "avatar_animation"
                      ? "Animasyon"
                      : item.type === "title"
                      ? "Ünvan"
                      : item.type === "global_theme"
                      ? "Genel Tema"
                      : item.type === "lobby_theme"
                      ? "Lobi Teması"
                      : item.type === "dm_theme"
                      ? "DM Teması"
                      : "Rozet"}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-black uppercase tracking-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs font-medium text-gray-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Live Visual Preview Box */}
                {item.type === "border" && (
                  <div className="p-4 bg-[#FAF8F0] border-2 border-dashed border-gray-300 rounded flex items-center justify-center overflow-visible">
                    <AvatarFrame borderId={item.id} size="md">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 border-2 border-black flex items-center justify-center text-xl text-white font-black shadow-[2px_2px_0_0_#000]">
                        🤖
                      </div>
                    </AvatarFrame>
                  </div>
                )}

                {item.type === "avatar_animation" && (
                  <div className="p-4 bg-[#FAF8F0] border-2 border-dashed border-gray-300 rounded flex items-center justify-center overflow-visible">
                    <AvatarFrame animationId={item.id} size="md">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 border-2 border-black flex items-center justify-center text-xl text-white font-black shadow-[2px_2px_0_0_#000]">
                        ⚡
                      </div>
                    </AvatarFrame>
                  </div>
                )}

                {item.type !== "border" && item.type !== "avatar_animation" && item.previewClass && (
                  <div className="p-3 bg-[#FAF8F0] border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                    <div className={`px-4 py-1.5 text-xs font-black ${item.previewClass}`}>
                      Önizleme
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Action */}
              <div className="pt-3 border-t-2 border-black flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <span className="font-black text-lg text-black">{item.price}</span>
                  <span className="text-xs font-black text-yellow-600 uppercase">🪙</span>
                </div>

                {isOwned ? (
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#DCFCE7] border-2 border-black text-green-900 font-black text-xs shadow-[1.5px_1.5px_0_0_#000]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sahipsin
                    </div>
                    {item.type !== "badge" && (
                      <Button
                        size="sm"
                        onClick={() => toggleEquip(item)}
                        data-testid={`equip-btn-${item.id}`}
                        className={`font-black text-xs border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer py-1 px-2.5 ${
                          isEquipped
                            ? "bg-[#A78BFA] hover:bg-[#8B5CF6] text-black"
                            : "bg-[#FEF08A] hover:bg-[#FDE047] text-black"
                        }`}
                      >
                        {isEquipped ? "Kuşanıldı ✓" : "Kuşan"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => handlePurchase(item)}
                    disabled={isBusy}
                    className={`font-black text-xs border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                      canAfford
                        ? "bg-[#FEF08A] hover:bg-[#FDE047] text-black"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isBusy ? (
                      "İşleniyor..."
                    ) : canAfford ? (
                      "Satın Al"
                    ) : (
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Yetersiz Coin
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
