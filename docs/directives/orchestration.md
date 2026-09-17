# Lobby AI — Teamwork Development Task

## PROJE BAĞLAMI

Lobby AI, Rust + Axum + Tokio + SQLx + PostgreSQL tabanlı backend ve Next.js + React + TypeScript + Tailwind CSS + shadcn/ui tabanlı frontend kullanan gerçek zamanlı bir lobby/chat platformudur.

Projede katmanlı backend mimarisi kullanılmaktadır:

Handlers → Services → Repositories → Database

Frontend tarafında mevcut tasarım dili:

* Neo-Brutalist
* Playful
* Pastel + canlı renkler
* Keskin gölgeler
* Belirgin border'lar
* Modern SaaS hissi
* Friendly / approachable UI
* shadcn/ui + Tailwind CSS

Mevcut 3 kolonlu ana platform yapısı:

* Sol: navigation / friends
* Orta: lobby chat
* Sağ: lobby members

Backend ve veritabanı altyapısı büyük ölçüde hazırdır. Bu görev kapsamında öncelikli amaç, mevcut altyapıyı kullanarak frontend'i daha işlevsel ve profesyonel bir platform seviyesine taşımaktır.

---

# ÇOK ÖNEMLİ GELİŞTİRME KURALLARI

1. Önce repository'yi ve mevcut frontend/backend kodunu inceleyin.
2. Mevcut endpoint, component, hook, type ve servisleri tekrar kullanın.
3. Aynı işi yapan yeni bir API veya component oluşturmayın.
4. Backend'de gerçekten mevcut olmayan bir endpoint'i varmış gibi kabul etmeyin.
5. Bir endpoint'in mevcut olduğu söyleniyorsa repository üzerinden doğrulayın.
6. Gerekli backend değişikliği varsa bunu mevcut mimariye uygun şekilde ve minimum kapsamda yapın.
7. Mevcut çalışan özellikleri bozmayın.
8. Authentication, authorization ve ownership kontrollerini frontend'e güvenerek uygulamayın. Backend güvenlik kaynağı olmaya devam etmelidir.
9. UI'da yetkisiz kullanıcılara aksiyonları göstermemek gerekir ancak bu yalnızca UX filtresidir; backend authorization yine zorunludur.
10. Kod tekrarından kaçının.
11. `any` kullanımını gereksiz yere artırmayın.
12. TypeScript type güvenliğini koruyun.
13. Existing API client / WebSocket abstraction varsa doğrudan onu kullanın.
14. Global state yapısını gereksiz yere değiştirmeyin.
15. Büyük ve monolithic componentler oluşturmayın.
16. Her feature kendi sorumluluğu içinde modüler olmalıdır.
17. Tasarım mevcut Neo-Brutalist diliyle tutarlı olmalıdır.
18. Responsive davranış göz önünde bulundurulmalıdır.
19. Loading, empty, error ve success durumları unutulmamalıdır.
20. Bir agent başka bir agent'ın sorumluluk alanındaki dosyayı gereksiz yere değiştirmemelidir.
21. Çakışma yaratabilecek ortak dosyalarda değişiklik gerekiyorsa önce mevcut yapıyı anlayıp minimum değişiklik yapın.
22. Gereksiz dependency eklemeyin.
23. Feature tamamlandıktan sonra lint/typecheck/build/test işlemlerini çalıştırın.
24. Var olan testleri bozmayın.
25. Projede karar verilmemiş yeni özellikler icat etmeyin.

---

# AGENT 1 — LEAD / ORCHESTRATOR

## Sorumluluk

Tüm agentların çalışmalarını koordine etmek.

## Görevler

* Repository'nin genel yapısını incele.
* Frontend mimarisini incele.
* Mevcut routing, API client, WebSocket client, auth state ve component yapısını belirle.
* Diğer agentların birbirine dokunacağı ortak alanları önceden tespit et.
* Feature'ların birbirleriyle çakışmasını önle.
* Mevcut tasarım sisteminin korunmasını sağla.
* Agentların yaptığı değişiklikleri gözden geçir.
* Gereksiz mimari değişiklikleri engelle.
* Feature entegrasyonlarının birbirleriyle uyumlu olmasını sağla.
* Build/typecheck/lint sorunlarını takip et.

## Önemli

Lead agent büyük feature'ları kendi başına tekrar implement etmemeli.

Temel görevi koordinasyon, mimari tutarlılık ve entegrasyon kontrolüdür.

