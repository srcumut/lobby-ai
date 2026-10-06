// ============================================================================
// TARGET_DESTINATION: frontend/src/data/dailyQuests.ts
// PURPOSE: Genuine Daily & Weekly Quests with real activity verification, progress tracking, and coin rewards
// ============================================================================

import { awardCoins } from "@/lib/badgeManager";
import { toast } from "@/components/ui/toast";

export type QuestFrequency = "daily" | "weekly";

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetCount: number;
  rewardCoins: number;
  category: "Sohbet" | "Oyun" | "Topluluk" | "AI" | "Liderlik";
  frequency: QuestFrequency;
}

// Backward-compatibility alias
export type DailyQuest = Quest;

export const DAILY_QUESTS: Quest[] = [
  {
    id: "quest_messages",
    title: "Aktif Muhabbet",
    description: "Herhangi bir lobi veya DM sohbetinde 3 mesaj gönder.",
    icon: "💬",
    targetCount: 3,
    rewardCoins: 40,
    category: "Sohbet",
    frequency: "daily",
  },
  {
    id: "quest_dice",
    title: "Zar Şansı",
    description: "Lobi sohbetinde 2 kez zar at (1-6).",
    icon: "🎲",
    targetCount: 2,
    rewardCoins: 30,
    category: "Oyun",
    frequency: "daily",
  },
  {
    id: "quest_poll",
    title: "Görüş Bildir",
    description: "Günün topluluk anketine veya lobi anketine oy kullan.",
    icon: "🗳️",
    targetCount: 1,
    rewardCoins: 35,
    category: "Topluluk",
    frequency: "daily",
  },
  {
    id: "quest_rps",
    title: "Meydan Oku!",
    description: "Taş-Kağıt-Makas meydan okumasına katıl veya bir tane başlat.",
    icon: "✂️",
    targetCount: 1,
    rewardCoins: 50,
    category: "Oyun",
    frequency: "daily",
  },
  {
    id: "quest_ai_chat",
    title: "Siber Bilgeye Danış",
    description: "Lobi sohbetinde bir AI ajanını etiketleyip (@nexus_ai vb.) yanıt al.",
    icon: "🤖",
    targetCount: 1,
    rewardCoins: 45,
    category: "AI",
    frequency: "daily",
  },
  {
    id: "quest_icebreaker",
    title: "Buzları Erit",
    description: "Lobiye bir buz kırıcı tartışma sorusu veya trivia sorusu at.",
    icon: "❄️",
    targetCount: 1,
    rewardCoins: 35,
    category: "Topluluk",
    frequency: "daily",
  },
];

export const WEEKLY_QUESTS: Quest[] = [
  {
    id: "quest_weekly_lobbies",
    title: "Haftalık Gezgin",
    description: "Hafta boyunca en az 5 farklı lobi odasına katıl ve keşfet.",
    icon: "🧭",
    targetCount: 5,
    rewardCoins: 150,
    category: "Topluluk",
    frequency: "weekly",
  },
  {
    id: "quest_weekly_creator",
    title: "Siber Lider",
    description: "Kendi özel veya genel lobini oluştur ve üyeleri topla.",
    icon: "👑",
    targetCount: 1,
    rewardCoins: 200,
    category: "Liderlik",
    frequency: "weekly",
  },
  {
    id: "quest_weekly_games",
    title: "Şans Kumarbazı",
    description: "Lobi içi mini oyunlarda (Zar & RPS) toplam 10 kez hamle yap.",
    icon: "🎰",
    targetCount: 10,
    rewardCoins: 120,
    category: "Oyun",
    frequency: "weekly",
  },
  {
    id: "quest_weekly_social",
    title: "Topluluk Yıldızı",
    description: "3 farklı kullanıcıyla arkadaş ol veya DM üzerinden iletişim kur.",
    icon: "🤝",
    targetCount: 3,
    rewardCoins: 110,
    category: "Topluluk",
    frequency: "weekly",
  },
  {
    id: "quest_weekly_ai_expert",
    title: "Yapay Zeka Mimarı",
    description: "Ajan Oluşturucu ile yeni bir ajan tasarla veya lobiye dahil et.",
    icon: "⚡",
    targetCount: 1,
    rewardCoins: 180,
    category: "AI",
    frequency: "weekly",
  },
];

export const ALL_QUESTS: Quest[] = [...DAILY_QUESTS, ...WEEKLY_QUESTS];

export function getQuestById(id: string): Quest | undefined {
  return ALL_QUESTS.find((q) => q.id === id);
}

// ============================================================================
// Time Keys and LocalStorage Management
// ============================================================================

