Lobby AI projesinin frontend geliştirme aşamasına başlıyoruz.

Öncelikle mevcut backend kodunu ve proje dokümantasyonunu incele. Backend'de şu ana kadar tamamlanmış API'leri, authentication yapısını, REST endpoint'lerini, WebSocket endpoint'lerini, request/response schema'larını ve mevcut veri modellerini anlayarak frontend'i bunlarla uyumlu şekilde tasarla.

**ÖNEMLİ:** Backend tarafında herhangi bir değişiklik yapma. Mevcut backend kontratlarını değiştirme veya varsayımsal endpoint/özellik oluşturma. Frontend, mevcut backend API'sine adapte olacak.

## Teknoloji Stack

* Next.js
* TypeScript
* React
* Tailwind CSS
* shadcn/ui
* REST API
* WebSocket

Frontend deployment hedefi: **Vercel**

Backend ayrı bir VPS üzerinde çalışan Rust + Axum uygulaması olacak.

---

# 1. Önce Mevcut Projeyi Analiz Et

Kod yazmaya başlamadan önce:

1. Repository yapısını incele.
2. `docs/` altındaki teknik dokümantasyonu oku.
3. Backend route'larını ve endpoint'lerini incele.
4. Authentication akışını incele.
5. WebSocket yapısını incele.
6. Request/response schema'larını incele.
7. Backend'in hangi endpointlerinin şu anda gerçekten kullanılabilir olduğunu tespit et.
8. Frontend ile backend arasında kurulması gereken API kontratlarını çıkar.

Eksik veya belirsiz bir şey varsa **tahmin ederek özellik ekleme**. Mevcut kod ve dokümantasyona dayan.

---

# 2. Frontend Projesini Oluştur

Next.js + TypeScript tabanlı temiz ve sürdürülebilir bir frontend oluştur.

Temel yapı mümkün olduğunca modüler olsun.

Örneğin:

```text
frontend/
├── app/
│   ├── login/
│   ├── register/
│   ├── lobbies/
│   ├── lobby/
│   │   └── [id]/
│   ├── profile/
│   └── settings/
├── components/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── websocket/
│   └── utils/
├── hooks/
├── types/
├── public/
└── ...
```

Gereksiz abstraction oluşturma. Küçük, anlaşılır ve domain odaklı modüller kullan.

---

# 3. Tasarım Dili

Lobby AI için özgün bir **Neo-Brutalist + Playful** görsel kimlik oluştur.

Tasarımın temel karakteri:

* Neo-brutalist
* Pastel ve canlı renkler
* Sempatik ve enerjik
* Modern
* Temiz
* Güçlü görsel hiyerarşi
* Kalın ve belirgin border'lar
* Belirgin fakat kontrollü box-shadow
* Büyük ve okunabilir typography
* Hafif yuvarlatılmış köşeler
* Eğlenceli fakat profesyonel görünüm

Özellikle şunlardan kaçın:

* Aşırı gradient
* Glassmorphism
* Aşırı blur
* Her yerde animasyon
* Gereksiz gölge katmanları
* Aşırı neon/cyberpunk görünüm
* Fazla karmaşık UI
* Tasarım uğruna kullanılabilirliği bozmak

Renk paleti pastel tabanlı fakat gerektiğinde canlı accent renkleri kullanabilecek şekilde oluşturulsun.

Renkleri rastgele her componentte kullanma. Tutarlı bir design token sistemi oluştur.

---

# 4. shadcn/ui Kullanımı

shadcn/ui kullanılacak.

Ancak shadcn/ui'nin varsayılan görünümünü doğrudan kullanma.

shadcn/ui:

**component altyapısıdır.**

Lobby AI:

**kendi tasarım kimliğine sahip bir üründür.**

Button, Input, Dialog, Dropdown, Avatar, Toast vb. temel componentleri shadcn/ui üzerinden oluşturabilir ve Tailwind ile Lobby AI tasarım diline uyarlayabilirsin.

Tekrarlanan UI stillerini merkezi ve tutarlı hale getir.

---

# 5. Responsive Tasarım

Frontend:

* Desktop
* Laptop
* Tablet
* Mobile

ekranlarda kullanılabilir olmalı.

Özellikle lobby/chat ekranı mobile'da da kullanılabilir olmalı.

Responsive davranışı sonradan ekleme; componentleri oluştururken düşün.

---

# 6. İlk Aşamada Sadece Temel Frontend Altyapısını Kur

İlk aşamada bütün sayfaları tamamlamaya çalışma.

Öncelik:

### A. Design System

* typography
* colors
* spacing
* borders
* shadows
* radius
* buttons
* inputs
* cards
* dialogs
* badges
* avatars

### B. Application Layout

Temel layout ve navigation yapısını oluştur.

### C. Login

İlk gerçek backend entegrasyonu burada yapılacak.

Login formu mevcut backend authentication endpointine bağlanacak.

### D. Register

Mevcut backend register endpointine bağlanacak.

