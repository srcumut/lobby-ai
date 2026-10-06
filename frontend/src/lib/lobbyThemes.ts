// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/lobbyThemes.ts
// PURPOSE: Neo-Brutalist themes, icons and visual style mappings for lobby customization
// ============================================================================

export interface LobbyThemeConfig {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  headerGradient: string;
  badgeBg: string;
  chatBg: string;
  borderAccent: string;
  swatchBg: string;
}

export const LOBBY_THEMES: LobbyThemeConfig[] = [
  {
    id: "cyber-cyan",
    name: "Siber Camgöbeği",
    description: "Derin okyanus mavisi, siber camgöbeği ve gece zarafeti",
    accentColor: "#06B6D4",
    headerGradient: "bg-gradient-to-r from-[#06B6D4] via-[#67E8F9] to-[#E0F2FE]",
    badgeBg: "bg-[#06B6D4] text-black",
    chatBg: "bg-[#F0FDF4]/50",
    borderAccent: "border-[#0891B2]",
    swatchBg: "bg-[#06B6D4]",
  },
  {
    id: "electric-violet",
    name: "Elektrik Mor",
    description: "Yüksek enerjili mor, lavanta ve siberpunk neon vurgular",
    accentColor: "#8B5CF6",
    headerGradient: "bg-gradient-to-r from-[#C4B5FD] via-[#DDD6FE] to-[#F3E8FF]",
    badgeBg: "bg-[#8B5CF6] text-white",
    chatBg: "bg-[#FAF5FF]/50",
    borderAccent: "border-[#7C3AED]",
    swatchBg: "bg-[#8B5CF6]",
  },
  {
    id: "emerald-matrix",
    name: "Terminal Zümrüt",
    description: "Matrix yeşili, taze nane ve hacker estetiği",
    accentColor: "#10B981",
    headerGradient: "bg-gradient-to-r from-[#A7F3D0] via-[#D1FAE5] to-[#ECFDF5]",
    badgeBg: "bg-[#10B981] text-black",
    chatBg: "bg-[#F0FDF4]/40",
    borderAccent: "border-[#059669]",
    swatchBg: "bg-[#10B981]",
  },
  {
    id: "sunset-coral",
    name: "Günbatımı Mercan",
    description: "Ilık şeftali, pastel gül ve yumuşak amber parıltısı",
    accentColor: "#F472B6",
    headerGradient: "bg-gradient-to-r from-[#FECDD3] via-[#FED7AA] to-[#FEF08A]",
    badgeBg: "bg-[#F472B6] text-black",
    chatBg: "bg-[#FFF7ED]/40",
    borderAccent: "border-[#FB7185]",
    swatchBg: "bg-[#F472B6]",
  },
  {
    id: "classic-parchment",
    name: "Klasik Parşömen",
    description: "Sıcak krem, fildişi ve zamansız neo-brutalist zarafet",
    accentColor: "#FEF08A",
    headerGradient: "bg-gradient-to-r from-[#FEF08A] via-[#FDE047] to-[#FEF9C3]",
    badgeBg: "bg-[#FEF08A] text-black",
    chatBg: "bg-[#FFFDF5]",
    borderAccent: "border-[#CA8A04]",
    swatchBg: "bg-[#FEF08A]",
  },
  {
    id: "midnight-dark",
    name: "Gece Yarısı",
    description: "Mat kömür grisi, altın sarısı neon ve yüksek kontrast",
    accentColor: "#18181B",
    headerGradient: "bg-gradient-to-r from-[#27272A] via-[#3F3F46] to-[#18181B] text-white",
    badgeBg: "bg-[#FEF08A] text-black",
    chatBg: "bg-[#F4F4F5]",
    borderAccent: "border-black",
    swatchBg: "bg-[#18181B]",
  },
];

export const LOBBY_ICONS = [
  "💬", "🎮", "⚡", "🤖", "🔥", "🎧", "🚀", "☕", "🛡️", "🎨", "⚔️", "👾"
];

export function getLobbyTheme(themeId?: string): LobbyThemeConfig {
  const found = LOBBY_THEMES.find((t) => t.id === themeId);
  return found || LOBBY_THEMES[0]; // defaults to cyber-cyan
}
