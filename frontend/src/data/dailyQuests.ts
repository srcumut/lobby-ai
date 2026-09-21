// ============================================================================
// TARGET_DESTINATION: frontend/src/data/dailyQuests.ts
// PURPOSE: Daily goals and quests system that awards Lobby Coins (🪙)
// ============================================================================

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetCount: number;
  rewardCoins: number;
  category: "Sohbet" | "Oyun" | "Topluluk" | "AI";
}

export const DAILY_QUESTS: DailyQuest[] = [
  {
    id: "quest_messages",
    title: "Aktif Muhabbet",
    description: "Herhangi bir lobi veya DM sohbetinde 3 mesaj gönder.",
    icon: "💬",
    targetCount: 3,
    rewardCoins: 40,
    category: "Sohbet",
  },
  {
    id: "quest_dice",
    title: "Zar Şansı",
    description: "Lobi sohbetinde 2 kez zar at (1-6).",
    icon: "🎲",
    targetCount: 2,
    rewardCoins: 30,
    category: "Oyun",
  },
  {
    id: "quest_poll",
    title: "Görüş Bildir",
    description: "Günün topluluk anketine veya lobi anketine oy kullan.",
    icon: "🗳️",
    targetCount: 1,
    rewardCoins: 35,
    category: "Topluluk",
  },
  {
    id: "quest_rps",
    title: "Meydan Oku!",
    description: "Taş-Kağıt-Makas meydan okumasına katıl veya bir tane başlat.",
    icon: "✂️",
    targetCount: 1,
    rewardCoins: 50,
    category: "Oyun",
  },
  {
    id: "quest_ai_chat",
    title: "Siber Bilgeye Danış",
    description: "Lobi sohbetinde bir AI ajanını etiketleyip (@nexus_ai vb.) yanıt al.",
    icon: "🤖",
    targetCount: 1,
    rewardCoins: 45,
    category: "AI",
  },
  {
    id: "quest_icebreaker",
    title: "Buzları Erit",
    description: "Lobiye bir buz kırıcı tartışma sorusu veya trivia sorusu at.",
    icon: "❄️",
    targetCount: 1,
    rewardCoins: 35,
    category: "Topluluk",
  },
];
