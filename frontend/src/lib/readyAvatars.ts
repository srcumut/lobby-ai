// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/readyAvatars.ts
// PURPOSE: Curated collection of 100 Ready-to-use Neo-Brutalist Avatars & profile badge metadata
// ============================================================================

export interface ReadyAvatar {
  id: string;
  name: string;
  path: string;
  dataUri: string;
}

export const READY_AVATARS: ReadyAvatar[] = [
  { id: "avatar-1", name: "Avatar #1", path: "/avatars/1.png", dataUri: "/avatars/1.png" },
  { id: "avatar-2", name: "Avatar #2", path: "/avatars/2.png", dataUri: "/avatars/2.png" },
  { id: "avatar-3", name: "Avatar #3", path: "/avatars/3.png", dataUri: "/avatars/3.png" },
  { id: "avatar-4", name: "Avatar #4", path: "/avatars/4.png", dataUri: "/avatars/4.png" },
  { id: "avatar-5", name: "Avatar #5", path: "/avatars/5.png", dataUri: "/avatars/5.png" },
  { id: "avatar-6", name: "Avatar #6", path: "/avatars/6.png", dataUri: "/avatars/6.png" },
  { id: "avatar-7", name: "Avatar #7", path: "/avatars/7.png", dataUri: "/avatars/7.png" },
];


export interface ProfileBadgeItem {
  id: string;
  category: "games" | "community" | "ai";
  categoryLabel: string;
  title: string;
  badgeTag: string;
  level: "STANDART" | "NADİR" | "USTA" | "EFSANEVİ";
  iconEmoji: string;
  bg: string;
  description: string;
  unlockCondition: string;
  isUnlocked: boolean;
}

export const ALL_PROFILE_BADGES: ProfileBadgeItem[] = [
  // Games & Duels
  {
    id: "duel_master",
    category: "games",
    categoryLabel: "⚔️ Düello & Oyun",
    title: "Düello Ustası",
    badgeTag: "⚔️ ŞAMPİYON",
    level: "EFSANEVİ",
    iconEmoji: "⚔️",
    bg: "bg-[#FB923C]",
    description: "Lobilerdeki XOX veya Taş-Kağıt-Makas düellolarında 5 galibiyete ulaştı.",
    unlockCondition: "Lobi sohbetinde 5 düello kazan.",
    isUnlocked: true,
  },
  {
    id: "trivia_pro",
    category: "games",
    categoryLabel: "⚔️ Düello & Oyun",
    title: "Bilgi Canavarı",
    badgeTag: "🧠 TRIVIA",
    level: "USTA",
    iconEmoji: "🧠",
    bg: "bg-[#FEF08A]",
    description: "Lobi bilgi yarışmasında üstün performans gösterdi.",
    unlockCondition: "Bir trivia turunda en yüksek skoru al.",
    isUnlocked: true,
  },
  {
    id: "dice_lucky",
    category: "games",
    categoryLabel: "⚔️ Düello & Oyun",
    title: "Kritik Şans",
    badgeTag: "🎲 KRİTİK 100",
    level: "NADİR",
    iconEmoji: "🎲",
    bg: "bg-[#FCA5A5]",
    description: "Zar atışında kritik 100 yakaladı.",
    unlockCondition: "Sohbete '/zar' yazarak kritik 100 at.",
    isUnlocked: false,
  },

  // Community & Social
  {
    id: "verified_member",
    category: "community",
    categoryLabel: "👑 Topluluk & Sosyal",
    title: "Doğrulanmış Üye",
    badgeTag: "🛡️ ONAYLI",
    level: "STANDART",
    iconEmoji: "🛡️",
    bg: "bg-[#4ADE80]",
    description: "Lobby AI hesabı doğrulandı ve aktif topluluk üyesi.",
    unlockCondition: "Hesap oluştur ve giriş yap.",
    isUnlocked: true,
  },
  {
    id: "lobby_founder",
    category: "community",
    categoryLabel: "👑 Topluluk & Sosyal",
    title: "Lobi Mimarı",
    badgeTag: "👑 KURUCU",
    level: "USTA",
    iconEmoji: "👑",
    bg: "bg-[#FEF08A]",
    description: "En az bir genel lobi kurdu ve üyeleri ağırladı.",
    unlockCondition: "Kendi lobini oluştur.",
    isUnlocked: true,
  },
  {
    id: "early_adopter",
    category: "community",
    categoryLabel: "👑 Topluluk & Sosyal",
    title: "Erken Katılımcı",
    badgeTag: "⭐ ALFA/BETA",
    level: "NADİR",
    iconEmoji: "⭐",
    bg: "bg-[#F472B6]",
    description: "Lobby AI ilk aşamalarında katıldı.",
    unlockCondition: "İlk sürüm döneminde kaydol.",
    isUnlocked: true,
  },
  {
    id: "social_butterfly",
    category: "community",
    categoryLabel: "👑 Topluluk & Sosyal",
    title: "Sosyal Kelebek",
    badgeTag: "💬 DOST CANLISI",
    level: "USTA",
    iconEmoji: "🦋",
    bg: "bg-[#67E8F9]",
    description: "Arkadaş listesine birden fazla dost ekledi.",
    unlockCondition: "En az 3 arkadaş ekle.",
    isUnlocked: false,
  },

  // AI & Technology
  {
    id: "ai_architect",
    category: "ai",
    categoryLabel: "🤖 Yapay Zeka & Teknoloji",
    title: "Ajan Mimarı",
    badgeTag: "🤖 BOT MİMARI",
    level: "EFSANEVİ",
    iconEmoji: "🤖",
    bg: "bg-[#C4B5FD]",
    description: "Kendi otonom AI ajanını yapılandırdı ve odaya davet etti.",
    unlockCondition: "Ajanlarım bölümünden ilk AI ajanını oluştur.",
    isUnlocked: true,
  },
  {
    id: "prompt_crafter",
    category: "ai",
    categoryLabel: "🤖 Yapay Zeka & Teknoloji",
    title: "Prompt Mühendisi",
    badgeTag: "⚡ PROMPT",
    level: "NADİR",
    iconEmoji: "⚡",
    bg: "bg-[#FDE047]",
    description: "Ajan sistem talimatlarını optimize etti.",
    unlockCondition: "Bir AI ajanının sistem promptunu özelleştir.",
    isUnlocked: false,
  },
];
