// ============================================================================
// TARGET_DESTINATION: frontend/src/data/shopItems.ts
// PURPOSE: In-game shop catalog for cosmetics, borders, titles, chat/DM themes, and global theme
// ============================================================================

export type ShopItemType = 
  | "border" 
  | "avatar_animation"
  | "title" 
  | "lobby_theme" 
  | "dm_theme" 
  | "global_theme" 
  | "badge";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  price: number;
  icon: string;
  previewClass?: string;
  tag?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // ==========================================================================
  // 1. KÜRESEL PROJE GENELİ TEMA (Tüm Sitede Geçerli)
  // ==========================================================================
  {
    id: "global_theme_deep_galaxy",
    name: "Derin Galaksi (Koyu Mavi & Mor)",
    description: "Tüm sitede geçerli küresel tema! Proje genelinde koyu galaksi mavisi (#070B14), derin kozmik mor (#2E1065) ve neon camgöbeği/eflatun kontrastlarını uygular.",
    type: "global_theme",
    price: 250,
    icon: "🌌",
    previewClass: "bg-[#070B14] text-[#38BDF8] border-2 border-[#818CF8]",
    tag: "Efsanevi Küresel",
  },

  // ==========================================================================
  // 2. LOBİ SOHBET TEMALARI (Oda İçi Mesajlaşma)
  // ==========================================================================
  {
    id: "lobby_theme_cyber_neon",
    name: "Siber Neon Lobi Teması",
    description: "Lobi sohbet kutuları ve mesajların için fütüristik koyu lacivert zemin ve parlak neon mavi hatlar.",
    type: "lobby_theme",
    price: 180,
    icon: "🌃",
    previewClass: "bg-[#0B1120] text-[#38BDF8] border-2 border-[#06B6D4]",
    tag: "Yeni",
  },
  {
    id: "lobby_theme_retro_arcade",
    name: "Retro Arcade Lobi Teması",
    description: "Nostaljik atari salonları gibi sıcak kehribar ve sarı neo-brutalist mesaj kutuları.",
    type: "lobby_theme",
    price: 150,
    icon: "🕹️",
    previewClass: "bg-[#FEF08A] text-black border-2 border-black",
    tag: "Popüler",
  },
  {
    id: "lobby_theme_matrix_hacker",
    name: "Matrix Terminali Teması",
    description: "Karanlık hacker yeşili terminal stilinde lobi sohbet kutuları.",
    type: "lobby_theme",
    price: 170,
    icon: "💻",
    previewClass: "bg-[#051509] text-[#22C55E] border-2 border-[#22C55E]",
  },
  {
    id: "lobby_theme_lavender_haze",
    name: "Pastel Lavanta Lobi Teması",
    description: "Sohbette yumuşak ve şık lavanta moru pastel mesaj baloncukları.",
    type: "lobby_theme",
    price: 140,
    icon: "💜",
    previewClass: "bg-[#E9D5FF] text-[#581C87] border-2 border-[#7E22CE]",
  },

  // ==========================================================================
  // 3. ÖZEL MESAJ (DM) TEMALARI (Birebir Sohbetler)
  // ==========================================================================
  {
    id: "dm_theme_midnight_purple",
    name: "Gece Moru DM Teması",
    description: "Özel mesaj pencerelerinde derin gece moru ve eflatun neon mesaj baloncukları.",
    type: "dm_theme",
    price: 160,
    icon: "🔮",
    previewClass: "bg-[#2E1065] text-[#E9D5FF] border-2 border-[#A855F7]",
    tag: "Öne Çıkan",
  },
  {
    id: "dm_theme_emerald_secure",
    name: "Şifreli Zümrüt DM Teması",
    description: "Uçtan uca şifreli hissi veren koyu zümrüt yeşili özel mesajlaşma teması.",
    type: "dm_theme",
    price: 150,
    icon: "🛡️",
    previewClass: "bg-[#064E3B] text-[#A7F3D0] border-2 border-[#10B981]",
  },
  {
    id: "dm_theme_sunset_vibes",
    name: "Gün Batımı Mercan DM Teması",
    description: "Sıcak pembe ve mercan geçişli özel mesajlaşma stili.",
    type: "dm_theme",
    price: 140,
    icon: "🌅",
    previewClass: "bg-gradient-to-r from-[#F472B6] to-[#FB923C] text-white border-2 border-black",
    tag: "Popüler",
  },

  // ==========================================================================
  // 4. DEKORATİF AVATAR ÇERÇEVELERİ (Özel Geometrik & Vektörel Tasarımlar)
  // ==========================================================================
  {
    id: "border_gold_brutal",
    name: "Altın Zigzag Brutal Çerçeve",
    description: "Profil dairesinin hem içine hem dışına dinamik olarak taşan, sarı ve siyah kontrastlı ince testere dişi zigzag çerçeve.",
    type: "border",
    price: 150,
    icon: "🟡",
    previewClass: "border-4 border-[#FBBF24] shadow-[3px_3px_0_0_#000]",
    tag: "Özel Tasarım",
  },
  {
    id: "border_cyber_neon",
    name: "Siber HUD Nişangah Çerçevesi",
    description: "Fütüristik siber nişangah köşebentleri ve neon camgöbeği hedefleme çizgileri.",
    type: "border",
    price: 200,
    icon: "🔷",
    previewClass: "border-4 border-[#06B6D4] shadow-[3px_3px_0_0_#06B6D4]",
    tag: "Yeni",
  },
  {
    id: "border_matrix_green",
    name: "Matrix Devre Çerçevesi",
    description: "Karanlık hacker yeşili terminal devre yolları ve dijital veri noktaları.",
    type: "border",
    price: 180,
    icon: "🟩",
    previewClass: "border-4 border-[#22C55E] shadow-[3px_3px_0_0_#000]",
  },
  {
    id: "border_crimson_flame",
    name: "Kızıl Alev Dişleri Çerçevesi",
    description: "Ateşli rekabetçiler için profil sınırından dışarı taşan kızıl alev dişleri ve dikey kılavuzlar.",
    type: "border",
    price: 220,
    icon: "🔥",
    previewClass: "border-4 border-[#EF4444] shadow-[3px_3px_0_0_#000]",
  },
  {
    id: "border_amethyst_dragon",
    name: "Ametist Ejderha Kristalleri",
    description: "Mistik kozmik ametist kristal sivrilikleri ve derin mor ejderha aurası.",
    type: "border",
    price: 260,
    icon: "🔮",
    previewClass: "border-4 border-[#A855F7] shadow-[3px_3px_0_0_#A855F7]",
    tag: "Efsanevi",
  },
  {
    id: "border_holo_rainbow",
    name: "Holografik Prizma Yıldızları",
    description: "Her açıdan parıldayan çokgen prizma yıldızları ve dinamik gökkuşağı halkası.",
    type: "border",
    price: 300,
    icon: "🌈",
    previewClass: "border-4 border-[#EC4899] shadow-[3px_3px_0_0_#FBBF24]",
    tag: "Nadir",
  },

  // ==========================================================================
  // 5. SATIN ALINABİLİR AVATAR LOOP ANİMASYONLARI
  // ==========================================================================
  {
    id: "anim_breathe",
    name: "Sakin Nefes Alma Döngüsü",
    description: "Avatarınız ritmik ve akıcı bir şekilde nefes alır gibi genişleyip daralır. Profilinizde sakin, canlı ve premium bir atmosfer yaratır.",
    type: "avatar_animation",
    price: 190,
    icon: "🫁",
    previewClass: "bg-[#FEF08A] text-black border-2 border-black",
    tag: "Loop Animasyon",
  },
  {
    id: "anim_orbital_spin",
    name: "Yörünge Uydu Halkası",
    description: "Avatarınızın etrafında 360 derece kesintisiz dönen neon uydu küresi ve parçacık izi. Uzay istasyonu havası katar.",
    type: "avatar_animation",
    price: 220,
    icon: "🪐",
    previewClass: "bg-[#06B6D4] text-black border-2 border-black",
    tag: "360° Loop",
  },
  {
    id: "anim_matrix_glitch",
    name: "Siber Glitch Nabzı",
    description: "Hacker ve siberpunk tutkunlarına özel anlık siber parazit ve glitch titreşim dalgası.",
    type: "avatar_animation",
    price: 210,
    icon: "⚡",
    previewClass: "bg-[#051509] text-[#22C55E] border-2 border-[#22C55E]",
    tag: "Yeni",
  },
  {
    id: "anim_flame_pulse",
    name: "Alev Aurası Nabzı",
    description: "Avatarınızın etrafında kor alev dalgaları gibi nabız atan ateş aurası.",
    type: "avatar_animation",
    price: 230,
    icon: "🔥",
    previewClass: "bg-[#450A0A] text-[#EF4444] border-2 border-[#EF4444]",
    tag: "Ateşli Loop",
  },
  {
    id: "anim_rainbow_shimmer",
    name: "Gökkuşağı Prizma Işıltısı",
    description: "Büyülü prizmatik renk akımları avatarınızın sınırlarında sürekli dalgalanır.",
    type: "avatar_animation",
    price: 200,
    icon: "✨",
    previewClass: "bg-gradient-to-r from-pink-500 to-indigo-500 text-white border-2 border-black",
    tag: "Prizma",
  },

  // ==========================================================================
  // 6. ÖZEL ÜNVANLAR (Titles)
  // ==========================================================================
  {
    id: "title_code_wizard",
    name: "Kod Büyücüsü",
    description: "Kullanıcı adının hemen yanında beliren prestijli ünvan rozeti.",
    type: "title",
    price: 120,
    icon: "🧙‍♂️",
    tag: "Öne Çıkan",
  },
  {
    id: "title_cyber_wanderer",
    name: "Siber Gezgin",
    description: "Dijital labirentlerde kaybolanlar için özel ünvan.",
    type: "title",
    price: 100,
    icon: "🌌",
  },
  {
    id: "title_lobby_legend",
    name: "Lobi Efsanesi",
    description: "Odalarda herkesin saygı duyduğu duayen ünvanı.",
    type: "title",
    price: 350,
    icon: "👑",
    tag: "Efsanevi",
  },
  {
    id: "title_caffeine_fiend",
    name: "Kafein Canavarı",
    description: "Gece gündüz klavye başında kahveyle yaşayanlara.",
    type: "title",
    price: 80,
    icon: "☕",
  },
  {
    id: "title_lobby_maestro",
    name: "Lobi Virtüözü",
    description: "Sohbette ve oyunlarda ritmi belirleyen usta unvanı.",
    type: "title",
    price: 220,
    icon: "🎻",
    tag: "Popüler",
  },
  {
    id: "title_neon_ninja",
    name: "Neon Ninja",
    description: "Hızlı, sessiz ve her odada iz bırakan bir gölge.",
    type: "title",
    price: 160,
    icon: "🥷",
    tag: "Yeni",
  },

  // ==========================================================================
  // 6. NADİR ROZETLER
  // ==========================================================================
  {
    id: "badge_rich_club",
    name: "Zenginler Kulübü Rozeti",
    description: "Lobi mağazasından özel olarak satın alınabilen altın taç rozeti.",
    type: "badge",
    price: 300,
    icon: "💎",
    tag: "Prestij",
  },
  {
    id: "badge_collector",
    name: "Koleksiyoner Rozeti",
    description: "Mağaza ve görev meraklılarına özel madalya.",
    type: "badge",
    price: 250,
    icon: "🏅",
  },
  {
    id: "badge_quest_champion",
    name: "Görev Şampiyonu Rozeti",
    description: "Tüm günlük ve haftalık hedefleri alt edenlere layık efsanevi rozet.",
    type: "badge",
    price: 400,
    icon: "🏆",
    tag: "Efsanevi",
  },
];

export function getShopItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}