---

# AGENT 2 — AI AGENT DASHBOARD

## Amaç

Lobby AI'ın en önemli özelliklerinden biri olan kişisel AI Agent sistemini frontend üzerinden tamamen kullanılabilir hale getirmek.

Backend tarafında mevcut rapora göre:

* `AiProvider` abstraction mevcut.
* `GeminiProvider` mevcut.
* API key'ler AES-GCM ile şifreleniyor.
* `agents` tablosu mevcut.
* Agent personality / communication / interest configuration mevcut.
* Prompt Builder mevcut.

Eksik olan temel bölüm frontend AI Dashboard'dur.

## Kullanıcı deneyimi

Kullanıcı uygulama içerisinde "My Agents" bölümüne girdiğinde:

* mevcut agentlarını görebilmeli
* yeni agent oluşturabilmeli
* agent detaylarını görebilmeli
* agent ayarlarını değiştirebilmeli
* API key yönetimi yapabilmeli
* agent silebilmeli
* mümkün olan mevcut backend desteğine göre agent ile ilgili test işlemlerini kullanabilmeli

## Agent Card

Her agent için modern Neo-Brutalist bir card oluştur.

Card üzerinde mümkün olan bilgiler:

* Agent name
* Provider
* Model
* Personality özeti
* Communication style özeti
* Interest özeti
* Edit
* Delete

Backend'den gelmeyen bilgileri uydurma.

## Create Agent

Agent oluşturma UI'ı oluştur.

Form yapısı backend'in gerçek schema'sına göre belirlenmelidir.

Özellikle:

* Name
* Provider
* Model
* Personality
* Interests
* Communication style
* Behavior
* Custom instructions

alanlarını destekle.

Backend'de hangi alanların hangi formatta kabul edildiğini önce repository'den kontrol et.

## API Key

API key kullanıcıdan güvenli şekilde alınmalıdır.

Kurallar:

* API key'i URL'e koyma.
* Console log'a yazma.
* React state dışında gereksiz yere kalıcı olarak tutma.
* API key'i UI'da plaintext olarak tekrar göstermemeye dikkat et.
* Backend'in mevcut encrypted-key mekanizmasına uygun çalış.
* Eğer backend key'in tekrar okunmasına izin vermiyorsa frontend'de key'i göstermeye çalışma.
* API key alanında uygun password/secret input kullan.

## Edit Agent

Agent oluşturulduktan sonra özellikleri değiştirilebilmelidir.

Mevcut backend destekliyorsa:

`PATCH /api/ai/agents/:id`

kullanılmalıdır.

Edit ekranında agent configuration alanları düzenlenebilmelidir.

Özellikle:

* Personality
* Interests
* Communication
* Behavior
* Custom instructions

alanları düzgün şekilde güncellenebilmelidir.

## UX

Şunları mutlaka ele al:

* loading
* saving
* success
* API error
* validation error
* empty agent list
* delete confirmation
* unsaved changes
* responsive görünüm

## Tasarım

Dashboard sıradan bir admin paneli gibi görünmemeli.

Neo-Brutalist card sistemi kullanılmalı:

* güçlü border
* belirgin shadow
* canlı accent'ler
* net typography
* eğlenceli ama profesyonel görünüm

Ancak aşırı animasyon kullanılmamalı.

---

# AGENT 3 — NOTIFICATION CENTER

## Amaç

Backend tarafından oluşturulan notification sistemini frontend'de kullanıcı tarafından görülebilir ve kullanılabilir hale getirmek.

Rapora göre backend notification altyapısı mevcut ve olaylar DB'ye kaydediliyor.

Öncelikle gerçek endpoint ve response schema'sını repository üzerinden doğrula.

## UI

Ana platform top bar'ında bir notification Bell bulunmalıdır.

Bell:

* okunmamış notification sayısını gösterebilmeli
* unread yoksa gereksiz badge göstermemeli
* tıklandığında Notification Center açmalı

## Notification Center

Neo-Brutalist bir Drawer / Sheet / popover benzeri yapı oluştur.

Notification item:

* notification title
* message
* zaman bilgisi
* okunmuş / okunmamış state
* notification türüne göre uygun görsel işaret

Backend'den gelmeyen bilgileri uydurma.

## Notification türleri

Mevcut backend notification type'larını repository'den tespit et.

Örneğin sistemde varsa:

