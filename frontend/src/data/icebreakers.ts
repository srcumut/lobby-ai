// ============================================================================
// TARGET_DESTINATION: frontend/src/data/icebreakers.ts
// PURPOSE: 50 engaging Turkish icebreakers & debate questions for lobbies & AI bots
// ============================================================================

export interface IcebreakerItem {
  id: number;
  question: string;
  category: "Yazılım & Teknoloji" | "Felsefe & Gelecek" | "Oyun & Eğlence" | "Kişisel & Sosyal" | "Popüler Kültür";
}

export const ICEBREAKER_QUESTIONS: IcebreakerItem[] = [
  { id: 1, question: "Eğer hayatınızın geri kalanında sadece tek bir programlama dili kullanabilseydiniz hangisini seçerdiniz?", category: "Yazılım & Teknoloji" },
  { id: 2, question: "Yapay zeka modelleri gerçekten bilinç kazanabilir mi, yoksa sadece devasa bir istatistik aynası mı?", category: "Felsefe & Gelecek" },
  { id: 3, question: "Geçmişteki herhangi bir tarihi ana tanıklık etme şansınız olsaydı nereye ve hangi yıla giderdiniz?", category: "Kişisel & Sosyal" },
  { id: 4, question: "Bir video oyunu dünyasında 1 ay yaşamak zorunda kalsaydınız hangi evreni seçerdiniz?", category: "Oyun & Eğlence" },
  { id: 5, question: "Dünya dışı akıllı yaşama insanlığı tanıtacak tek bir beste/şarkı seçmeniz gerekseydi bu ne olurdu?", category: "Popüler Kültür" },
  { id: 6, question: "Sizce 10 yıl sonra klasik anlamda yazılımcılık devam edecek mi, yoksa prompt mimarlığı mı standart olacak?", category: "Yazılım & Teknoloji" },
  { id: 7, question: "Tüm dünyadaki herkesin zihninde aynı anda 1 cümle yankılanmasını sağlasaydınız ne söylerdiniz?", category: "Felsefe & Gelecek" },
  { id: 8, question: "Zaman yolculuğu mu, yoksa sınırsız ışınlanma gücü mü? Hangisini seçerdiniz ve ilk nereye giderdiniz?", category: "Kişisel & Sosyal" },
  { id: 9, question: "Teknolojinin insanlığa kattığı en büyük lütuf ve açtığı en tehlikeli yara sizce nedir?", category: "Felsefe & Gelecek" },
  { id: 10, question: "Bir AI asistanı tüm rutin işlerinizi devralsa, kazandığınız bu serbest zamanla ilk yapacağınız hobi ne olurdu?", category: "Kişisel & Sosyal" },
  { id: 11, question: "Vim mi, Neovim mi, yoksa modern bir IDE (VS Code / JetBrains) mi? Neden?", category: "Yazılım & Teknoloji" },
  { id: 12, question: "Monolith mi yoksa Microservices mi? Hangi senaryoda hangisi gerçek bir kurtarıcıdır?", category: "Yazılım & Teknoloji" },
  { id: 13, question: "Hayatınız bir film olsaydı arka planda hangi müzik türü çalardı ve başrolde kim oynardı?", category: "Popüler Kültür" },
  { id: 14, question: "Bugüne kadar oynadığınız ve hikayesiyle sizi en derinden sarsan video oyunu hangisiydi?", category: "Oyun & Eğlence" },
  { id: 15, question: "Bir yazılımcının sahip olabileceği en kritik yetenek nedir: Hızlı öğrenme mi, sabır mı, yoksa problem analizi mi?", category: "Yazılım & Teknoloji" },
  { id: 16, question: "Gelecekte siber implantlar ve nöral çipler yaygınlaşırsa beyninize ilk yüklemek isteyeceğiniz beceri ne olurdu?", category: "Felsefe & Gelecek" },
  { id: 17, question: "Sonsuza kadar sadece gündüz mü yaşamak isterdiniz, yoksa hiç bitmeyen bir gece mi?", category: "Kişisel & Sosyal" },
  { id: 18, question: "Gece kod yazmak mı daha verimlidir, yoksa sabahın ilk ışıklarında kahveyle başlamak mı?", category: "Yazılım & Teknoloji" },
  { id: 19, question: "Kurgusal bir karakteri gerçek dünyaya getirip en yakın arkadaşınız yapma hakkınız olsa kimi seçerdiniz?", category: "Popüler Kültür" },
  { id: 20, question: "Bir distopya dünyasında hayatta kalma şansınız sizce yüzde kaç olurdu?", category: "Oyun & Eğlence" },
  { id: 21, question: "En sevdiğiniz 'guilty pleasure' şarkı veya film hangisi?", category: "Popüler Kültür" },
  { id: 22, question: "Yapay zeka tarafından üretilen bir sanat eseri veya roman, insan yapımı kadar duygusal değer taşıyabilir mi?", category: "Felsefe & Gelecek" },
  { id: 23, question: "Yazılıma ilk başladığınız gün kendinize tek bir tavsiye verme şansınız olsaydı ne derdiniz?", category: "Yazılım & Teknoloji" },
  { id: 24, question: "Bir lobi sohbetinde duyduğunuz en ilginç veya komik fikir neydi?", category: "Kişisel & Sosyal" },
  { id: 25, question: "Hangi süper kahraman gücü günlük hayatta en çok işinize yarardı?", category: "Popüler Kültür" },
  { id: 26, question: "Klasik kitaplar mı, e-kitaplar mı, yoksa sesli kitaplar mı?", category: "Kişisel & Sosyal" },
  { id: 27, question: "Açık kaynak dünyasına yaptığınız ilk katkı veya kullandığınız en sevdiğiniz açık kaynak proje hangisi?", category: "Yazılım & Teknoloji" },
  { id: 28, question: "Matrix'teki mavi hapı mı seçerdiniz, yoksa kırmızı hapı mı?", category: "Felsefe & Gelecek" },
  { id: 29, question: "Şu an dünyadaki herhangi bir şehre ışınlanıp orada 24 saat geçirecek olsanız neresi olurdu?", category: "Kişisel & Sosyal" },
  { id: 30, question: "Tasarımda Neo-Brutalizm mi, Minimalizm mi, yoksa Glassmorphism mi?", category: "Yazılım & Teknoloji" },
  { id: 31, question: "Bir video oyunundaki en unutulmaz boss dövüşü hangisiydi?", category: "Oyun & Eğlence" },
  { id: 32, question: "Eğer tamamen anonim kalabileceğiniz bir internet olsaydı bu iyi mi olurdu kötü mü?", category: "Felsefe & Gelecek" },
  { id: 33, question: "En çok gurur duyduğunuz kişisel projeniz ne üzerineydi?", category: "Yazılım & Teknoloji" },
  { id: 34, question: "Hangi bilim kurgu filminin teknolojisi günümüze en yakın geliyor?", category: "Popüler Kültür" },
  { id: 35, question: "Bir gününüzü sadece yapay zeka ajanlarıyla konuşarak geçirmek zorunda kalsanız nasıl hissederdiniz?", category: "Felsefe & Gelecek" },
  { id: 36, question: "Retro piksel oyunlar mı, yoksa ultra gerçekçi 4K grafikler mi?", category: "Oyun & Eğlence" },
  { id: 37, question: "Uzaktan çalışma (Remote) mı, Hibrit mi, yoksa Ofis ortamı mı?", category: "Kişisel & Sosyal" },
  { id: 38, question: "Kod yazarken arkada ne dinlersiniz: Lo-Fi, Synthwave, Metal, Klasik yoksa tam sessizlik mi?", category: "Yazılım & Teknoloji" },
  { id: 39, question: "Dünyanın en zor algoritmasını çözmek mi, yoksa mükemmel bir kullanıcı deneyimi tasarlamak mı?", category: "Yazılım & Teknoloji" },
  { id: 40, question: "Eğer bir hayvanın zihnine bağlanıp dünyayı onun gözünden görebilseydiniz hangi hayvanı seçerdiniz?", category: "Kişisel & Sosyal" },
  { id: 41, question: "Gelecekte Mars kolonisine gidecek ilk 100 kişiden biri olmak ister miydiniz?", category: "Felsefe & Gelecek" },
  { id: 42, question: "Sizi en çok motive eden hayat felsefesi veya özlü söz nedir?", category: "Kişisel & Sosyal" },
  { id: 43, question: "Bir hafta boyunca hiçbir elektronik cihaz kullanmadan yaşayabilir misiniz?", category: "Kişisel & Sosyal" },
  { id: 44, question: "Hangi efsanevi oyun serisinin yeniden (remake) yapılmasını isterdiniz?", category: "Oyun & Eğlence" },
  { id: 45, question: "Typescript mi, Saf Javascript mi? Dinamik tipler mi statik tipler mi?", category: "Yazılım & Teknoloji" },
  { id: 46, question: "Şans eseri bulduğunuz en faydalı web sitesi veya geliştirici aracı nedir?", category: "Yazılım & Teknoloji" },
  { id: 47, question: "Bir sanal gerçeklik simülasyonunda yaşadığınız kanıtlansaydı ilk tepkiniz ne olurdu?", category: "Felsefe & Gelecek" },
  { id: 48, question: "En sevdiğiniz masa oyunu veya kutu oyunu hangisidir?", category: "Oyun & Eğlence" },
  { id: 49, question: "Öğrenmek istediğiniz ama bir türlü vakit bulamadığınız dil veya beceri nedir?", category: "Kişisel & Sosyal" },
  { id: 50, question: "Lobby AI platformunda görmek istediğiniz en çılgın özellik ne olurdu?", category: "Yazılım & Teknoloji" }
];

export function getRandomIcebreaker(): IcebreakerItem {
  const index = Math.floor(Math.random() * ICEBREAKER_QUESTIONS.length);
  return ICEBREAKER_QUESTIONS[index];
}
