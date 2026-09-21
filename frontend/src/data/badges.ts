// ============================================================================
// TARGET_DESTINATION: frontend/src/data/badges.ts
// PURPOSE: Complete catalog of user badges & achievements with criteria and coin rewards
// ============================================================================

export interface BadgeDefinition {
  id: string;
  name: string;
  category: "Oyun & Şans" | "Topluluk & Sosyal" | "Yapay Zeka & Bilgi" | "Özel & Efsanevi";
  description: string;
  icon: string;
  color: string;
  coinReward: number;
  conditionDescription: string;
}

export const ALL_BADGES: BadgeDefinition[] = [
  // Oyun & Şans
  {
    id: "lucky_six",
    name: "Uğurlu Altılık",
    category: "Oyun & Şans",
    description: "Lobi zarında 6 attın!",
    icon: "🎲",
    color: "#E0F2FE",
    coinReward: 50,
    conditionDescription: "Zar atışında 6 sayısını tuttur."
  },
  {
    id: "triple_six",
    name: "Şansın Zirvesi (3x 6)",
    category: "Oyun & Şans",
    description: "Arka arkaya 3 kez 6 atarak imkansızı başardın!",
    icon: "🔥",
    color: "#FEE2E2",
    coinReward: 250,
    conditionDescription: "Art arda 3 kez 6 zarı at."
  },
  {
    id: "snake_eyes",
    name: "Yılan Gözü (1 Atışı)",
    category: "Oyun & Şans",
    description: "En düşük zar olan 1'i attın. Şanssızlık da bir sanattır!",
    icon: "🐍",
    color: "#FEF3C7",
    coinReward: 40,
    conditionDescription: "Zar atışında 1 at."
  },
  {
    id: "rps_master",
    name: "Taş-Kağıt-Makas Ustası",
    category: "Oyun & Şans",
    description: "Sohbet içi düelloda bir rakibini alt ettin.",
    icon: "✂️",
    color: "#F3E8FF",
    coinReward: 80,
    conditionDescription: "Taş-Kağıt-Makas düellosu kazan."
  },
  {
    id: "duel_veteran",
    name: "Meydan Okuyucu",
    category: "Oyun & Şans",
    description: "Lobi sohbetinde bir düello başlattın veya kabul ettin.",
    icon: "⚔️",
    color: "#FCE7F3",
    coinReward: 60,
    conditionDescription: "Herhangi bir mini oyunda düello tamamla."
  },
  {
    id: "coin_flipper",
    name: "Kader Parası",
    category: "Oyun & Şans",
    description: "Yazı-tura atışı yaparak şansını denedin.",
    icon: "🪙",
    color: "#FEF9C3",
    coinReward: 30,
    conditionDescription: "Lobi sohbetinde yazı-tura at."
  },

  // Topluluk & Sosyal
  {
    id: "first_hello",
    name: "İlk Merhaba",
    category: "Topluluk & Sosyal",
    description: "Bir lobide ilk sohbet mesajını gönderdin.",
    icon: "👋",
    color: "#DCFCE7",
    coinReward: 40,
    conditionDescription: "Herhangi bir lobiye ilk mesajını yaz."
  },
  {
    id: "poll_voter",
    name: "Demokrasi Neferi",
    category: "Topluluk & Sosyal",
    description: "Lobi veya Topluluk anketine oy kullandın.",
    icon: "🗳️",
    color: "#E0E7FF",
    coinReward: 50,
    conditionDescription: "Aktif bir ankete oy ver."
  },
  {
    id: "icebreaker_host",
    name: "Buz Kırıcı",
    category: "Topluluk & Sosyal",
    description: "Lobiye bir tartışma sorusu bırakarak muhabbeti başlattın.",
    icon: "❄️",
    color: "#CFFAFE",
    coinReward: 50,
    conditionDescription: "Buz kırıcı sorusu paylaş."
  },
  {
    id: "social_butterfly",
    name: "Sosyal Kelebek",
    category: "Topluluk & Sosyal",
    description: "Bir kullanıcıya arkadaşlık isteği gönderdin veya kabul ettin.",
    icon: "🦋",
    color: "#FDF2F8",
    coinReward: 70,
    conditionDescription: "Arkadaş listene yeni bir kullanıcı ekle."
  },
  {
    id: "dm_enthusiast",
    name: "Sırdaş",
    category: "Topluluk & Sosyal",
    description: "Özel mesaj (DM) üzerinden bir arkadaşınla iletişime geçtin.",
    icon: "💬",
    color: "#EDE9FE",
    coinReward: 50,
    conditionDescription: "Direkt mesaj gönder."
  },
  {
    id: "feedback_hero",
    name: "Geliştirici Dostu",
    category: "Topluluk & Sosyal",
    description: "Platforma bir öneri veya hata bildirimi ilettin.",
    icon: "💡",
    color: "#FEF08A",
    coinReward: 100,
    conditionDescription: "Geri bildirim formunu doldur."
  },

  // Yapay Zeka & Bilgi
  {
    id: "ai_whisperer",
    name: "AI Fısıldayanı",
    category: "Yapay Zeka & Bilgi",
    description: "Lobi sohbetinde bir AI ajanını etiketleyip yanıt aldın.",
    icon: "🤖",
    color: "#E0F2FE",
    coinReward: 60,
    conditionDescription: "Bir AI ajanına (@bot) mesaj gönder."
  },
  {
    id: "ai_creator",
    name: "Siber Mimar",
    category: "Yapay Zeka & Bilgi",
    description: "Kendine ait özel bir AI ajanı yarattın!",
    icon: "🧬",
    color: "#FAE8FF",
    coinReward: 150,
    conditionDescription: "AI Lab'de yeni bir ajan oluştur."
  },
  {
    id: "trivia_scholar",
    name: "Canlı Trivia Dehası",
    category: "Yapay Zeka & Bilgi",
    description: "Bir trivia sorusuna doğru yanıt verdin.",
    icon: "🧠",
    color: "#FEF08A",
    coinReward: 80,
    conditionDescription: "Trivia sorusunu doğru bil."
  },

  // Özel & Efsanevi
  {
    id: "pioneer",
    name: "Kurucu Öncü",
    category: "Özel & Efsanevi",
    description: "Lobby AI platformunun ilk kullanıcılarından biri oldun.",
    icon: "👑",
    color: "#FEF08A",
    coinReward: 200,
    conditionDescription: "Platform açılış döneminde hesap oluştur."
  },
  {
    id: "wealthy",
    name: "Lobi Zengini",
    category: "Özel & Efsanevi",
    description: "Görev ve oyunlardan toplam 500+ Lobby Coin biriktirdin.",
    icon: "💎",
    color: "#E0F2FE",
    coinReward: 100,
    conditionDescription: "500 coin eşiğine ulaş."
  },
  {
    id: "night_owl",
    name: "Gece Kuşu",
    category: "Özel & Efsanevi",
    description: "Gece yarısından sonra bir lobiye girip sohbet ettin.",
    icon: "🦉",
    color: "#DDD6FE",
    coinReward: 50,
    conditionDescription: "00:00 - 05:00 saatleri arasında lobiye katıl."
  }
];

export const BADGE_CATALOG = ALL_BADGES;

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}