### E. Lobby List

Mevcut backend API'sinden gerçek lobby verilerini çekerek göster.

### F. Lobby

Gerçek backend WebSocket bağlantısını kullan.

Mesaj gönderme/alma tamamen backend ile çalışsın.

Mock data kullanma.

---

# 7. API Katmanı

REST çağrılarını componentlerin içine dağınık şekilde yazma.

Örneğin:

```text
lib/api/
```

altında domain bazlı API fonksiyonları oluştur.

Örneğin backend'de gerçekten mevcutsa:

```text
auth
lobbies
messages
users
notifications
ai
```

gibi modüller oluşturulabilir.

API response/request TypeScript type'ları backend schema'larıyla uyumlu olsun.

Backend'de olmayan endpointleri oluşturma.

---

# 8. Authentication

Mevcut backend authentication mekanizmasını dikkatlice incele.

Frontend tarafında:

* login
* register
* logout
* authenticated state
* protected pages
* authentication error handling

düzgün şekilde ele alınmalı.

Token/session bilgisini güvenli şekilde yönet.

Backend'in mevcut auth modeline aykırı yeni bir authentication sistemi icat etme.

---

# 9. WebSocket

Lobby chat için mevcut backend WebSocket endpointini kullan.

WebSocket client'ı componentlerin içine rastgele yazmak yerine:

```text
lib/websocket/
hooks/
```

gibi uygun bir yapıda organize et.

Şunları düzgün yönet:

* connection
* disconnection
* reconnect
* incoming messages
* outgoing messages
* connection state
* cleanup

Ancak backend'in desteklemediği WebSocket eventlerini varsayarak oluşturma.

---

# 10. AI Agent

Backend'de Phase 3 tamamlanmış durumda.

Frontend daha sonra şu sistemi destekleyecek:

```text
@AgentName
```

ile AI Agent'ın lobby içinde cevap vermesi.

Agent mesajları normal kullanıcı mesajlarından tamamen ayrı bir chat sistemi olarak tasarlama.

Backend'deki bot user sistemi nedeniyle Agent mesajları normal mesajlar gibi görüntülenebilmeli.

Agent'ların görsel olarak ayırt edilebilmesi için küçük ama tutarlı UI detayları kullanılabilir.

Örneğin bot badge/avatar gibi.

Ancak AI davranışını frontend'e taşımaya çalışma.

AI logic backend'de kalacak.

---

# 11. UI/UX Kalitesi

Her ekranı sadece "çalışıyor" seviyesinde bırakma.

Şunları düşün:

* loading state
* empty state
* error state
* disabled state
* hover
* focus
* active
* validation errors
* başarılı işlem feedback'i
* mobile davranışı

Ancak gereksiz özellik ekleme.

Amaç:

**Basit, anlaşılır, karakterli ve kaliteli bir arayüz.**

---

# 12. Kod Kalitesi

Şu prensiplere uy:

* TypeScript strict yaklaşım
* `any` kullanımından kaçın
* küçük ve odaklanmış componentler
* gereksiz component abstraction oluşturma
* tekrar eden kodu azalt
* API çağrılarını UI componentlerine gömme
* WebSocket mantığını UI'dan mümkün olduğunca ayır
* açık ve anlamlı isimlendirme
* erişilebilir HTML/component kullanımı
* gereksiz dependency ekleme

---

# 13. Çalışma Şekli

Önemli:

Bütün frontend'i tek seferde oluşturmaya çalışma.

Şu sırayla ilerle:

```text
1. Backend analizi
2. Frontend kurulumu
3. Design system
4. Global layout
5. Login
6. Register
7. Lobby list
8. Lobby chat
9. WebSocket
10. Diğer mevcut backend özellikleri
11. AI Agent UI
12. Son UI/UX polish
```

Her aşamada mevcut kodu bozmadığından emin ol.

Bir sonraki aşamaya geçmeden önce:

```bash
npm run build
```

ve uygun lint/type kontrollerini çalıştır.

Hata varsa sonraki aşamaya geçmeden düzelt.

---

# EN ÖNEMLİ KURAL

Benim için öncelik sırası:

**Backend kontratlarına uyumluluk > Kullanılabilirlik > Temiz mimari > Tasarım > Ekstra özellikler**

Backend'de olmayan bir şeyi varsayarak implementasyon yapma.

Bir karar verilmesi gerekiyorsa önce mevcut kod/dokümantasyondan cevap ara.

Belirsizlik devam ediyorsa bana sor.

İlk olarak sadece **mevcut backend'i analiz et ve frontend başlangıç yapısını oluştur.**

Henüz bütün sayfaları implement etme.

İlk aşamanın sonunda bana:

1. Backend'den çıkardığın frontend API kontratlarını
2. Oluşturduğun frontend klasör yapısını
3. Design system kararlarını
4. Kurulan dependency'leri
5. Çalıştırdığın test/build sonuçlarını

özetle.
@