export function getDailyDateKey(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeeklyDateKey(d = new Date()): string {
  // ISO Week calculation (Starts Monday)
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${d.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

interface FrequencyStorage {
  dateKey: string;
  claimedIds: string[];
  progress: Record<string, number>;
}

interface QuestStorageFormat {
  daily: FrequencyStorage;
  weekly: FrequencyStorage;
}

const STORAGE_KEY = "lobby-ai:quests-store-v3";
const LEGACY_V2_KEY = "lobby-ai:quests-store-v2";
const LEGACY_V1_KEY = "lobby-ai:completed-quests";

function getStorageData(): QuestStorageFormat {
  if (typeof window === "undefined") {
    return {
      daily: { dateKey: getDailyDateKey(), claimedIds: [], progress: {} },
      weekly: { dateKey: getWeeklyDateKey(), claimedIds: [], progress: {} },
    };
  }

  const currentDailyKey = getDailyDateKey();
  const currentWeeklyKey = getWeeklyDateKey();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: QuestStorageFormat = JSON.parse(raw);
      if (!parsed.daily || parsed.daily.dateKey !== currentDailyKey) {
        parsed.daily = { dateKey: currentDailyKey, claimedIds: [], progress: {} };
      }
      if (!parsed.daily.progress) parsed.daily.progress = {};
      if (!parsed.daily.claimedIds) parsed.daily.claimedIds = [];

      if (!parsed.weekly || parsed.weekly.dateKey !== currentWeeklyKey) {
        parsed.weekly = { dateKey: currentWeeklyKey, claimedIds: [], progress: {} };
      }
      if (!parsed.weekly.progress) parsed.weekly.progress = {};
      if (!parsed.weekly.claimedIds) parsed.weekly.claimedIds = [];

      return parsed;
    }
  } catch {
    // parse fallback
  }

  // Fallback / initial from legacy
  let initialDailyClaimed: string[] = [];
  try {
    const v2 = localStorage.getItem(LEGACY_V2_KEY);
    if (v2) {
      const parsed = JSON.parse(v2);
      if (parsed.daily?.dateKey === currentDailyKey && Array.isArray(parsed.daily.claimedIds)) {
        initialDailyClaimed = parsed.daily.claimedIds;
      }
    } else {
      const v1 = localStorage.getItem(LEGACY_V1_KEY);
      if (v1) {
        const arr = JSON.parse(v1);
        if (Array.isArray(arr)) initialDailyClaimed = arr;
      }
    }
  } catch {}

  const initial: QuestStorageFormat = {
    daily: { dateKey: currentDailyKey, claimedIds: initialDailyClaimed, progress: {} },
    weekly: { dateKey: currentWeeklyKey, claimedIds: [], progress: {} },
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}

  return initial;
}

function saveStorageData(data: QuestStorageFormat) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

// ============================================================================
// Quest Query APIs
// ============================================================================

export function getClaimedQuests(frequency: QuestFrequency): string[] {
  const data = getStorageData();
  return data[frequency]?.claimedIds || [];
}

export function isQuestClaimed(questId: string, frequency: QuestFrequency): boolean {
  return getClaimedQuests(frequency).includes(questId);
}

export function getQuestProgress(questId: string, frequency: QuestFrequency): number {
  const data = getStorageData();
  return data[frequency]?.progress?.[questId] || 0;
}

export function isQuestCompleted(quest: Quest): boolean {
  const current = getQuestProgress(quest.id, quest.frequency);
  return current >= quest.targetCount;
}

export function canClaimReward(quest: Quest): boolean {
  const isClaimed = isQuestClaimed(quest.id, quest.frequency);
  const isComplete = isQuestCompleted(quest);
  return isComplete && !isClaimed;
}

// ============================================================================
// Progress Recording & Activity Verification
// ============================================================================

export function recordQuestProgress(
  questId: string,
  amount: number = 1
): { current: number; target: number; completed: boolean; newlyCompleted: boolean } {
  const quest = getQuestById(questId);
  if (!quest) {
    return { current: 0, target: 0, completed: false, newlyCompleted: false };
  }

  const data = getStorageData();
  const freqStorage = data[quest.frequency];
  const prevCount = freqStorage.progress[quest.id] || 0;
  const newCount = prevCount + amount;
  freqStorage.progress[quest.id] = newCount;
  saveStorageData(data);

  const isComplete = newCount >= quest.targetCount;
  const newlyCompleted = prevCount < quest.targetCount && isComplete;

  // Dispatch live reactive event
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("lobby:quest_progress_updated", {
        detail: {
          questId: quest.id,
          frequency: quest.frequency,
          current: newCount,
          targetCount: quest.targetCount,
          isCompleted: isComplete,
          newlyCompleted,
        },
      })
    );

    // Toast alert on achievement completion
    if (newlyCompleted) {
      toast.add({
        title: `🎯 GÖREV TAMAMLANDI: ${quest.title}!`,
        description: `Tebrikler! Hedefe ulaştın (${quest.targetCount}/${quest.targetCount}). Görevler menüsünden +${quest.rewardCoins} 🪙 ödülünü alabilirsin.`,
        type: "success",
      });
    }
  }

  return {
    current: newCount,
    target: quest.targetCount,
    completed: isComplete,
    newlyCompleted,
  };
}

