// ============================================================================
// TARGET_DESTINATION: frontend/src/data/shopItems.ts
// PURPOSE: In-game shop catalog for cosmetics, borders, titles and themes purchasable with Lobby Coins
// ============================================================================

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: "border" | "title" | "theme" | "badge";
  price: number;
  icon: string;
  previewClass?: string;
  tag?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Avatar Borders
  {
    id: "border_gold_brutal",
    name: "Altın Brutal Çerçeve",
    description: "Profil ve lobi listelerinde avatarının etrafında 4px kalınlığında parlak altın sarısı neo-brutalist çerçeve.",
    type: "border",
    price: 150,
    icon: "🟡",
    previewClass: "border-4 border-[#FBBF24] shadow-[3px_3px_0_0_#000]",
    tag: "Popüler"
  },
  {
    id: "border_cyber_neon",
    name: "Siber Neon Çerçeve",
    description: "Siberpunk mavisinde çift katmanlı fütüristik avatar kenarlığı.",
    type: "border",
    price: 200,
    icon: "🔷",
    previewClass: "border-4 border-[#06B6D4] shadow-[3px_3px_0_0_#000]",
    tag: "Yeni"
  },
  {
    id: "border_matrix_green",
    name: "Terminal Yeşili Çerçeve",
    description: "Hacker estetiğine sahip yeşil pikselli çerçeve.",
    type: "border",
    price: 180,
    icon: "🟩",
    previewClass: "border-4 border-[#22C55E] shadow-[3px_3px_0_0_#000]"
  },
  {
    id: "border_crimson_flame",
    name: "Alev Kırmızı Çerçeve",
    description: "Ateşli rekabetçiler için kırmızı sert çerçeve.",
    type: "border",
    price: 220,
    icon: "🔥",
    previewClass: "border-4 border-[#EF4444] shadow-[3px_3px_0_0_#000]"
  },

  // Titles (Ünvanlar)
  {
    id: "title_code_wizard",
    name: "Kod Büyücüsü",
    description: "Kullanıcı adının hemen yanında beliren prestijli ünvan rozeti.",
    type: "title",
    price: 120,
    icon: "🧙‍♂️",
    tag: "Öne Çıkan"
  },
  {
    id: "title_cyber_wanderer",
    name: "Siber Gezgin",
    description: "Dijital labirentlerde kaybolanlar için özel ünvan.",
    type: "title",
    price: 100,
    icon: "🌌"
  },
  {
    id: "title_lobby_legend",
    name: "Lobi Efsanesi",
    description: "Odalarda herkesin saygı duyduğu duayen ünvanı.",
    type: "title",
    price: 350,
    icon: "👑",
    tag: "Efsanevi"
  },
  {
    id: "title_caffeine_fiend",
    name: "Kafein Canavarı",
    description: "Gece gündüz klavye başında kahveyle yaşayanlara.",
    type: "title",
    price: 80,
    icon: "☕"
  },

  // Sohbet Temaları & Baloncuklar
  {
    id: "theme_warm_parchment",
    name: "Sıcak Parşömen Teması",
    description: "Kendi mesajların için sıcak fildişi ve parşömen arkaplanı.",
    type: "theme",
    price: 140,
    icon: "📜",
    previewClass: "bg-[#FFFDF5] text-black border-2 border-black"
  },
  {
    id: "theme_lavender_dream",
    name: "Lavanta Rüyası",
    description: "Sohbet kutularında yumuşak lavanta moru pastel dokusu.",
    type: "theme",
    price: 160,
    icon: "💜",
    previewClass: "bg-[#F3E8FF] text-black border-2 border-black"
  },
  {
    id: "theme_mint_breeze",
    name: "Nane Esintisi",
    description: "Ferahlatıcı nane yeşili mesaj baloncukları.",
    type: "theme",
    price: 140,
    icon: "🍃",
    previewClass: "bg-[#DCFCE7] text-black border-2 border-black"
  },

  // Nadir Rozetler
  {
    id: "badge_rich_club",
    name: "Zenginler Kulübü Rozeti",
    description: "Lobi mağazasından özel olarak satın alınabilen altın taç rozeti.",
    type: "badge",
    price: 300,
    icon: "💎",
    tag: "Prestij"
  },
  {
    id: "badge_collector",
    name: "Koleksiyoner Rozeti",
    description: "Mağaza ve görev meraklılarına özel madalya.",
    type: "badge",
    price: 250,
    icon: "🏅"
  }
];
