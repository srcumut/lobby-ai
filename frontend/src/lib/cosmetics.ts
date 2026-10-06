// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/cosmetics.ts
// PURPOSE: Unified manager for in-game equipped cosmetics, themes, borders & titles
// ============================================================================

export type CosmeticCategory = 
  | "border" 
  | "avatar_animation"
  | "title" 
  | "lobby_theme" 
  | "dm_theme" 
  | "global_theme" 
  | "badge";

export interface EquippedCosmetics {
  border?: string;           // item_id e.g. "border_gold_brutal"
  avatar_animation?: string; // item_id e.g. "anim_breathe"
  title?: string;            // item_id e.g. "title_code_wizard"
  lobby_theme?: string;      // item_id e.g. "lobby_theme_cyber_neon"
  dm_theme?: string;         // item_id e.g. "dm_theme_midnight_purple"
  global_theme?: string;     // item_id e.g. "global_theme_deep_galaxy"
  badge?: string;            // item_id e.g. "badge_rich_club"
}

const COSMETICS_STORAGE_KEY = "lobby-ai:equipped-cosmetics";

export function getEquippedCosmetics(): EquippedCosmetics {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COSMETICS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setEquippedCosmetic(
  category: CosmeticCategory,
  itemId: string | null
): EquippedCosmetics {
  if (typeof window === "undefined") return {};
  const current = getEquippedCosmetics();
  if (itemId) {
    current[category] = itemId;
  } else {
    delete current[category];
  }

  try {
    localStorage.setItem(COSMETICS_STORAGE_KEY, JSON.stringify(current));
  } catch {}

  window.dispatchEvent(
    new CustomEvent("lobby:cosmetics_updated", {
      detail: current,
    })
  );

  return current;
}

export function toggleEquippedCosmetic(
  category: CosmeticCategory,
  itemId: string
): { equipped: boolean; cosmetics: EquippedCosmetics } {
  const current = getEquippedCosmetics();
  const isAlreadyEquipped = current[category] === itemId;
  const next = isAlreadyEquipped ? null : itemId;
  const updated = setEquippedCosmetic(category, next);
  return {
    equipped: !isAlreadyEquipped,
    cosmetics: updated,
  };
}

export function isCosmeticEquipped(
  itemId: string,
  category?: CosmeticCategory
): boolean {
  const current = getEquippedCosmetics();
  if (category) {
    return current[category] === itemId;
  }
  return Object.values(current).includes(itemId);
}

// ----------------------------------------------------------------------------
// Border Styling Helper
// ----------------------------------------------------------------------------
export function getBorderClass(borderId?: string | null): string {
  if (!borderId) return "";
  switch (borderId) {
    case "border_gold_brutal":
      return "ring-4 ring-[#FBBF24] ring-offset-2 ring-offset-black shadow-[3px_3px_0_0_#000]";
    case "border_cyber_neon":
      return "ring-4 ring-[#06B6D4] ring-offset-2 ring-offset-black shadow-[3px_3px_0_0_#06B6D4]";
    case "border_matrix_green":
      return "ring-4 ring-[#22C55E] ring-offset-2 ring-offset-black shadow-[3px_3px_0_0_#000]";
    case "border_crimson_flame":
      return "ring-4 ring-[#EF4444] ring-offset-2 ring-offset-black shadow-[3px_3px_0_0_#000]";
    case "border_amethyst_dragon":
      return "ring-4 ring-[#A855F7] ring-offset-2 ring-offset-black shadow-[3px_3px_0_0_#A855F7]";
    case "border_holo_rainbow":
      return "ring-4 ring-[#EC4899] ring-offset-2 ring-offset-black shadow-[3px_3px_0_0_#FBBF24]";
    default:
      return "";
  }
}

// ----------------------------------------------------------------------------
// Title Badge Helper
// ----------------------------------------------------------------------------
export function getTitleBadge(
  titleId?: string | null
): { name: string; icon: string; className: string } | null {
  if (!titleId) return null;
  switch (titleId) {
    case "title_code_wizard":
      return {
        name: "Kod Büyücüsü",
        icon: "🧙‍♂️",
        className: "bg-[#60A5FA] text-black border border-black shadow-[1.5px_1.5px_0_0_#000]",
      };
    case "title_cyber_wanderer":
      return {
        name: "Siber Gezgin",
        icon: "🌌",
        className: "bg-[#06B6D4] text-black border border-black shadow-[1.5px_1.5px_0_0_#000]",
      };
    case "title_lobby_legend":
      return {
        name: "Lobi Efsanesi",
        icon: "👑",
        className: "bg-[#FBBF24] text-black border border-black shadow-[1.5px_1.5px_0_0_#000]",
      };
    case "title_caffeine_fiend":
      return {
        name: "Kafein Canavarı",
        icon: "☕",
        className: "bg-[#FED7AA] text-black border border-black shadow-[1.5px_1.5px_0_0_#000]",
      };
    case "title_lobby_maestro":
      return {
        name: "Lobi Virtüözü",
        icon: "🎻",
        className: "bg-[#F472B6] text-black border border-black shadow-[1.5px_1.5px_0_0_#000]",
      };
    case "title_neon_ninja":
      return {
        name: "Neon Ninja",
        icon: "🥷",
        className: "bg-[#A855F7] text-white border border-black shadow-[1.5px_1.5px_0_0_#000]",
      };
    default:
      return null;
  }
}

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// Lobby Chat & Windows Theme Helper
// ----------------------------------------------------------------------------
export interface LobbyThemeStyles {
  chatContainerClass: string;
  myBubbleClass: string;
  otherBubbleClass: string;
  // Side & Top Window styles
  headerGradient: string;
  headerTitleClass: string;
  headerSubtitleClass: string;
  membersHeaderClass: string;
  membersBodyClass: string;
  membersItemHoverClass: string;
  membersTextPrimary: string;
  membersTextSecondary: string;
  inputBarClass: string;
}

export function getLobbyThemeStyles(themeId?: string | null): LobbyThemeStyles {
  switch (themeId) {
    case "lobby_theme_cyber_neon":
      return {
        chatContainerClass: "bg-[#0B1120] text-white border-black",
        myBubbleClass: "bg-[#1E293B] text-[#38BDF8] border-2 border-[#38BDF8] shadow-[2px_2px_0_0_#06B6D4]",
        otherBubbleClass: "bg-[#0F172A] text-gray-100 border-2 border-[#334155] shadow-[2px_2px_0_0_#000]",
        headerGradient: "bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#083344] text-white",
        headerTitleClass: "text-[#38BDF8]",
        headerSubtitleClass: "text-slate-300 font-bold",
        membersHeaderClass: "bg-[#0F172A] text-[#38BDF8] border-b-4 border-black",
        membersBodyClass: "bg-[#080D1A] text-slate-200",
        membersItemHoverClass: "hover:bg-cyan-950/40",
        membersTextPrimary: "text-slate-100",
        membersTextSecondary: "text-slate-400",
        inputBarClass: "bg-[#0F172A] border-t-4 border-[#06B6D4] text-white",
      };
    case "lobby_theme_retro_arcade":
      return {
        chatContainerClass: "bg-[#FFFBEB] text-black border-black",
        myBubbleClass: "bg-[#FEF08A] text-black border-2 border-black shadow-[2px_2px_0_0_#B45309]",
        otherBubbleClass: "bg-white text-black border-2 border-black shadow-[2px_2px_0_0_#000]",
        headerGradient: "bg-gradient-to-r from-[#FEF08A] via-[#FDE047] to-[#FED7AA] text-black",
        headerTitleClass: "text-black",
        headerSubtitleClass: "text-black/80 font-bold",
        membersHeaderClass: "bg-[#FEF08A] text-black border-b-4 border-black",
        membersBodyClass: "bg-[#FFFDF5] text-black",
        membersItemHoverClass: "hover:bg-amber-100",
        membersTextPrimary: "text-black",
        membersTextSecondary: "text-amber-800",
        inputBarClass: "bg-[#FEF08A] border-t-4 border-black text-black",
      };
    case "lobby_theme_matrix_hacker":
      return {
        chatContainerClass: "bg-[#051509] text-[#22C55E] border-[#22C55E]",
        myBubbleClass: "bg-[#0A2612] text-[#4ADE80] border-2 border-[#22C55E] shadow-[2px_2px_0_0_#22C55E]",
        otherBubbleClass: "bg-[#061B0D] text-[#86EFAC] border-2 border-[#15803D] shadow-[2px_2px_0_0_#000]",
        headerGradient: "bg-gradient-to-r from-[#021A08] via-[#052E10] to-[#021A08] text-[#4ADE80]",
        headerTitleClass: "text-[#4ADE80] font-mono",
        headerSubtitleClass: "text-[#86EFAC] font-bold",
        membersHeaderClass: "bg-[#021A08] text-[#4ADE80] border-b-4 border-black",
        membersBodyClass: "bg-[#011205] text-[#86EFAC]",
        membersItemHoverClass: "hover:bg-[#06290D]",
        membersTextPrimary: "text-[#86EFAC]",
        membersTextSecondary: "text-[#22C55E]/80",
        inputBarClass: "bg-[#021A08] border-t-4 border-[#22C55E] text-[#4ADE80]",
      };
    case "lobby_theme_lavender_haze":
      return {
        chatContainerClass: "bg-[#FAF5FF] text-black border-black",
        myBubbleClass: "bg-[#E9D5FF] text-[#581C87] border-2 border-[#7E22CE] shadow-[2px_2px_0_0_#7E22CE]",
        otherBubbleClass: "bg-white text-black border-2 border-black shadow-[2px_2px_0_0_#000]",
        headerGradient: "bg-gradient-to-r from-[#DDD6FE] via-[#E9D5FF] to-[#F3E8FF] text-black",
        headerTitleClass: "text-[#581C87]",
        headerSubtitleClass: "text-[#6B21A8]/80 font-bold",
        membersHeaderClass: "bg-[#DDD6FE] text-[#581C87] border-b-4 border-black",
        membersBodyClass: "bg-[#FAF5FF] text-black",
        membersItemHoverClass: "hover:bg-purple-100",
        membersTextPrimary: "text-purple-950",
        membersTextSecondary: "text-purple-700",
        inputBarClass: "bg-[#EDE9FE] border-t-4 border-[#7E22CE] text-black",
      };
    default:
      // Default standard Brutalist
      return {
        chatContainerClass: "bg-[#f4f4f5] text-black",
        myBubbleClass: "bg-[#f3e8ff] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        otherBubbleClass: "bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        headerGradient: "bg-gradient-to-r from-[#06B6D4] via-[#67E8F9] to-[#E0F2FE] text-black",
        headerTitleClass: "text-black",
        headerSubtitleClass: "text-black/80 font-bold",
        membersHeaderClass: "bg-[#FEF08A] text-black border-b-4 border-black",
        membersBodyClass: "bg-white text-black",
        membersItemHoverClass: "hover:bg-gray-100",
        membersTextPrimary: "text-black",
        membersTextSecondary: "text-gray-500",
        inputBarClass: "bg-[#FEF08A] border-t-4 border-black text-black",
      };
  }
}

// ----------------------------------------------------------------------------
// Direct Messages (DM) Theme Helper
// ----------------------------------------------------------------------------
export interface DmThemeStyles {
  chatContainerClass: string;
  myBubbleClass: string;
  partnerBubbleClass: string;
  // Side & Top Window styles
  headerClass: string;
  headerTitleClass: string;
  headerSubtitleClass: string;
  sidebarHeaderClass: string;
  sidebarBodyClass: string;
  sidebarItemHoverClass: string;
  sidebarActiveItemClass: string;
  sidebarTextPrimary: string;
  sidebarTextSecondary: string;
  inputBarClass: string;
  quickPromptsClass: string;
}

export function getDmThemeStyles(themeId?: string | null): DmThemeStyles {
  switch (themeId) {
    case "dm_theme_midnight_purple":
      return {
        chatContainerClass: "bg-[#0F0B1E] text-white",
        myBubbleClass: "bg-[#2E1065] text-[#E9D5FF] border-2 border-[#A855F7] shadow-[2px_2px_0_0_#7C3AED]",
        partnerBubbleClass: "bg-[#1E1638] text-gray-200 border-2 border-[#4C1D95] shadow-[2px_2px_0_0_#000]",
        headerClass: "bg-gradient-to-r from-[#1E1035] via-[#2E1065] to-[#1E1B4B] border-b-4 border-black text-white",
        headerTitleClass: "text-white font-black",
        headerSubtitleClass: "text-purple-200 font-bold",
        sidebarHeaderClass: "bg-[#1E1035] text-white border-b-4 border-black",
        sidebarBodyClass: "bg-[#130E26] text-slate-100",
        sidebarItemHoverClass: "hover:bg-[#231742]",
        sidebarActiveItemClass: "bg-[#3B196C] border-l-4 border-[#C084FC] text-white shadow-inner",
        sidebarTextPrimary: "text-white",
        sidebarTextSecondary: "text-purple-200/80",
        inputBarClass: "bg-[#1A1235] border-t-4 border-black text-white",
        quickPromptsClass: "bg-[#2E1065]/60 border-t-2 border-black text-white",
      };
    case "dm_theme_emerald_secure":
      return {
        chatContainerClass: "bg-[#041E15] text-[#34D399]",
        myBubbleClass: "bg-[#064E3B] text-[#A7F3D0] border-2 border-[#10B981] shadow-[2px_2px_0_0_#059669]",
        partnerBubbleClass: "bg-[#063327] text-gray-200 border-2 border-[#047857] shadow-[2px_2px_0_0_#000]",
        headerClass: "bg-gradient-to-r from-[#022C22] via-[#064E3B] to-[#022C22] border-b-4 border-black text-white",
        headerTitleClass: "text-[#A7F3D0] font-black",
        headerSubtitleClass: "text-emerald-200 font-bold",
        sidebarHeaderClass: "bg-[#022C22] text-[#A7F3D0] border-b-4 border-black",
        sidebarBodyClass: "bg-[#031E17] text-emerald-100",
        sidebarItemHoverClass: "hover:bg-[#07362B]",
        sidebarActiveItemClass: "bg-[#065F46] border-l-4 border-[#34D399] text-white shadow-inner",
        sidebarTextPrimary: "text-[#ECFDF5]",
        sidebarTextSecondary: "text-emerald-300/80",
        inputBarClass: "bg-[#03231A] border-t-4 border-black text-white",
        quickPromptsClass: "bg-[#064E3B]/60 border-t-2 border-black text-white",
      };
    case "dm_theme_sunset_vibes":
      return {
        chatContainerClass: "bg-[#FFF1F2] text-black",
        myBubbleClass: "bg-gradient-to-r from-[#F472B6] to-[#FB923C] text-white border-2 border-black shadow-[2px_2px_0_0_#000]",
        partnerBubbleClass: "bg-white text-black border-2 border-black shadow-[2px_2px_0_0_#000]",
        headerClass: "bg-gradient-to-r from-[#F43F5E] via-[#FB923C] to-[#F59E0B] border-b-4 border-black text-white",
        headerTitleClass: "text-white font-black drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]",
        headerSubtitleClass: "text-white/90 font-bold drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)]",
        sidebarHeaderClass: "bg-gradient-to-r from-[#F43F5E] to-[#FB923C] text-white border-b-4 border-black",
        sidebarBodyClass: "bg-[#FFF7ED] text-black",
        sidebarItemHoverClass: "hover:bg-[#FFEDD5]",
        sidebarActiveItemClass: "bg-[#FED7AA] border-l-4 border-[#F43F5E] text-black shadow-inner",
        sidebarTextPrimary: "text-black",
        sidebarTextSecondary: "text-orange-900/80",
        inputBarClass: "bg-gradient-to-r from-[#FECDD3] via-[#FED7AA] to-[#FEF08A] border-t-4 border-black text-black",
        quickPromptsClass: "bg-[#FECDD3]/70 border-t-2 border-black text-black",
      };
    default:
      // Default standard Brutalist
      return {
        chatContainerClass: "bg-[#f4f4f5] text-black",
        myBubbleClass: "bg-[#FEF9C3] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        partnerBubbleClass: "bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        headerClass: "bg-gradient-to-r from-[#FEF08A] via-[#FFEDD5] to-[#FCE7F3] border-b-4 border-black text-black",
        headerTitleClass: "text-black font-black",
        headerSubtitleClass: "text-black/70 font-bold",
        sidebarHeaderClass: "bg-[#FEF08A] text-black border-b-4 border-black",
        sidebarBodyClass: "bg-white text-black",
        sidebarItemHoverClass: "hover:bg-gray-50",
        sidebarActiveItemClass: "bg-[#FFE4E6] border-l-4 border-black text-black shadow-inner",
        sidebarTextPrimary: "text-black",
        sidebarTextSecondary: "text-gray-600",
        inputBarClass: "bg-[#FEF08A] border-t-4 border-black text-black",
        quickPromptsClass: "bg-[#FEF08A]/40 border-t-2 border-black text-black",
      };
  }
}

// ----------------------------------------------------------------------------
// Global Project-Wide Theme Helper
// ----------------------------------------------------------------------------
export function getGlobalThemeStyles(globalThemeId?: string | null): {
  isDarkGalaxy: boolean;
  shellClass: string;
  topBarClass: string;
  sidebarClass: string;
  ambientGlows: {
    glow1: string;
    glow2: string;
    glow3: string;
  };
} {
  if (globalThemeId === "global_theme_deep_galaxy") {
    return {
      isDarkGalaxy: true,
      shellClass: "bg-[#070B14] text-white theme-deep-galaxy",
      topBarClass: "bg-[#0B1120] text-white border-[#38BDF8]",
      sidebarClass: "bg-[#090E1A] text-white border-[#38BDF8]",
      ambientGlows: {
        glow1: "bg-[#4338CA]/25", // Cosmic Indigo
        glow2: "bg-[#7C3AED]/25", // Cosmic Purple
        glow3: "bg-[#06B6D4]/20", // Galaxy Cyan
      },
    };
  }

  // Default Standard Warm Neo-Brutalist
  return {
    isDarkGalaxy: false,
    shellClass: "bg-[#FAF8F0] text-black",
    topBarClass: "bg-[#FEF08A] text-black border-black",
    sidebarClass: "bg-[#FEF08A] text-black border-black",
    ambientGlows: {
      glow1: "bg-[#F472B6]/12",
      glow2: "bg-[#FB923C]/12",
      glow3: "bg-[#FEF08A]/20",
    },
  };
}

// ----------------------------------------------------------------------------
// Avatar Animation Helper
// ----------------------------------------------------------------------------
export function getAvatarAnimationClass(animationId?: string | null): string {
  if (!animationId) return "";
  switch (animationId) {
    case "anim_breathe":
      return "anim-avatar-breathe";
    case "anim_orbital_spin":
      return "anim-avatar-orbit";
    case "anim_matrix_glitch":
      return "anim-avatar-glitch";
    case "anim_flame_pulse":
      return "anim-avatar-flame";
    case "anim_rainbow_shimmer":
      return "anim-avatar-shimmer";
    default:
      return "";
  }
}

export function getAvatarAnimationInfo(animationId?: string | null): {
  name: string;
  icon: string;
  tag: string;
} | null {
  if (!animationId) return null;
  switch (animationId) {
    case "anim_breathe":
      return { name: "Kozmik Nefes", icon: "🫁", tag: "Nefes Alma Loop" };
    case "anim_orbital_spin":
      return { name: "Siber Yörünge", icon: "💫", tag: "360° Yörünge" };
    case "anim_matrix_glitch":
      return { name: "Matrix Glitch", icon: "⚡", tag: "Siber Glitch" };
    case "anim_flame_pulse":
      return { name: "Ateş Dansı", icon: "🔥", tag: "Ateş Haresi" };
    case "anim_rainbow_shimmer":
      return { name: "Holo Prizma", icon: "✨", tag: "Prizma Işıltısı" };
    default:
      return null;
  }
}
