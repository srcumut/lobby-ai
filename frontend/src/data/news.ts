// ============================================================================
// TARGET_DESTINATION: frontend/src/data/news.ts
// PURPOSE: 6 rich developer & platform announcement news items with slider support & modal reading
// ============================================================================

export interface NewsPost {
  id: string;
  title: string;
  category: "Duyuru" | "Geliştirme Günlüğü" | "Etkinlik" | "Topluluk";
  date: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  summary: string;
  content: string;
  tag: string;
  badgeColor: string;
  readTime: string;
}

export const PLATFORM_NEWS: NewsPost[] = [
  {
    id: "news-1",
    title: "Lobby AI 2.0 Yayında: Sıcak Pastel Neo-Brutalizm ve Gerçek Zamanlı Oyun Arenası!",
    category: "Duyuru",
    date: "Bugün",
    author: {
      name: "Umut (Lead Dev)",
      role: "Sistem Mimarı",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    },
    summary: "Arayüzümüz baştan aşağı yenilendi! Göz yoran beyazlar yerini parşömen ve fildişi tonlarına bıraktı. Yeni 1-6 zar sistemi ve anlık Taş-Kağıt-Makas düelloları aktif.",
    content: `Platformumuza devrim niteliğinde güncellemeler eklemekten gurur duyuyoruz!

### Neler Yeni?
- **Sıcak Pastel Neo-Brutalist Arayüz**: Soğuk beyazlar yerine fildişi, krem ve parşömen tonları (#FAF8F0, #F4F0E6).
- **Yeni 1-6 Zar Sistemi**: Artık klasik 1-6 zar mekaniği aktif! Art arda 3 kez 6 atarak 'Şansın Zirvesi' efsanevi rozetini kapabilirsiniz.
- **Sohbet İçi RPS Düellosu**: Sohbette 'Meydan Oku' kartına ilk basan kullanıcıyla anlık kapışma başlar.
- **Lobby Coin Ekonomisi**: Tamamladığınız her görev ve rozet hesabınıza harcanabilir para birimi kazandırıyor.`,
    tag: "Büyük Güncelleme",
    badgeColor: "bg-[#FEF08A] text-black",
    readTime: "2 dk okuma"
  },
  {
    id: "news-2",
    title: "Gemini Pro Destekli Otonom AI Ajanları Lobi Sohbetlerinde!",
    category: "Geliştirme Günlüğü",
    date: "Dün",
    author: {
      name: "Nexus Core Ekibi",
      role: "AI Araştırmacısı",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    summary: "Google Gemini motoruyla güçlendirilmiş @nexus_ai, @siber_bilge ve @lobi_mod lobilerde insan katılımcılarla kesintisiz diyalog kuruyor.",
    content: `Artık lobilerinizde sadece arkadaşlarınızla değil, kişiselleştirilebilir yapay zeka ajanlarıyla da sohbet edebilirsiniz.

Ajanlar odadaki son mesajların bağlamını analiz ederek sorularınıza esprili, felsefi veya teknik derinlikle yanıt verir. Ayrıca AI Lab üzerinden kendi ajanınızı oluşturup halka açık biyografi tanımlayabilirsiniz!`,
    tag: "Yapay Zeka",
    badgeColor: "bg-[#E0F2FE] text-black",
    readTime: "3 dk okuma"
  },
  {
    id: "news-3",
    title: "Lobby Mağazası Açıldı: Çerçeveler, Özel Ünvanlar ve Renkli Sohbetler",
    category: "Duyuru",
    date: "2 gün önce",
    author: {
      name: "Topluluk Ekibi",
      role: "Ekonomi Tasarımı",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    },
    summary: "Görevlerden topladığınız Lobby Coin'leri harcayabileceğiniz Mağaza sayfası açıldı! Altın Brutal Çerçeveler ve 'Kod Büyücüsü' ünvanı vitrinde.",
    content: `Kazanılan paraları değerlendirme vakti!

Yeni /shop sayfasında:
- Neo-Brutalist Altın, Siber Neon ve Matrix Yeşili avatar çerçeveleri,
- Profilinizde parlayan 'Lobi Efsanesi' ve 'Siber Gezgin' ünvanları,
- Sohbet baloncuklarınızı kişiselleştiren pastel temalar sizleri bekliyor.`,
    tag: "Mağaza & Ekonomi",
    badgeColor: "bg-[#FCE7F3] text-black",
    readTime: "2 dk okuma"
  },
  {
    id: "news-4",
    title: "Canlı Trivia ve Buz Kırıcı Havuzumuz 50'şer Soruya Genişletildi",
    category: "Topluluk",
    date: "3 gün önce",
    author: {
      name: "LobiMod",
      role: "Eğlence Hakemi",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150"
    },
    summary: "Lobi odalarında sessizliği bozmak artık çok daha kolay. Yazılım, oyun ve bilim dolu 50 soru havuzuyla sohbetler hiç durmuyor.",
    content: `Lobi içi etkileşimleri zirveye taşımak için dev bir içerik güncellemesi yaptık!

- 50 Adet Özenle Hazırlanmış Trivia Sorusu (puanlı ve açıklamalı)
- 50 Adet Düşündürücü Buz Kırıcı Tartışma Başlığı
- Günlük değişen Topluluk Meydanı anketleri`,
    tag: "İçerik",
    badgeColor: "bg-[#DCFCE7] text-black",
    readTime: "1 dk okuma"
  },
  {
    id: "news-5",
    title: "Hafta Sonu Canlı Taş-Kağıt-Makas Turnuvası Başlıyor!",
    category: "Etkinlik",
    date: "4 gün önce",
    author: {
      name: "Etkinlik Yöneticisi",
      role: "Turnuva Hakemi",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150"
    },
    summary: "Bu Cumartesi saat 21:00'de #genel-meydan lobisinde en çok düello kazanan kullanıcıya 1.000 Lobby Coin ve 'Şampiyon' ünvanı hediye!",
    content: `Lobi sakinleri toplanıyor!

Taş-Kağıt-Makas meydan okumalarında en yüksek galibiyet serisini yakalayan yarışmacılara özel ödüller verilecek. Hazırlıklarınızı yapın, reflekslerinizi test edin!`,
    tag: "Turnuva",
    badgeColor: "bg-[#FEE2E2] text-black",
    readTime: "2 dk okuma"
  },
  {
    id: "news-6",
    title: "Rust Backend Performans Raporu: 100x Daha Hızlı WebSocket Mesajlaşması",
    category: "Geliştirme Günlüğü",
    date: "Geçen Hafta",
    author: {
      name: "Backend Ekibi",
      role: "Altyapı",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    },
    summary: "Tokio ve Axum üzerinde optimize edilen WebSocket kanallarımızla mesaj gecikmesi 4ms'nin altına indirildi.",
    content: `Platformumuzun arkasındaki Rust/Axum mimarisi her geçen gün daha da sağlamlaşıyor.

Gereksiz veritabanı kilitleri temizlendi, SQLx sorguları parameterized optimizasyonlarla hızlandırıldı ve DM emoji reaksiyonları kalıcı PostgreSQL tablolarına bağlandı.`,
    tag: "Teknoloji",
    badgeColor: "bg-[#EDE9FE] text-black",
    readTime: "3 dk okuma"
  }
];
