// ============================================================================
// TARGET_DESTINATION: frontend/src/data/polls.ts
// PURPOSE: 50 rich Turkish community debate & polling topics with category & options
// ============================================================================

export interface CommunityPollItem {
  id: number;
  question: string;
  category: "Teknoloji" | "Oyun" | "Yapay Zeka" | "Tasarım" | "Topluluk & Yaşam";
  options: string[];
  totalVotes?: number;
  featured?: boolean;
}

export const COMMUNITY_POLLS: CommunityPollItem[] = [
  {
    id: 1,
    question: "Geleceğin sistem dili sizce hangisi olacak?",
    category: "Teknoloji",
    options: ["Rust 🦀", "Go 🐹", "C++23/26 ⚡", "Zig / Modern Alternatifler 🦎"],
    featured: true
  },
  {
    id: 2,
    question: "Yapay zeka modelleri kod yazımında en çok hangi aşamada fayda sağlıyor?",
    category: "Yapay Zeka",
    options: ["Boilerplate ve Şablon Kod", "Birim Test & Dokümantasyon", "Hata Ayıklama & Refactor", "Mimari ve Algoritma Tasarımı"],
    featured: true
  },
  {
    id: 3,
    question: "Tasarım dünyasında en çok ilginizi çeken modern stil hangisi?",
    category: "Tasarım",
    options: ["Neo-Brutalism (Sert Konturlar)", "Clean Minimalist Glassmorphism", "Retro 90'lar Cyberpunk", "Skeuomorphism (Gerçekçi Dokular)"],
    featured: true
  },
  {
    id: 4,
    question: "Sizce tüm zamanların en etkileyici açık dünya oyunu hangisi?",
    category: "Oyun",
    options: ["Witcher 3: Wild Hunt", "Red Dead Redemption 2", "Elden Ring", "Cyberpunk 2077"],
    featured: true
  },
  {
    id: 5,
    question: "En ideal yazılım çalışma düzeni sizce hangisidir?",
    category: "Topluluk & Yaşam",
    options: ["Tamamen Uzaktan (Remote) 🏠", "Haftada 2 Gün Hibrit 🏢", "Tamamen Ofisten 🤝", "Dijital Göçebe (Nomad) ✈️"],
    featured: true
  },
  {
    id: 6,
    question: "Web geliştirme için favori frontend ekosisteminiz nedir?",
    category: "Teknoloji",
    options: ["Next.js & React", "Vue 3 & Nuxt", "SvelteKit", "Astro & Saf Web Components"]
  },
  {
    id: 7,
    question: "Veritabanı tercihinizde ilk sırayı hangisi alır?",
    category: "Teknoloji",
    options: ["PostgreSQL (İlişkisel Kral)", "Redis (Hızlı Bellek)", "MongoDB (Esnek NoSQL)", "SQLite (Hafif ve Güçlü)"]
  },
  {
    id: 8,
    question: "Lokal LLM çalıştırmak için hangi aracı tercih ediyorsunuz?",
    category: "Yapay Zeka",
    options: ["Ollama", "LM Studio", "vLLM / HuggingFace", "Doğrudan Cloud API (Gemini/OpenAI)"]
  },
  {
    id: 9,
    question: "Bir video oyununda sizin için en önemli unsur nedir?",
    category: "Oyun",
    options: ["Derin Hikaye ve Karakterler", "Akıcı Oynanış Mekanikleri", "Görsel Sanat Tasarımı ve Müzik", "Çok Oyunculu Sosyal Rekabet"]
  },
  {
    id: 10,
    question: "Monitör düzeniniz nasıl?",
    category: "Topluluk & Yaşam",
    options: ["Çift Yatay Monitör", "Bir Yatay + Bir Dikey Monitör", "Tek Devasa Ultra-Wide", "Sadece Laptop Ekranı"]
  },
  {
    id: 11,
    question: "CSS yazarken hangi yaklaşımı daha üretken buluyorsunuz?",
    category: "Tasarım",
    options: ["Tailwind CSS", "Saf Modern CSS & Değişkenler", "CSS Modules / SCSS", "Styled Components / Emotion"]
  },
  {
    id: 12,
    question: "AI ajanlarının lobi sohbetlerine katılması sizce deneyimi nasıl etkiliyor?",
    category: "Yapay Zeka",
    options: ["Çok Eğlenceli ve Renkli", "Tartışmaları Derinleştiriyor", "Daha Fazla Özelleştirilmeli", "Sadece İnsanlar Konuşmalı"]
  },
  {
    id: 13,
    question: "Favori klavye anahtar (switch) tercihiniz nedir?",
    category: "Topluluk & Yaşam",
    options: ["Lineer (Red / Yellow - Sessiz)", "Tactile (Brown - Hissiyatlı)", "Clicky (Blue - Tıklamalı)", "Laptop Düşük Profil"]
  },
  {
    id: 14,
    question: "Mobil uygulama geliştirmede tercihiniz ne olurdu?",
    category: "Teknoloji",
    options: ["Flutter & Dart", "React Native", "Native Swift / Kotlin", "PWA (İlerici Web Uygulaması)"]
  },
  {
    id: 15,
    question: "Hangi rekabetçi oyun türünde daha çok vakit geçiriyorsunuz?",
    category: "Oyun",
    options: ["FPS (Valorant, CS2)", "MOBA (LoL, Dota 2)", "Strateji & Sıra Tabanlı", "Battle Royale (Apex, PUBG)"]
  },
  {
    id: 16,
    question: "Yapay zekanın gelecekte genel yapay zekaya (AGI) ulaşma süresi tahmini:",
    category: "Yapay Zeka",
    options: ["Önümüzdeki 2-3 yıl içinde", "5 ile 10 yıl arasında", "20 yıldan uzun sürer", "Hiçbir zaman tam AGI olamaz"]
  },
  {
    id: 17,
    question: "Dark Mode mu yoksa Light / Cream Paper Mode mu?",
    category: "Tasarım",
    options: ["Zifiri Karanlık (OLED Black)", "Sıcak Pastel Neo-Brutalist Krem", "Slate / Koyu Gri Modern", "Klasik Temiz Beyaz"]
  },
  {
    id: 18,
    question: "Kod yazarken kafein kaynağınız nedir?",
    category: "Topluluk & Yaşam",
    options: ["Filtre Kahve / Espresso ☕", "Demleme Türk Çayı 🍵", "Enerji İçeceği ⚡", "Sadece Soğuk Su 💧"]
  },
  {
    id: 19,
    question: "Git commit mesajlarınızı nasıl yazarsınız?",
    category: "Teknoloji",
    options: ["Conventional Commits (feat, fix...)", "Kısa ve net Türkçe açıklamalar", "İngilizce özet cümleler", "wip, test, update..."]
  },
  {
    id: 20,
    question: "En sevdiğiniz bilim kurgu alt türü hangisi?",
    category: "Topluluk & Yaşam",
    options: ["Cyberpunk & Neo-Tokyo", "Space Opera (Yıldızlararası)", "Post-Apokaliptik Distopya", "Time Travel (Zaman Yolculuğu)"]
  },
  {
    id: 21,
    question: "Oyunlarda tek kişilik (Singleplayer) mı çok oyunculu (Multiplayer) mı?",
    category: "Oyun",
    options: ["Kesinlikle Singleplayer Hikaye", "Arkadaşlarla Co-op Görevler", "Acımasız PvP Rekabet", "Rahatlatıcı Simülasyon"]
  },
  {
    id: 22,
    question: "AI tarafından üretilen kodların güvenliği konusunda ne düşünüyorsunuz?",
    category: "Yapay Zeka",
    options: ["Her satır insan tarafından denetlenmeli", "Genellikle güvenilir, test yazmak yeterli", "Güvenlik açıkları riski yüksek", "İnsan yazımı kodlardan farksız"]
  },
  {
    id: 23,
    question: "UI tasarlarken tipografi mi renk paleti mi daha belirleyicidir?",
    category: "Tasarım",
    options: ["Tipografi (Karakter & Okunabilirlik)", "Renk Paleti ve Kontrast", "Boşluklar ve Hiyerarşi (Grid)", "Animasyonlar ve Mikro Etkileşimler"]
  },
  {
    id: 24,
    question: "Hangi işletim sistemini ana geliştirme makinenizde kullanıyorsunuz?",
    category: "Teknoloji",
    options: ["Linux (Arch, Ubuntu, Fedora)", "macOS (Apple Silicon)", "Windows 11 + WSL2", "Saf Windows"]
  },
  {
    id: 25,
    question: "İnternette en çok vakit geçirdiğiniz geliştirici platformu hangisi?",
    category: "Topluluk & Yaşam",
    options: ["GitHub / GitLab", "Reddit (r/programming vb.)", "Twitter / X Tech Topluluğu", "Discord & Lobby AI Odaları"]
  },
  {
    id: 26,
    question: "Hangi klasik retro konsolu yeniden canlandırmak isterdiniz?",
    category: "Oyun",
    options: ["PlayStation 2", "Game Boy Advance", "Sega Genesis / Dreamcast", "Nintendo GameCube"]
  },
  {
    id: 27,
    question: "Multi-modal AI ajanlarında sizin için en heyecan verici özellik nedir?",
    category: "Yapay Zeka",
    options: ["Canlı Ses ve Tonlama", "Görsel ve Ekran Analizi", "Otomatik Araç ve API Kullanımı", "Kişiselleştirilmiş Hafıza"]
  },
  {
    id: 28,
    question: "API mimarisinde ilk tercihiniz hangisidir?",
    category: "Teknoloji",
    options: ["RESTful JSON API", "gRPC (Protobuf)", "GraphQL", "WebSocket / Real-time Streams"]
  },
  {
    id: 29,
    question: "Tasarımda animasyon kullanımı hakkında fikriniz:",
    category: "Tasarım",
    options: ["Sadece gerekli mikro geçişler olmalı", "Zengin ve dinamik hissettirmeli", "Göz yormayacak kadar minimal", "Animasyonsuz, maksimum hız"]
  },
  {
    id: 30,
    question: "Yazılım dünyasında en çok aşırı övüldüğünü (overrated) düşündüğünüz şey nedir?",
    category: "Teknoloji",
    options: ["Aşırı karmaşık Microservices mimarileri", "Her şeye yapay zeka entegre etme çılgınlığı", "Sürekli çıkan yeni JS kütüphaneleri", "Leetcoding & algoritma mülakatları"]
  },
  {
    id: 31,
    question: "Oyun müziklerinde hangi tarzı daha çok seversiniz?",
    category: "Oyun",
    options: ["Epik Orkestral Senfoni", "Elektronik / Synthwave", "Akustik / Folk Melodileri", "Endüstriyel Metal"]
  },
  {
    id: 32,
    question: "Kişisel üretkenlik için hangi yöntemi uyguluyorsunuz?",
    category: "Topluluk & Yaşam",
    options: ["Pomodoro Tekniği (25/5)", "Derin Odaklanma (Deep Work 2-3 saat)", "Kanban Panosu ve To-Do Listesi", "Tamamen akışına bırakmak"]
  },
  {
    id: 33,
    question: "Kodunuzdaki test yazma oranınız gerçekte ne kadar?",
    category: "Teknoloji",
    options: ["%80+ Kapsamlı Birim ve Entegrasyon", "%40-60 Sadece Kritik Yollar", "Yalnızca Manuel Test", "Kullanıcılar test ediyor :)"]
  },
  {
    id: 34,
    question: "Bir yapay zeka ajanının en önemli karakter özelliği ne olmalı?",
    category: "Yapay Zeka",
    options: ["Hassas ve Bilgili bir Mentor", "Esprili ve Samimi bir Arkadaş", "Sorgulayıcı bir Filozof", "Hızlı ve Net bir Görev Yöneticisi"]
  },
  {
    id: 35,
    question: "Geleceğin oyunlarında generative AI sizce en çok nereyi değiştirecek?",
    category: "Oyun",
    options: ["Sonsuz ve Dinamik NPC Diyalogları", "Prosedürel Dünya ve Görev Üretimi", "Kişiye Özel Zorluk Seviyesi", "Gerçek Zamanlı Doku ve Işıklandırma"]
  },
  {
    id: 36,
    question: "Bir web projesinde ikon kütüphanesi olarak tercihiniz:",
    category: "Tasarım",
    options: ["Lucide Icons", "Heroicons", "FontAwesome", "Özel SVG / Piksel İkon Seti"]
  },
  {
    id: 37,
    question: "Bulut sağlayıcı seçiminiz hangisi olurdu?",
    category: "Teknoloji",
    options: ["Hetzner / Kendi VPS Sunucumuz", "AWS (Amazon Web Services)", "Cloudflare Workers & Pages", "Google Cloud / Vercel"]
  },
  {
    id: 38,
    question: "Hangi retro oyun türünün geri dönmesini istersiniz?",
    category: "Oyun",
    options: ["Point-and-Click Macera Oyunları", "Arcade Shoot 'em up", "İzometrik Taktiksel RPG", "Klasik Platform Oyunları"]
  },
  {
    id: 39,
    question: "Topluluk lobi sohbetlerinde en çok hangi özellik ilginizi çekiyor?",
    category: "Topluluk & Yaşam",
    options: ["Canlı Mini Oyunlar (Taş-Kağıt-Makas, Zar)", "Özelleştirilebilir AI Ajanları", "Rozet ve Başarım Sistemi", "Gerçek Zamanlı Arkadaşlık & DM"]
  },
  {
    id: 40,
    question: "Yapay zeka ile sanat üretimi hakkında görüşünüz:",
    category: "Yapay Zeka",
    options: ["Yaratıcı süreci hızlandıran müthiş bir araç", "İnsan sanatçılara telif hakkı ödenmeli", "Ruhu olmayan kopya işler", "Geleceğin yeni sanat formu"]
  },
  {
    id: 41,
    question: "En sevdiğiniz kod fontu hangisi?",
    category: "Teknoloji",
    options: ["JetBrains Mono", "Fira Code (Ligatürlü)", "Cascadia Code", "Geist Mono / SF Mono"]
  },
  {
    id: 42,
    question: "Bir UI tasarımında kartların gölgesi nasıl olmalı?",
    category: "Tasarım",
    options: ["Neo-Brutalist Keskin ve Sert Siyah", "Yumuşak ve Dağınık Blur Gölge", "Hiç gölge yok, saf çerçeve", "İç Gölgeli Neumorphism"]
  },
  {
    id: 43,
    question: "Hangi Souls-like oyunu sizi en çok zorladı?",
    category: "Oyun",
    options: ["Sekiro: Shadows Die Twice", "Bloodborne", "Dark Souls 1/3", "Elden Ring (Malenia)"]
  },
  {
    id: 44,
    question: "Yapay zeka ajanınızın sizi nasıl hitap etmesini isterdiniz?",
    category: "Yapay Zeka",
    options: ["Kaptan / Komutan 🛸", "Dostum / Kanka 🤝", "Efendim 🎩", "Doğrudan İsmimle ⚡"]
  },
  {
    id: 45,
    question: "Geliştirici ortamınızda tema tercihiniz:",
    category: "Teknoloji",
    options: ["Tokyo Night / Gruvbox", "Catppuccin Mocha / Macchiato", "Dracula / One Dark", "Nord / Solarized"]
  },
  {
    id: 46,
    question: "Bir oyun stüdyosu kursaydınız ilk yapacağınız oyun ne olurdu?",
    category: "Oyun",
    options: ["Siberpunk Temalı Dedektiflik RPG", "Derin Hikayeli Piksel Roguelike", "Fizik Tabanlı Eğlenceli Co-op", "Devasa Uzay Simülasyonu"]
  },
  {
    id: 47,
    question: "Lobby AI mağazasında görmek istediğiniz ilk kozmetik eşya:",
    category: "Topluluk & Yaşam",
    options: ["Özel Neo-Brutalist Avatar Çerçeveleri", "Sohbet Balonu Renk Temaları", "Nadir ve Işıltılı Profil Rozetleri", "Özel Giriş & Katılma Efektleri"]
  },
  {
    id: 48,
    question: "Yeni bir teknoloji öğrenirken ilk kaynağınız ne olur?",
    category: "Teknoloji",
    options: ["Resmi Dokümantasyon", "YouTube Video Serileri", "Yapay Zekaya Sorarak Örnek Yapmak", "GitHub Örnek Projeleri İncelemek"]
  },
  {
    id: 49,
    question: "Sizce sanal gerçeklik (VR/AR) kulaklıkları akıllı telefonların yerini alabilir mi?",
    category: "Topluluk & Yaşam",
    options: ["Gözlük formuna inince kesinlikle evet", "Yalnızca eğlence ve eğitim için kalır", "Hayır, telefonlar her zaman daha pratik", "Bileklik veya nöral arayüzler yerini alır"]
  },
  {
    id: 50,
    question: "Lobby AI topluluğunda en sevdiğiniz aktivite nedir?",
    category: "Topluluk & Yaşam",
    options: ["Gece geç saatlerde kod sohbeti", "AI botlarıyla beyin fırtınası", "Lobi içi mini meydan okumalar", "Yeni insanlarla tanışıp arkadaş eklemek"]
  }
];

export function getDailyPoll(): CommunityPollItem {
  // Rotate deterministically based on day of year
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % COMMUNITY_POLLS.length;
  return COMMUNITY_POLLS[index];
}
