// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/readyAvatars.ts
// PURPOSE: Curated collection of 9 Neo-Brutalist vector avatars & badge metadata
// ============================================================================

export interface ReadyAvatar {
  id: string;
  name: string;
  title: string;
  emoji: string;
  bg: string;
  dataUri: string;
}

// Helper to generate crisp SVG data URIs for neo-brutalist character faces
function createAvatarSvg(
  bgColor: string,
  faceFeature: string,
  accessory: string = ""
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" fill="${bgColor}" rx="16" />
    <rect x="3" y="3" width="94" height="94" fill="none" stroke="#000000" stroke-width="6" rx="13" />
    ${faceFeature}
    ${accessory}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const READY_AVATARS: ReadyAvatar[] = [
  {
    id: "cyber-cat",
    name: "Siber Kedi",
    title: "Gece Nöbetçisi",
    emoji: "🐱",
    bg: "#FEF08A",
    dataUri: createAvatarSvg(
      "#FEF08A",
      `<!-- Cat ears -->
       <polygon points="20,38 32,14 44,35" fill="#FB923C" stroke="#000" stroke-width="4" stroke-linejoin="round" />
       <polygon points="80,38 68,14 56,35" fill="#FB923C" stroke="#000" stroke-width="4" stroke-linejoin="round" />
       <!-- Eyes -->
       <rect x="28" y="44" width="12" height="12" fill="#000" rx="2" />
       <rect x="60" y="44" width="12" height="12" fill="#000" rx="2" />
       <circle cx="31" cy="47" r="2.5" fill="#FFF" />
       <circle cx="63" cy="47" r="2.5" fill="#FFF" />
       <!-- Nose & Mouth -->
       <polygon points="50,60 45,55 55,55" fill="#F472B6" stroke="#000" stroke-width="2.5" />
       <path d="M42,65 Q50,70 58,65" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round" />
       <!-- Whiskers -->
       <line x1="16" y1="56" x2="32" y2="58" stroke="#000" stroke-width="3" />
       <line x1="16" y1="65" x2="32" y2="63" stroke="#000" stroke-width="3" />
       <line x1="84" y1="56" x2="68" y2="58" stroke="#000" stroke-width="3" />
       <line x1="84" y1="65" x2="68" y2="63" stroke="#000" stroke-width="3" />`
    ),
  },
  {
    id: "retro-bot",
    name: "Mekanik Ajan",
    title: "Otonom İşlemci",
    emoji: "🤖",
    bg: "#67E8F9",
    dataUri: createAvatarSvg(
      "#67E8F9",
      `<!-- Antenna -->
       <line x1="50" y1="12" x2="50" y2="28" stroke="#000" stroke-width="5" />
       <circle cx="50" cy="12" r="6" fill="#F87171" stroke="#000" stroke-width="3" />
       <!-- Bot Head Frame -->
       <rect x="22" y="28" width="56" height="50" fill="#E2E8F0" stroke="#000" stroke-width="4.5" rx="6" />
       <!-- Visor Screen -->
       <rect x="28" y="36" width="44" height="20" fill="#000" rx="3" />
       <circle cx="38" cy="46" r="4.5" fill="#4ADE80" />
       <circle cx="62" cy="46" r="4.5" fill="#4ADE80" />
       <!-- Bot Mouth Grid -->
       <line x1="34" y1="66" x2="66" y2="66" stroke="#000" stroke-width="4" stroke-linecap="round" />
       <line x1="42" y1="62" x2="42" y2="70" stroke="#000" stroke-width="2.5" />
       <line x1="50" y1="62" x2="50" y2="70" stroke="#000" stroke-width="2.5" />
       <line x1="58" y1="62" x2="58" y2="70" stroke="#000" stroke-width="2.5" />
       <!-- Bolt ears -->
       <rect x="14" y="44" width="8" height="16" fill="#94A3B8" stroke="#000" stroke-width="3" />
       <rect x="78" y="44" width="8" height="16" fill="#94A3B8" stroke="#000" stroke-width="3" />`
    ),
  },
  {
    id: "pixel-knight",
    name: "Piksel Şövalye",
    title: "Lobi Muhafızı",
    emoji: "🛡️",
    bg: "#FB923C",
    dataUri: createAvatarSvg(
      "#FB923C",
      `<!-- Helmet -->
       <path d="M26,30 Q50,14 74,30 L74,74 L26,74 Z" fill="#94A3B8" stroke="#000" stroke-width="4.5" stroke-linejoin="round" />
       <!-- Visor slit -->
       <rect x="32" y="42" width="36" height="10" fill="#000" stroke="#000" stroke-width="2" rx="2" />
       <rect x="38" y="45" width="8" height="4" fill="#FEF08A" />
       <rect x="54" y="45" width="8" height="4" fill="#FEF08A" />
       <!-- Plume feather -->
       <path d="M50,16 Q60,4 72,12 Q64,22 50,18" fill="#EF4444" stroke="#000" stroke-width="3.5" />
       <!-- Mouth vents -->
       <circle cx="44" cy="62" r="2" fill="#000" />
       <circle cx="50" cy="62" r="2" fill="#000" />
       <circle cx="56" cy="62" r="2" fill="#000" />`
    ),
  },
  {
    id: "cyber-punk",
    name: "Siberpunk",
    title: "Şehir Korsanı",
    emoji: "🕶️",
    bg: "#F472B6",
    dataUri: createAvatarSvg(
      "#F472B6",
      `<!-- Spiky Hair -->
       <polygon points="24,32 30,12 42,28 54,8 64,26 78,16 74,36" fill="#000" stroke="#000" stroke-width="3" />
       <!-- Face base -->
       <circle cx="50" cy="54" r="28" fill="#FED7AA" stroke="#000" stroke-width="4" />
       <!-- Cool Neon Sunglasses -->
       <polygon points="26,45 74,45 68,60 32,60" fill="#18181B" stroke="#000" stroke-width="3.5" />
       <line x1="28" y1="48" x2="72" y2="48" stroke="#4ADE80" stroke-width="2.5" />
       <!-- Smirk -->
       <path d="M46,70 Q54,74 60,68" fill="none" stroke="#000" stroke-width="3.5" stroke-linecap="round" />
       <!-- Piercing -->
       <circle cx="78" cy="58" r="2.5" fill="#FEF08A" stroke="#000" stroke-width="2" />`
    ),
  },
  {
    id: "cosmic-voyager",
    name: "Kozmik Gezgin",
    title: "Galaksi Kaşifi",
    emoji: "🚀",
    bg: "#A78BFA",
    dataUri: createAvatarSvg(
      "#A78BFA",
      `<!-- Astronaut Helmet -->
       <circle cx="50" cy="50" r="34" fill="#F8FAFC" stroke="#000" stroke-width="4.5" />
       <!-- Visor reflection -->
       <ellipse cx="50" cy="48" rx="24" ry="18" fill="#1E1B4B" stroke="#000" stroke-width="3.5" />
       <!-- Gold sheen -->
       <path d="M34,42 Q50,34 66,42" fill="none" stroke="#F59E0B" stroke-width="4" stroke-linecap="round" />
       <circle cx="62" cy="44" r="2" fill="#FFF" />
       <!-- Helmet mic -->
       <circle cx="28" cy="62" r="3.5" fill="#EF4444" stroke="#000" stroke-width="2" />`
    ),
  },
  {
    id: "neon-ninja",
    name: "Neon Ninja",
    title: "Gölge Ustası",
    emoji: "🥷",
    bg: "#4ADE80",
    dataUri: createAvatarSvg(
      "#4ADE80",
      `<!-- Ninja Hood -->
       <circle cx="50" cy="52" r="32" fill="#18181B" stroke="#000" stroke-width="4.5" />
       <!-- Headband -->
       <rect x="20" y="28" width="60" height="12" fill="#EF4444" stroke="#000" stroke-width="3.5" />
       <!-- Metal Plate -->
       <rect x="40" y="31" width="20" height="7" fill="#E2E8F0" stroke="#000" stroke-width="2" rx="1.5" />
       <!-- Face slit -->
       <rect x="28" y="44" width="44" height="12" fill="#FED7AA" stroke="#000" stroke-width="3" />
       <!-- Fierce Eyes -->
       <polygon points="34,48 44,52 36,54" fill="#000" />
       <polygon points="66,48 56,52 64,54" fill="#000" />`
    ),
  },
  {
    id: "retro-gamer",
    name: "Retro Oyuncu",
    title: "Highscore Avcısı",
    emoji: "👾",
    bg: "#FCA5A5",
    dataUri: createAvatarSvg(
      "#FCA5A5",
      `<!-- Headset -->
       <path d="M18,52 C18,28 82,28 82,52" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" />
       <rect x="14" y="44" width="10" height="20" fill="#FEF08A" stroke="#000" stroke-width="3.5" rx="3" />
       <rect x="76" y="44" width="10" height="20" fill="#FEF08A" stroke="#000" stroke-width="3.5" rx="3" />
       <!-- Face -->
       <circle cx="50" cy="54" r="26" fill="#FED7AA" stroke="#000" stroke-width="4" />
       <!-- Pixels Eyes -->
       <rect x="36" y="48" width="8" height="8" fill="#000" />
       <rect x="56" y="48" width="8" height="8" fill="#000" />
       <!-- Happy Open Mouth -->
       <path d="M42,64 Q50,72 58,64 Z" fill="#EF4444" stroke="#000" stroke-width="3" />
       <!-- Cap Backwards -->
       <path d="M26,38 Q50,22 74,38 L78,42 L22,42 Z" fill="#3B82F6" stroke="#000" stroke-width="3.5" />`
    ),
  },
  {
    id: "code-wizard",
    name: "Kod Büyücüsü",
    title: "Syntax Mimarı",
    emoji: "🧙‍♂️",
    bg: "#C4B5FD",
    dataUri: createAvatarSvg(
      "#C4B5FD",
      `<!-- Wizard Beard -->
       <path d="M34,58 Q50,92 66,58 Z" fill="#F1F5F9" stroke="#000" stroke-width="3.5" />
       <!-- Face base -->
       <circle cx="50" cy="48" r="22" fill="#FED7AA" stroke="#000" stroke-width="3.5" />
       <!-- Eyes -->
       <circle cx="42" cy="46" r="3" fill="#000" />
       <circle cx="58" cy="46" r="3" fill="#000" />
       <!-- Wizard Hat -->
       <polygon points="14,38 86,38 50,4" fill="#6D28D9" stroke="#000" stroke-width="4.5" stroke-linejoin="round" />
       <polygon points="50,18 53,24 60,25 55,29 57,36 50,32 43,36 45,29 40,25 47,24" fill="#FEF08A" stroke="#000" stroke-width="2" />`
    ),
  },
  {
    id: "pastel-panda",
    name: "Pastel Panda",
    title: "Chill Moderatör",
    emoji: "🐼",
    bg: "#86EFAC",
    dataUri: createAvatarSvg(
      "#86EFAC",
      `<!-- Panda Ears -->
       <circle cx="26" cy="30" r="12" fill="#18181B" stroke="#000" stroke-width="4" />
       <circle cx="74" cy="30" r="12" fill="#18181B" stroke="#000" stroke-width="4" />
       <!-- Head -->
       <circle cx="50" cy="54" r="30" fill="#FFFFFF" stroke="#000" stroke-width="4.5" />
       <!-- Eye patches -->
       <ellipse cx="38" cy="50" rx="9" ry="11" fill="#18181B" stroke="#000" stroke-width="2" transform="rotate(-15 38 50)" />
       <ellipse cx="62" cy="50" rx="9" ry="11" fill="#18181B" stroke="#000" stroke-width="2" transform="rotate(15 62 50)" />
       <circle cx="39" cy="49" r="3" fill="#FFF" />
       <circle cx="61" cy="49" r="3" fill="#FFF" />
       <!-- Nose & Mouth -->
       <ellipse cx="50" cy="62" rx="5" ry="3.5" fill="#18181B" />
       <path d="M46,67 Q50,71 54,67" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" />
       <!-- Bamboo Shoot -->
       <rect x="22" y="64" width="22" height="6" fill="#4ADE80" stroke="#000" stroke-width="2.5" rx="2" transform="rotate(-20 22 64)" />`
    ),
  },
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