* friend request
* lobby invitation
* kicked
* banned
* reaction
* diğer mevcut notification türleri

Frontend bunları backend'in gerçek enum/type değerlerine göre ele almalıdır.

## Read State

Kullanıcı notification'a tıkladığında veya uygun mevcut UX'e göre:

* notification read yapılabilmeli
* unread badge güncellenmeli

Mevcut read endpointini kullan.

## Realtime

Backend/WebSocket tarafında notification event'i mevcutsa bunu mevcut WebSocket abstraction üzerinden destekle.

Yeni ve paralel bir WebSocket sistemi oluşturma.

Yeni notification geldiğinde:

* notification listesi güncellenmeli
* unread count güncellenmeli
* gerekiyorsa hafif bir visual feedback gösterilmeli

## UX durumları

* loading
* empty state
* unread state
* read state
* API error
* network error

tasarlanmalı.

---

# AGENT 4 — LOBBY CONTEXT MENUS

## Amaç

Lobi içerisindeki kullanıcıların üzerine aksiyon uygulanabilmesini sağlayan sağ tık / üç nokta context menu sistemini oluşturmak.

Backend'de mevcut rapora göre:

* kick
* ban
* mute
* friend sistemi

için backend altyapısı mevcut.

Önce gerçek endpointleri ve authorization mantığını repository'den doğrula.

## Member List

Sağ paneldeki lobby member item'larına:

* üç nokta button
  veya
* uygun desktop interaction olarak context menu

ekle.

Mobil cihazlarda sağ tık yerine uygun touch interaction kullanılmalıdır.

## Menü aksiyonları

Kullanıcının mevcut ilişkisine ve yetkisine göre:

* Add Friend
* Mute
* Kick
* Ban

gibi mevcut backend işlemleri gösterilebilir.

Ancak sadece repository'de gerçekten desteklenen aksiyonları kullan.

## Authorization

Frontend'de:

* normal MEMBER
* lobby OWNER
* varsa diğer mevcut roller

arasındaki fark dikkate alınmalı.

Örneğin MEMBER kullanıcısına Kick/Ban göstermek mantıklı değildir.

Fakat bu yalnızca UI filtresidir.

Backend authorization bypass edilememelidir.

## Kendi hesabı

Kullanıcının kendisine uygulanamayacak aksiyonlar gösterilmemelidir.

Örneğin:

* kendini kick
* kendini ban
* kendine friend request

gibi anlamsız işlemler engellenmelidir.

## UX

Destructive actions için:

* confirmation
* loading state
* success feedback
* error feedback

eklenmeli.

Kick/Ban gibi işlemler yanlışlıkla tetiklenmemeli.

## Friend

Friend sistemi zaten frontend'de mevcutsa tekrar implement etme.

Mevcut friend API/client/hook yapısını yeniden kullan.

---

# AGENT 5 — GLOBAL COMMAND PALETTE

## Amaç

Platforma profesyonel ve hızlı erişilebilir bir Command Palette eklemek.

Bu feature mümkün olduğunca frontend-only olmalıdır.

## Açma

Desktop:

* Ctrl + K
* Mac üzerinde Cmd + K

desteklenmeli.

Mevcut tarayıcı davranışlarıyla çakışma ihtimalini kontrol et.

## UI

Command Palette:

* ekranı kaplayan overlay
* merkezde geniş command panel
* keyboard navigation
* search input
* kategorize edilmiş sonuçlar

kullanabilir.

Mevcut shadcn/ui componentleri varsa yeniden kullanılmalıdır.

## Komutlar

En azından mevcut uygulamanın gerçek route'larına göre:

* Home / Lobby list
* My Agents
* Settings
* Friends
* ilgili mevcut navigation sayfaları

gibi hızlı erişimler desteklenebilir.

Route'lar repository'den doğrulanmalıdır.

## Lobby Search

Kullanıcının lobby araması yapabilmesi istenmektedir.

Önce mevcut lobby API'lerinin search/filter desteğini kontrol et.

Eğer backend'de uygun API varsa onu kullan.

Backend search endpointi yoksa sırf Command Palette için yeni ve gereksiz bir backend sistemi oluşturma.

Mevcut lobby listesi üzerinden güvenli ve mantıklı bir frontend search yapılabiliyorsa onu kullan.

## Keyboard navigation

Kullanıcı:

* Arrow Up
* Arrow Down
* Enter
* Escape

ile palette içerisinde gezebilmelidir.

