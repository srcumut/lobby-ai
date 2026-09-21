// ============================================================================
// TARGET_DESTINATION: frontend/src/data/trivia.ts
// PURPOSE: 50 rich Turkish trivia & quiz questions with category, options, correctIndex and explanation
// ============================================================================

export interface TriviaQuestion {
  id: number;
  question: string;
  category: "Yazılım" | "Oyun Kültürü" | "Yapay Zeka" | "Bilim & Teknoloji" | "Popüler Kültür";
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 1,
    question: "Rust programlama dilinin maskotu olan yengecin adı nedir?",
    category: "Yazılım",
    options: ["Crabby", "Ferris", "Rusty", "Claw"],
    correctIndex: 1,
    explanation: "Rust topluluğunun resmi maskotu olan yengecin adı 'Ferris'tir (ferrous / demir kelimesinden türetilmiştir)."
  },
  {
    id: 2,
    question: "Dünyanın ilk bilgisayar programcısı olarak kabul edilen tarihi kişilik kimdir?",
    category: "Bilim & Teknoloji",
    options: ["Alan Turing", "Ada Lovelace", "Grace Hopper", "Charles Babbage"],
    correctIndex: 1,
    explanation: "Ada Lovelace, Charles Babbage'in Mekanik Çözümleyicisi için yazdığı Bernoulli sayılarını hesaplayan algoritmayla ilk programcı kabul edilir."
  },
  {
    id: 3,
    question: "Tüm zamanların en çok satan video oyunu hangisidir?",
    category: "Oyun Kültürü",
    options: ["Grand Theft Auto V", "Minecraft", "Tetris", "Wii Sports"],
    correctIndex: 1,
    explanation: "Minecraft, 300 milyondan fazla kopya satışı ile tarihin en çok satan video oyunudur."
  },
  {
    id: 4,
    question: "Transformer mimarisini tanıtan çığır açıcı 2017 tarihli Google makalesinin adı nedir?",
    category: "Yapay Zeka",
    options: ["Deep Residual Learning", "Attention Is All You Need", "Language Models are Few-Shot Learners", "Mastering the Game of Go"],
    correctIndex: 1,
    explanation: "'Attention Is All You Need' makalesi Transformer mimarisini tanıtarak günümüz LLM devrimini başlatmıştır."
  },
  {
    id: 5,
    question: "Git sürüm kontrol sistemini 2005 yılında kim geliştirmiştir?",
    category: "Yazılım",
    options: ["Linus Torvalds", "Richard Stallman", "Ken Thompson", "Dennis Ritchie"],
    correctIndex: 0,
    explanation: "Linux çekirdeğinin yaratıcısı Linus Torvalds, Linux çekirdek geliştirmesini yönetmek için Git'i tasarlayıp yazmıştır."
  },
  {
    id: 6,
    question: "HTTP durum kodlarında '418' neyi ifade eder?",
    category: "Yazılım",
    options: ["Bad Gateway", "I'm a teapot (Ben bir çaydanlığım)", "Payment Required", "Gone"],
    correctIndex: 1,
    explanation: "RFC 2324 uyarınca 1 Nisan 1998 şakası olarak tanımlanan '418 I'm a teapot', kahve demleme protokolünde çaydanlık olunduğunu belirtir."
  },
  {
    id: 7,
    question: "Pac-Man oyununun orijinal Japonca ismi nedir?",
    category: "Oyun Kültürü",
    options: ["Puck Man", "Munch Man", "Ghost Hunter", "Dot Eater"],
    correctIndex: 0,
    explanation: "Oyun Japonya'da 'Puck Man' olarak çıkış yapmış, Batı'da vandalizm riskine karşı 'Pac-Man' olarak değiştirilmiştir."
  },
  {
    id: 8,
    question: "Yapay zekanın bir insanı ayırt edemeyecek derecede taklit edip edemediğini ölçen klasik teste ne denir?",
    category: "Yapay Zeka",
    options: ["Voight-Kampff Testi", "Turing Testi", "Gödel Sınaması", "Lovelace Testi"],
    correctIndex: 1,
    explanation: "1950 yılında Alan Turing tarafından önerilen 'Turing Testi' (The Imitation Game), makinenin insansı zekasını test eder."
  },
  {
    id: 9,
    question: "CSS'te z-index özelliğinin çalışabilmesi için öğenin position değeri ne OLMAMALIDIR?",
    category: "Yazılım",
    options: ["relative", "absolute", "static", "fixed"],
    correctIndex: 2,
    explanation: "Varsayılan position değeri olan 'static' durumunda z-index özelliği etki etmez."
  },
  {
    id: 10,
    question: "The Witcher serisinin yazarı olan Polonyalı yazar kimdir?",
    category: "Popüler Kültür",
    options: ["Stanislaw Lem", "Andrzej Sapkowski", "Dmitry Glukhovsky", "George R.R. Martin"],
    correctIndex: 1,
    explanation: "Rivyalı Geralt'ın maceralarını anlatan The Witcher evreni Andrzej Sapkowski tarafından kaleme alınmıştır."
  },
  {
    id: 11,
    question: "Python programlama dili adını nereden almıştır?",
    category: "Yazılım",
    options: ["Piton yılanı türünden", "Monty Python komedi grubundan", "Antik Yunan mitolojisindeki Pytho ejderinden", "Geliştiricinin kedisinden"],
    correctIndex: 1,
    explanation: "Guido van Rossum, dili BBC'nin ünlü komedi dizisi 'Monty Python's Flying Circus'tan esinlenerek adlandırmıştır."
  },
  {
    id: 12,
    question: "1997 yılında dünya satranç şampiyonu Garry Kasparov'u mağlup eden IBM süper bilgisayarı hangisidir?",
    category: "Yapay Zeka",
    options: ["Watson", "Deep Blue", "AlphaGo", "Deep Thought"],
    correctIndex: 1,
    explanation: "Deep Blue, bir dünya satranç şampiyonunu standart turnuva kuralları altında yenen ilk bilgisayar oldu."
  },
  {
    id: 13,
    question: "World of Warcraft oyununda meşhur 'Leeroy Jenkins' videosu hangi yılda internette viral oldu?",
    category: "Oyun Kültürü",
    options: ["2003", "2005", "2007", "2010"],
    correctIndex: 1,
    explanation: "Grup planını hiçe sayarak 'Leeeerooooy Jeeeenkins' diye odaya dalan oyuncunun efsane videosu Mayıs 2005'te yayınlandı."
  },
  {
    id: 14,
    question: "Linux çekirdeğinin resmi maskotu Tux ne tür bir hayvandır?",
    category: "Yazılım",
    options: ["Penguen", "Kutup Ayısı", "Tilki", "Kunduz"],
    correctIndex: 0,
    explanation: "Tux, sevimli ve tombul bir imparator penguenidir."
  },
  {
    id: 15,
    question: "JavaScript ilk geliştirildiğinde Netscape tarafından kaç günde prototiplenmiştir?",
    category: "Yazılım",
    options: ["10 Gün", "30 Gün", "6 Ay", "1 Yıl"],
    correctIndex: 0,
    explanation: "Brendan Eich, JavaScript dilini Mayıs 1995'te sadece 10 gün içinde tasarlamıştır."
  },
  {
    id: 16,
    question: "Dark Souls oyunundaki meşhur 'Praise the Sun' hareketini yapan şövalyenin adı nedir?",
    category: "Oyun Kültürü",
    options: ["Siegmeyer of Catarina", "Solaire of Astora", "Artorias", "Patches"],
    correctIndex: 1,
    explanation: "Güneş Şövalyesi Solaire of Astora, 'Praise the Sun! \\[T]/' selamıyla serinin en sevilen karakteridir."
  },
  {
    id: 17,
    question: "İlk yapay sinir ağı modeli olan 'Perceptron' hangi yılda Frank Rosenblatt tarafından geliştirildi?",
    category: "Yapay Zeka",
    options: ["1943", "1958", "1972", "1986"],
    correctIndex: 1,
    explanation: "Cornell Havacılık Laboratuvarı'nda Frank Rosenblatt tarafından 1958 yılında geliştirilmiştir."
  },
  {
    id: 18,
    question: "İlk mekanik fareyi (mouse) 1964 yılında tahtadan icat eden bilgisayar öncüsü kimdir?",
    category: "Bilim & Teknoloji",
    options: ["Douglas Engelbart", "Steve Wozniak", "Alan Kay", "Bill Gates"],
    correctIndex: 0,
    explanation: "Douglas Engelbart tahtadan oyulmuş iki tekerlekli ilk fare prototipini icat etmiştir."
  },
  {
    id: 19,
    question: "Cyberpunk 2077 oyununun geçtiği hayali distopik metropolün adı nedir?",
    category: "Oyun Kültürü",
    options: ["Mega City One", "Night City", "Neo Tokyo", "Rapture"],
    correctIndex: 1,
    explanation: "Oyun, Kuzey Kaliforniya kıyılarında yer alan devasa ve kaotik 'Night City'de geçmektedir."
  },
  {
    id: 20,
    question: "REST mimarisini doktora tezinde ilk kez tanımlayan akademisyen kimdir?",
    category: "Yazılım",
    options: ["Roy Fielding", "Tim Berners-Lee", "Vint Cerf", "Martin Fowler"],
    correctIndex: 0,
    explanation: "Roy Fielding, 2000 yılındaki 'Architectural Styles and the Design of Network-based Software Architectures' tezinde REST'i tanımlamıştır."
  },
  {
    id: 21,
    question: "AlphaGo'nun efsanevi Go ustası Lee Sedol'u mağlup ederken yaptığı meşhur 37. hamle neden tarihi kabul edilir?",
    category: "Yapay Zeka",
    options: ["İnsanların oynama olasılığını 1/10000 gördüğü dahi bir hamleydi", "Bir hata sonucu yapıldı", "Kural ihlali gerektiriyordu", "Rakibin taşını yedi"],
    correctIndex: 0,
    explanation: "37. hamle, bin yıllık geleneksel insan teorisine aykırı olan ancak maçı kazandıran yaratıcı bir hamleydi."
  },
  {
    id: 22,
    question: "HTML'in açılımı nedir?",
    category: "Yazılım",
    options: ["HyperText Markup Language", "HighText Machine Learning", "HyperTransfer Model Link", "Home Tool Markup Language"],
    correctIndex: 0,
    explanation: "HTML, 'HyperText Markup Language' (Zengin Metin İşaretleme Dili) kelimelerinin kısaltmasıdır."
  },
  {
    id: 23,
    question: "Half-Life serisinin konuşmayan ikonik teorik fizikçi kahramanı kimdir?",
    category: "Oyun Kültürü",
    options: ["Eli Vance", "Barney Calhoun", "Gordon Freeman", "G-Man"],
    correctIndex: 2,
    explanation: "Elinde levyesi ve HEV zırhıyla MIT mezunu Dr. Gordon Freeman serinin başkahramanıdır."
  },
  {
    id: 24,
    question: "İlk web sitesi CERN'de Tim Berners-Lee tarafından hangi yılda yayına alındı?",
    category: "Bilim & Teknoloji",
    options: ["1989", "1991", "1993", "1995"],
    correctIndex: 1,
    explanation: "İlk web sitesi (info.cern.ch) 6 Ağustos 1991 tarihinde halka açılmıştır."
  },
  {
    id: 25,
    question: "C programlama dilinde dizgileri (string) sonlandıran özel karakter nedir?",
    category: "Yazılım",
    options: ["\\n", "\\0 (null terminator)", ";", "EOF"],
    correctIndex: 1,
    explanation: "C dilinde dizgiler null karakteri olan '\\0' ile sonlandırılır."
  },
  {
    id: 26,
    question: "Hangisi popüler bir relasyonel veritabanı DEĞİLDİR?",
    category: "Yazılım",
    options: ["PostgreSQL", "MySQL", "MongoDB", "Oracle DB"],
    correctIndex: 2,
    explanation: "MongoDB doküman tabanlı bir NoSQL veritabanıdır; ilişkisel (RDBMS) değildir."
  },
  {
    id: 27,
    question: "Doom oyununu 1993 yılında id Software bünyesinde kodlayan dahi oyun motoru mimarı kimdir?",
    category: "Oyun Kültürü",
    options: ["John Carmack", "John Romero", "Gabe Newell", "Hideo Kojima"],
    correctIndex: 0,
    explanation: "John Carmack, devrimsel 3D rendering teknikleri ve BSP ağaçlarıyla Doom ve Quake motorlarını yazmıştır."
  },
  {
    id: 28,
    question: "Yapay zekada 'Halüsinasyon' terimi ne anlama gelir?",
    category: "Yapay Zeka",
    options: ["Modelin görsel üretmesi", "Modelin gerçek dışı bilgileri emin bir dille uydurması", "Sunucunun aşırı ısınması", "Kodun sonsuz döngüye girmesi"],
    correctIndex: 1,
    explanation: "LLM modellerinin eğitim verisinde olmayan veya olgusal olarak yanlış bilgileri gerçek gibi üretmesine halüsinasyon denir."
  },
  {
    id: 29,
    question: "Retro oyunlarda 'Konami Kodu' olarak bilinen efsanevi tuş kombinasyonunun ilk 4 yönü nedir?",
    category: "Oyun Kültürü",
    options: ["Yukarı, Yukarı, Aşağı, Aşağı", "Aşağı, Aşağı, Yukarı, Yukarı", "Sol, Sağ, Sol, Sağ", "Yukarı, Aşağı, Sol, Sağ"],
    correctIndex: 0,
    explanation: "Klasik Konami Kodu: Yukarı, Yukarı, Aşağı, Aşağı, Sol, Sağ, Sol, Sağ, B, A şeklindedir."
  },
  {
    id: 30,
    question: "React kütüphanesini açık kaynak olarak ilk kim geliştirip tanıttı?",
    category: "Yazılım",
    options: ["Google", "Facebook (Meta)", "Twitter", "Microsoft"],
    correctIndex: 1,
    explanation: "React, Jordan Walke tarafından Facebook'ta geliştirilmiş ve 2013 yılında açık kaynak yapılmıştır."
  },
  {
    id: 31,
    question: "Port 443 hangi standart internet protokolüne aittir?",
    category: "Yazılım",
    options: ["HTTP", "HTTPS", "FTP", "SSH"],
    correctIndex: 1,
    explanation: "HTTPS (şifreli HTTP) varsayılan olarak 443 numaralı portu kullanır (HTTP ise port 80)."
  },
  {
    id: 32,
    question: "Portal oyunundaki meşhur yapay zeka antagonisti kimdir?",
    category: "Oyun Kültürü",
    options: ["GLaDOS", "SHODAN", "Cortana", "HAL 9000"],
    correctIndex: 0,
    explanation: "Aperture Science tesisinin yapay zekası GLaDOS (Genetic Lifeform and Disk Operating System), 'The cake is a lie' repliğiyle ünlüdür."
  },
  {
    id: 33,
    question: "2001: A Space Odyssey filmindeki meşhur kırmızı gözlü bilgisayarın adı nedir?",
    category: "Popüler Kültür",
    options: ["HAL 9000", "Skynet", "Colossus", "Mother"],
    correctIndex: 0,
    explanation: "Arthur C. Clarke ve Stanley Kubrick'in başyapıtındaki süper bilgisayar HAL 9000'dir."
  },
  {
    id: 34,
    question: "Hangisi CSS Flexbox özelliğinde dikey eksende hizalama yapar?",
    category: "Yazılım",
    options: ["justify-content", "align-items", "flex-direction", "flex-wrap"],
    correctIndex: 1,
    explanation: "Varsayılan yatay yönde (row) align-items dikey (çapraz) ekseni hizalar."
  },
  {
    id: 35,
    question: "Kriptografide 'SHA-256' algoritmasının ürettiği özet kaç bit uzunluğundadır?",
    category: "Bilim & Teknoloji",
    options: ["128 bit", "256 bit", "512 bit", "1024 bit"],
    correctIndex: 1,
    explanation: "SHA-256 tam olarak 256 bit (32 bayt) uzunluğunda sabit bir hash üretir."
  },
  {
    id: 36,
    question: "The Legend of Zelda serisinde yeşil tunikli başkahramanın adı nedir?",
    category: "Oyun Kültürü",
    options: ["Zelda", "Link", "Ganon", "Navi"],
    correctIndex: 1,
    explanation: "Prensesin adı Zelda iken, kılıç kuşanıp dünyayı kurtaran yeşil tunikli kahraman Link'tir."
  },
  {
    id: 37,
    question: "LLM'lerde 'Temperature' parametresi neyi kontrol eder?",
    category: "Yapay Zeka",
    options: ["Modelin işlemci sıcaklığını", "Üretilen cevapların rastgelelik ve yaratıcılık seviyesini", "Token başına maliyeti", "Bağlam penceresi boyutunu"],
    correctIndex: 1,
    explanation: "Düşük temperature daha deterministik/tahmin edilebilir, yüksek temperature ise daha yaratıcı ve çeşitli yanıtlar üretir."
  },
  {
    id: 38,
    question: "İlk nesne yönelimli (OOP) programlama dili olarak kabul edilen dil hangisidir?",
    category: "Yazılım",
    options: ["Simula 67", "C++", "Smalltalk", "Java"],
    correctIndex: 0,
    explanation: "1960'ların sonunda geliştirilen Simula 67, sınıf ve nesne kavramlarını ilk tanıtan dildir."
  },
  {
    id: 39,
    question: "Metal Gear serisinin dahi Japon yönetmeni kimdir?",
    category: "Oyun Kültürü",
    options: ["Hidetaka Miyazaki", "Hideo Kojima", "Shigeru Miyamoto", "Shinji Mikami"],
    correctIndex: 1,
    explanation: "Metal Gear ve Death Stranding oyunlarının yaratıcısı Hideo Kojima'dır."
  },
  {
    id: 40,
    question: "Rust'ın bellek güvenliğini çöp toplayıcı (Garbage Collector) olmadan sağlayan ana mekanizması nedir?",
    category: "Yazılım",
    options: ["Sahiplik ve Ödünç Alma (Ownership & Borrowing)", "Manuel malloc/free", "Referans sayacı (Arc)", "Sanal Makine (JVM)"],
    correctIndex: 0,
    explanation: "Rust'ın benzersiz 'Ownership & Borrowing' (Mülkiyet ve Ödünç) sistemi derleme zamanında bellek güvenliğini garanti eder."
  },
  {
    id: 41,
    question: "Bilgisayardaki 'Bug' terimi gerçek bir güve böceğinin röleler arasına sıkışmasıyla nerede kayıtlara geçmiştir?",
    category: "Bilim & Teknoloji",
    options: ["ENIAC", "Harvard Mark II", "Colossus", "IBM 7090"],
    correctIndex: 1,
    explanation: "Grace Hopper ve ekibi, 1947'de Harvard Mark II bilgisayarındaki bir arızaya röleye sıkışan bir güve böceğinin neden olduğunu deftere yapıştırmıştır."
  },
  {
    id: 42,
    question: "Skyrim'de muhafızların dizine ne isabet etmiştir?",
    category: "Oyun Kültürü",
    options: ["Kılıç darbesi", "Ok (Arrow)", "Ejderha ateşi", "Büyü şoku"],
    correctIndex: 1,
    explanation: "'I used to be an adventurer like you, then I took an arrow in the knee.' repliği efsanevi bir internet meme'ine dönüştü."
  },
  {
    id: 43,
    question: "Docker konteynerleştirme teknolojisi temelde hangi işletim sistemi çekirdek özelliklerini (cgroups, namespaces) kullanır?",
    category: "Yazılım",
    options: ["Windows NT", "Linux", "macOS Darwin", "FreeBSD"],
    correctIndex: 1,
    explanation: "Docker konteynerleri Linux çekirdeğinin cgroups (kaynak sınırlandırma) ve namespaces (izolasyon) mekanizmaları üzerinde çalışır."
  },
  {
    id: 44,
    question: "Hangisi bir NoSQL veritabanı türü DEĞİLDİR?",
    category: "Yazılım",
    options: ["Doküman Tabanlı", "Graf Tabanlı", "İlişkisel Tablo (SQL)", "Anahtar-Değer (Key-Value)"],
    correctIndex: 2,
    explanation: "İlişkisel tablolar geleneksel SQL / RDBMS mimarisidir."
  },
  {
    id: 45,
    question: "Matrix filminde Neo'nun Matrix dışındaki gerçek adı nedir?",
    category: "Popüler Kültür",
    options: ["Thomas Anderson", "John Wick", "Jack Traven", "Johnny Silverhand"],
    correctIndex: 0,
    explanation: "Metacortex yazılım şirketinde programcı olarak çalışan Neo'nun sivil adı Thomas A. Anderson'dır."
  },
  {
    id: 46,
    question: "Elden Ring'in dünya mitolojisini Hidetaka Miyazaki ile birlikte kim yazmıştır?",
    category: "Oyun Kültürü",
    options: ["Brandon Sanderson", "George R.R. Martin", "Neil Gaiman", "J.K. Rowling"],
    correctIndex: 1,
    explanation: "Game of Thrones'un yazarı George R.R. Martin, Lands Between'in tarihini ve yarı tanrılarını tasarlamıştır."
  },
  {
    id: 47,
    question: "Yapay zeka modellerinin girdiyi işlemek için böldüğü en küçük anlamsal parçalara ne denir?",
    category: "Yapay Zeka",
    options: ["Byte", "Token", "Vektör", "Nöron"],
    correctIndex: 1,
    explanation: "LLM'ler metinleri 'token' adı verilen kelime veya alt-kelime parçacıklarına ayırarak işler."
  },
  {
    id: 48,
    question: "JavaScript'te 'typeof NaN' ifadesinin sonucu nedir?",
    category: "Yazılım",
    options: ["'nan'", "'undefined'", "'number'", "'object'"],
    correctIndex: 2,
    explanation: "NaN 'Not a Number' anlamına gelse de IEEE 754 standardına göre sayısal bir tiptir; typeof NaN 'number' döner."
  },
  {
    id: 49,
    question: "Tarihin ilk ticari video oyunu konsolu olan Magnavox Odyssey hangi yılda piyasaya sürülmüştür?",
    category: "Oyun Kültürü",
    options: ["1968", "1972", "1977", "1983"],
    correctIndex: 1,
    explanation: "Ralph Baer tarafından tasarlanan Magnavox Odyssey 1972 yılında satışa sunulmuştur."
  },
  {
    id: 50,
    question: "Neo-Brutalism web tasarım akımının en belirgin karakteristik özelliği nedir?",
    category: "Popüler Kültür",
    options: ["Sert siyah konturlar, yüksek kontrastlı pastel renkler ve düz gölgeler", "Bulanık cam dokuları ve yumuşak geçişler", "Tamamen renksiz siyah beyaz yapılar", "Karmaşık 3D nesneler"],
    correctIndex: 0,
    explanation: "Neo-brutalizm; kalın siyah kenarlıklar (2-4px), göze çarpan gölgeler (brutal shadow), net tipografi ve canlı kontrastlı renkleriyle bilinir."
  }
];

export function getRandomTrivia(): TriviaQuestion {
  const index = Math.floor(Math.random() * TRIVIA_QUESTIONS.length);
  return TRIVIA_QUESTIONS[index];
}
