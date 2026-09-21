export interface TriviaQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // Teknoloji & Yazılım
  {
    id: "tech-1",
    category: "Yazılım & Teknoloji",
    question: "Rust programlama dilinde bellek güvenliğini sağlayan temel mekanizma nedir?",
    options: ["Garbage Collector", "Borrow Checker / Mülkiyet (Ownership)", "Manual Free (malloc/free)", "Virtual Machine"],
    correctIndex: 1,
  },
  {
    id: "tech-2",
    category: "Yazılım & Teknoloji",
    question: "Git versiyon kontrol sistemini hangi ünlü yazılımcı geliştirmiştir?",
    options: ["Linus Torvalds", "Bill Gates", "Guido van Rossum", "Dennis Ritchie"],
    correctIndex: 0,
  },
  {
    id: "tech-3",
    category: "Yazılım & Teknoloji",
    question: "WebSocket protokolü TCP bağlantısı üzerinde hangi HTTP status kodu ile başlatılır (Handshake)?",
    options: ["200 OK", "301 Moved Permanently", "101 Switching Protocols", "400 Bad Request"],
    correctIndex: 2,
  },
  {
    id: "tech-4",
    category: "Yazılım & Teknoloji",
    question: "CSS'te z-index özelliğinin çalışabilmesi için elementin hangi özelliğe sahip olması gerekir?",
    options: ["position: static dışında bir değer", "display: flex", "float: left", "overflow: hidden"],
    correctIndex: 0,
  },
  {
    id: "tech-5",
    category: "Yazılım & Teknoloji",
    question: "JavaScript ilk kez kaç günde Brendan Eich tarafından geliştirilmiştir?",
    options: ["10 Gün", "30 Gün", "6 Ay", "1 Yıl"],
    correctIndex: 0,
  },
  {
    id: "tech-6",
    category: "Yazılım & Teknoloji",
    question: "Next.js'in arkasındaki şirket hangisidir?",
    options: ["Google", "Meta", "Vercel", "Amazon"],
    correctIndex: 2,
  },
  
  // Oyun Dünyası
  {
    id: "game-1",
    category: "Oyun Dünyası",
    question: "Tarihin en çok satan video oyunu hangisidir?",
    options: ["Grand Theft Auto V", "Minecraft", "Tetris", "Super Mario Bros."],
    correctIndex: 1,
  },
  {
    id: "game-2",
    category: "Oyun Dünyası",
    question: "The Witcher serisinin ana karakteri Geralt of Rivia'nın lakabı nedir?",
    options: ["Kızıl Kurt", "Ak Kurt (Gwynbleidd)", "Gölge Avcısı", "Ejderdoğan"],
    correctIndex: 1,
  },
  {
    id: "game-3",
    category: "Oyun Dünyası",
    question: "Dark Souls ve Elden Ring oyunlarının yaratıcısı efsanevi oyun yönetmeni kimdir?",
    options: ["Hideo Kojima", "Shigeru Miyamoto", "Hidetaka Miyazaki", "Todd Howard"],
    correctIndex: 2,
  },
  {
    id: "game-4",
    category: "Oyun Dünyası",
    question: "Half-Life serisindeki ikonik levye taşıyan başkahraman kimdir?",
    options: ["Gordon Freeman", "Barney Calhoun", "Eli Vance", "G-Man"],
    correctIndex: 0,
  },
  
  // Sinema & Dizi
  {
    id: "cinema-1",
    category: "Sinema & Dizi",
    question: "The Matrix filminde Neo'nun gerçeği görmesini sağlayan hap hangi renktir?",
    options: ["Mavi", "Kırmızı", "Yeşil", "Sarı"],
    correctIndex: 1,
  },
  {
    id: "cinema-2",
    category: "Sinema & Dizi",
    question: "Yüzüklerin Efendisi serisinde Tek Yüzük hangi dağın ateşinde dövülmüştür?",
    options: ["Erebor", "Hüküm Dağı (Mount Doom)", "Caradhras", "Misty Mountains"],
    correctIndex: 1,
  },
  {
    id: "cinema-3",
    category: "Sinema & Dizi",
    question: "Breaking Bad dizisinde Walter White'ın kullandığı takma isim nedir?",
    options: ["Oppenheimer", "Schrödinger", "Heisenberg", "Einstein"],
    correctIndex: 2,
  },

  // Bilim & Genel Kültür
  {
    id: "science-1",
    category: "Bilim & Doğa",
    question: "Güneş sistemindeki en büyük gezegen hangisidir?",
    options: ["Mars", "Satürn", "Jüpiter", "Neptün"],
    correctIndex: 2,
  },
  {
    id: "science-2",
    category: "Genel Kültür",
    question: "Dünyanın bilinen en eski tapınak kompleksi Göbeklitepe Türkiye'nin hangi ilindedir?",
    options: ["Gaziantep", "Şanlıurfa", "Diyarbakır", "Mardin"],
    correctIndex: 1,
  },
  {
    id: "science-3",
    category: "Bilim & Doğa",
    question: "Periyodik tabloda 'Au' sembolü hangi elementi temsil eder?",
    options: ["Gümüş", "Bakır", "Altın", "Demir"],
    correctIndex: 2,
  },
  {
    id: "science-4",
    category: "Genel Kültür",
    question: "Mona Lisa tablosunu çizen Rönesans dehası kimdir?",
    options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"],
    correctIndex: 1,
  }
];

export function getRandomQuestions(count: number = 5): TriviaQuestion[] {
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