## UX

* hızlı açılmalı
* input otomatik focus almalı
* Escape ile kapanmalı
* dış alana tıklayınca kapanabilmeli
* mobil cihazlarda kullanılabilir alternatif sunulmalı

---

# ORTAK TASARIM STANDARDI

Bütün agentlar aynı ürün üzerinde çalıştığından UI birbirinden kopuk görünmemelidir.

Kullanılacak genel görsel dil:

* Neo-Brutalist
* Pastel + vivid accent
* güçlü border
* keskin/ belirgin shadow
* rounded yapı yalnızca tasarıma uygunsa
* güçlü typography
* net spacing
* minimal ama anlamlı animation
* friendly SaaS interface

Her agent kendi feature'ını ayrı bir tasarım sistemiymiş gibi oluşturmamalıdır.

Mevcut frontend componentlerini mümkün olduğunca yeniden kullanın.

---

# ORTAK TEKNİK KURALLAR

Her agent:

1. Önce ilgili mevcut kodu incelesin.
2. Sonra implementasyon yapsın.
3. Mevcut API'leri doğrulasın.
4. TypeScript type'larını backend response'larıyla uyumlu tutsun.
5. API client abstraction varsa onu kullansın.
6. Componentleri küçük ve sorumluluk odaklı tutsun.
7. Gereksiz global state eklemesin.
8. Gereksiz dependency eklemesin.
9. Error handling yapsın.
10. Loading state yapsın.
11. Empty state yapsın.
12. Responsive davranışı kontrol etsin.
13. Lint/typecheck/build çalıştırsın.
14. Kendi değişikliklerinin dışındaki sorunları değiştirmeden raporlasın.

---

# AGENTLAR ARASI ÇALIŞMA KURALI

Agentlar paralel çalışabileceği için aynı dosyaları gereksiz yere değiştirmeyin.

Özellikle:

* global layout
* sidebar
* top bar
* shared UI components
* API client
* WebSocket client

gibi ortak dosyalarda değişiklik yaparken mevcut yapıyı koruyun.

Bir feature için shared component gerekiyorsa önce mevcut component library'sini kontrol edin.

Aynı componenti iki farklı agent yeniden yazmamalıdır.

---

# QA / ENTEGRASYON AŞAMASI

Tüm feature'lar tamamlandıktan sonra QA kontrolü yapılmalıdır.

Kontrol listesi:

## AI Agent

* Agent listesi açılıyor mu?
* Agent oluşturulabiliyor mu?
* API key doğru şekilde gönderiliyor mu?
* API key UI'da güvenli mi?
* Agent edit çalışıyor mu?
* Delete çalışıyor mu?
* Validation çalışıyor mu?
* Error state'leri düzgün mü?

## Notifications

* Bell görünüyor mu?
* Unread count doğru mu?
* Notification listesi geliyor mu?
* Read işlemi çalışıyor mu?
* Realtime notification mevcutsa çalışıyor mu?
* Empty state düzgün mü?

## Context Menu

* Member menu açılıyor mu?
* Yetkisiz kullanıcılar moderation aksiyonlarını göremiyor mu?
* Backend authorization hâlâ korunuyor mu?
* Kick/Ban/Mute doğru endpointlere gidiyor mu?
* Confirmation var mı?
* Friend action mevcut sistemle uyumlu mu?

## Command Palette

* Ctrl+K çalışıyor mu?
* Cmd+K çalışıyor mu?
* Search çalışıyor mu?
* Keyboard navigation çalışıyor mu?
* Escape çalışıyor mu?
* Gerçek route'lara gidiyor mu?
* Mevcut uygulamayı engelleyen keyboard shortcut problemi var mı?

---

# SON KURAL

Bu görev bir "yeniden yazma" görevi değildir.

Amaç mevcut Lobby AI projesinin üzerine kontrollü şekilde:

1. AI Agent Dashboard
2. Notification Center
3. Lobby Context Menus
4. Global Command Palette

eklemektir.

Mevcut çalışan sistemleri koruyun.

Repository'de olmayan endpointleri, componentleri veya özellikleri varsaymayın.

Bir şeyin mevcut olup olmadığı konusunda emin değilseniz önce kodu inceleyin.

Gereksiz backend değişikliğinden kaçının.

Öncelik:

**Mevcut mimariyi korumak → çalışan özellikleri bozmamak → type safety → UX → görsel kalite.**