export type QuestTrackingAction =
  | "message_sent"
  | "dice_rolled"
  | "poll_voted"
  | "rps_played"
  | "ai_chat"
  | "icebreaker_sent"
  | "lobby_visited"
  | "lobby_created"
  | "social_interaction"
  | "agent_created";

/**
 * High-level tracker called when user performs in-app actions.
 * Automatically maps to corresponding daily & weekly quests.
 */
export function trackQuestAction(action: QuestTrackingAction, amount: number = 1): void {
  switch (action) {
    case "message_sent":
      recordQuestProgress("quest_messages", amount);
      break;

    case "dice_rolled":
      recordQuestProgress("quest_dice", amount);
      recordQuestProgress("quest_weekly_games", amount);
      break;

    case "poll_voted":
      recordQuestProgress("quest_poll", amount);
      break;

    case "rps_played":
      recordQuestProgress("quest_rps", amount);
      recordQuestProgress("quest_weekly_games", amount);
      break;

    case "ai_chat":
      recordQuestProgress("quest_ai_chat", amount);
      break;

    case "icebreaker_sent":
      recordQuestProgress("quest_icebreaker", amount);
      break;

    case "lobby_visited":
      recordQuestProgress("quest_weekly_lobbies", amount);
      break;

    case "lobby_created":
      recordQuestProgress("quest_weekly_creator", amount);
      break;

    case "social_interaction":
      recordQuestProgress("quest_weekly_social", amount);
      break;

    case "agent_created":
      recordQuestProgress("quest_weekly_ai_expert", amount);
      break;

    default:
      break;
  }
}

// Global browser window listener for decoupled event tracking
if (typeof window !== "undefined") {
  window.addEventListener("lobby:track_quest_action", (e: any) => {
    if (e.detail?.action) {
      trackQuestAction(e.detail.action, e.detail.amount || 1);
    }
  });
}

// ============================================================================
// Claiming Rewards
// ============================================================================

export async function claimQuestReward(quest: Quest): Promise<number | null> {
  const data = getStorageData();
  const claimedList = data[quest.frequency].claimedIds;

  // 1. Check if already claimed
  if (claimedList.includes(quest.id)) {
    toast.add({
      title: "Ödül Zaten Alındı",
      description: "Bu görevin ödülü bu dönemde zaten toplandı.",
      type: "info",
    });
    return null;
  }

  // 2. REAL VERIFICATION: Check if user actually completed the quest requirement
  const currentProgress = getQuestProgress(quest.id, quest.frequency);
  if (currentProgress < quest.targetCount) {
    toast.add({
      title: "Görev Henüz Tamamlanmadı",
      description: `Bu ödülü almak için görevi tamamlamalısınız (${currentProgress}/${quest.targetCount}).`,
      type: "error",
    });
    return null;
  }

  // 3. Award coins via backend API
  const newCoins = await awardCoins(
    quest.rewardCoins,
    `Görev Tamamlandı: ${quest.title} (+${quest.rewardCoins} 🪙)`
  );

  // 4. Mark as claimed and persist
  data[quest.frequency].claimedIds.push(quest.id);
  saveStorageData(data);

  // 5. Dispatch specific event for reactive UI updates
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("lobby:quest_claimed", {
        detail: {
          questId: quest.id,
          frequency: quest.frequency,
          rewardCoins: quest.rewardCoins,
          coins: newCoins,
        },
      })
    );
  }

  return newCoins;
}

// ============================================================================
// Reset Timers
// ============================================================================

export function getTimeUntilDailyReset(): { hours: number; minutes: number; seconds: number; formatted: string } {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return { hours, minutes, seconds, formatted };
}

export function getTimeUntilWeeklyReset(): { days: number; hours: number; formatted: string } {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday
  const daysUntilMonday = day === 0 ? 1 : (8 - day);

  const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday, 0, 0, 0);
  const diffMs = nextMonday.getTime() - now.getTime();

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  const formatted = `${days} gün ${hours} saat`;
  return { days, hours, formatted };
}
