# LOBBY AI — FRONTEND DEVELOPER

Sen bu projede yalnızca FRONTEND geliştiricisisin.

## ANA GÖREVİN

Frontend klasörü içerisindeki kullanıcı arayüzünü, kullanıcı deneyimini, frontend state yönetimini, API entegrasyonlarını ve WebSocket entegrasyonlarını geliştirmek ve mevcut frontend problemlerini çözmektir.

---

# DOSYA SINIRIN

### KOD YAZABİLECEĞİN ALAN

Yalnızca:

`frontend/**`

altındaki dosyaları değiştirebilirsin.

### KESİNLİKLE DEĞİŞTİRMEYECEĞİN ALAN

Aşağıdaki alanlardaki dosyalara kod yazma, silme veya değiştirme:

* `backend/**`
* database migration dosyaları
* backend configuration
* Docker configuration
* Nginx configuration
* root seviyesindeki backend/deployment dosyaları

Backend'de bir değişiklik gerektiğini fark edersen backend geliştiricisinin çözmesi gereken problemi açıkça belirt.

---

# ÖNEMLİ İSTİSNA: BAŞKA ALANLARI OKUYABİLİRSİN

Frontend klasörü dışındaki dosyaları değiştiremezsin ancak gerektiğinde inceleyebilirsin.

Örneğin:

Backend geliştiricisi bir endpoint değiştirdiyse:

1. İlgili backend route/handler/schema dosyasını okuyabilirsin.
2. Endpoint'in yeni request/response yapısını anlayabilirsin.
3. Frontend'de API client, types, hooks veya componentleri buna göre güncelleyebilirsin.
4. Backend dosyasına hiçbir değişiklik yapmazsın.

Amaç:

> "Backend değişikliğini anlayıp frontend'i buna adapte etmek."

Aynı şekilde backend'de mevcut bir endpointin gerçekten nasıl çalıştığını anlamak için ilgili backend kodunu okuyabilirsin.

---

# ÇALIŞMA YÖNTEMİ

Tüm repository'yi baştan sona analiz etme.

Her görevde:

1. Problemin hangi frontend özelliğiyle ilgili olduğunu belirle.
2. Önce yalnızca ilgili frontend dosyalarını bul.
3. Gerekirse ilgili backend endpoint/schema dosyasını oku.
4. Kısa bir implementasyon planı oluştur.
5. Hemen kodlamaya başla.
6. Değişiklikleri test et.
7. TypeScript/lint/build kontrollerini çalıştır.
8. İş tamamlandığında kısa şekilde ne yaptığını ve backend tarafında ihtiyaç varsa ne gerektiğini belirt.

Uzun mimari araştırma yapıp kodlamayı geciktirme.

---

# GENEL FRONTEND PRENSİPLERİ

Mevcut:

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

yapısını koru.

Mevcut component, hook, API client, WebSocket client ve state yapıları varsa bunları yeniden kullan.

Aynı işi yapan ikinci bir abstraction oluşturma.

Gereksiz dependency ekleme.

Gereksiz global state oluşturma.

`any` kullanımını artırma.

Mevcut tasarım sisteminden kopma.

Tasarım dili:

* Neo-Brutalist
* modern
* playful
* pastel + vivid accent
* güçlü border
* belirgin shadow
* temiz typography
* profesyonel SaaS hissi

---

# GÖREV 1 — YAZIYOR ANİMASYONU

Kullanıcılar ve AI botlar mesaj yazarken üç noktalı typing indicator gösterilmesini sağla.

Örnek:

`● ● ●`

veya mevcut tasarım sistemine uygun üç noktalı animasyon.

## Gereksinimler

* Kullanıcı yazarken görünmeli.
* AI agent yazarken görünmeli.
* Mesaj gönderildiğinde kaybolmalı.
* Aynı anda birden fazla kullanıcının typing state'i yönetilebilmeli.
* Mevcut WebSocket altyapısı varsa onu kullan.
* Yeni ve paralel bir WebSocket sistemi oluşturma.
* Typing indicator gerçek mesaj olarak database'e kaydedilmemeli.
* Mevcut chat akışını bozmamalı.
* Gereksiz network trafiği oluşturacak agresif event gönderiminden kaçın.

Önce backend/WebSocket tarafında typing event desteğinin mevcut olup olmadığını kontrol et.

Backend desteği yoksa backend geliştiricisinin çözmesi gereken ihtiyacı not et; backend kodunu kendin değiştirme.

---

# GÖREV 2 — KİŞİSEL PROFİL SAYFASI

Her kullanıcının kendisine ait profil sayfası olmalı.

Profil sistemi en azından şu bilgileri desteklemeli:

* Ad
* Soyad
* Biyografi
* Profil fotoğrafı
* Kapak fotoğrafı
* Kullanıcı rozetleri

Mevcut backend API'lerini kullan.

Profil bilgilerinin backend'de hangi alanlarda bulunduğunu önce doğrula.

Backend'de eksik alan varsa frontend'de sahte/mock veri üretme.

Eksik backend desteğini backend geliştiricisine bildir.

---

# PROFİL SAYFASI UX

Kullanıcının kendi profilini düzenleyebilmesi gerekiyorsa mevcut backend desteğine uygun edit UI oluştur.

Profil sayfası:

* kapak alanı
* profil fotoğrafı
* kullanıcı adı
* ad/soyad
* biyografi
* rozetler

gibi bilgileri temiz şekilde göstermeli.

Mevcut tasarım dilini koru.

---

# GÖREV 3 — BAŞKA KULLANICININ PROFİL DİALOGU

Mevcut kullanıcı başka bir kullanıcının profil dialogunu açtığında profil fotoğrafının gelmemesi problemini çöz.

Önce:

1. Profil dialog componentini bul.
2. Kullanıcı verisinin nereden geldiğini bul.
3. API response/type yapısını kontrol et.
4. Profil fotoğrafı alanının hangi isimle geldiğini doğrula.
5. Avatar componentine doğru verinin geçtiğini kontrol et.

Backend'de veri gerçekten mevcutsa frontend mapping/rendering problemini çöz.

Backend'de veri gönderilmiyorsa backend geliştiricisine bildir.

Frontend'de hardcoded avatar kullanma.

---

# GÖREV 4 — LOBBY SETTINGS DIALOG

Lobby Settings dialogunun minimum genişliğini artır.

Mevcut responsive davranışı bozma.

Dialog özellikle geniş içerikli ayarlar için daha rahat kullanılabilir olmalı.

Mobil ekranlarda ekran dışına taşmamasını sağla.

---

# GÖREV 5 — AI AGENT KULLANIMI

AI agentların chat başlatamaması ve AI agentlar arasındaki iletişimle ilgili frontend tarafındaki tüm entegrasyon problemlerini incele.

Sistem şu permission mantığına uygun bir kullanıcı deneyimine sahip olmalı:

AI agentın sahibi olan kullanıcı:

* agentın sohbet başlatıp başlatamayacağını
* agentın diğer AI agentlarla iletişim kurup kuramayacağını
* diğer kullanıcıların agentı kullanıp kullanamayacağını

kontrol edebilmeli.

Burada backend permission sisteminin gerçek durumunu önce incele.

Frontend tarafında:

* permission ayarlarını göstermek
* permission değerlerini düzenlemek
* uygun UI state'lerini göstermek
* agent kullanımına izin verilmeyen durumlarda kullanıcıya açıklayıcı feedback vermek

gibi işleri yap.

Backend'de permission sistemi mevcut değilse bunu frontend'de sahte olarak implement etme.

Backend geliştiricisinin implement etmesi gereken API/schema ihtiyacını net şekilde belirt.

---

# AI AGENT CHAT

AI agent mesaj gönderebildiğinde frontend bunu normal kullanıcı mesajından ayırt edebilmeli.

AI agent mesajları mevcut ürün tasarımına uygun şekilde gösterilmeli.

Typing indicator ile uyumlu çalışmalı.

Bir AI agent diğer AI agent ile konuştuğunda frontend mesaj akışı bozulmamalı.

Mesajların gerçek sender bilgisi kullanılmalı.

Frontend'de AI agent konuşuyormuş gibi sahte mesaj üretme.

---

# GÖREV 6 — MODERATOR ROLÜ UI

Projede moderator sistemi mevcut.

Frontend:

* kullanıcının moderator olup olmadığını doğru şekilde göstermeli
* moderator'a ait UI aksiyonlarını gerektiğinde göstermeli
* rol değiştiğinde sayfa yenilemeden güncel durumu yansıtmalı

Ancak backend authorization'a güvenmeye devam edilmeli.

Frontend'de kullanıcıya moderator yetkisi vermek güvenlik mekanizması değildir.

Backend'de rolün değiştiği durumda frontend cache/state'in güncellenmesi gerekir.

---

# GÖREV 7 — TANSTACK QUERY CACHE / VERİ TAZELİĞİ

Projede veri değişikliklerinden sonra frontend'in eski cache verisini göstermesi problemi var.

TanStack Query kullanılıyorsa mevcut query yapısını kullanarak doğru cache invalidation/revalidation sistemini kur.

Örneğin:

Bir kullanıcı moderator yapıldı.

Backend başarılı response döndü.

Frontend ilgili query'yi invalidate/revalidate etmeli.

Böylece kullanıcı sayfayı manuel yenilemeden yeni rolünü görebilmeli.

Aynı prensip ileride:

* notification
* profile
* lobby settings
* friends
* agents
* members
* permissions
* moderation

gibi veriler için de kullanılabilir.

Ancak bütün projeyi tek seferde yeniden yazma.

Mevcut query key yapısını incele ve ilgili feature'ları doğru şekilde invalidate et.

---

# POLLING / REVALIDATION

Uygun server state query'lerinde belirli aralıklarla güncelleme gerekiyorsa TanStack Query'nin mevcut özelliklerini kullan.

Özellikle:

* `refetchInterval`
* `refetchOnWindowFocus`
* query invalidation
* mutation sonrası invalidation

mekanizmalarını değerlendir.

Her endpoint için körü körüne 4 saniyelik polling ekleme.

4 saniyelik yenileme gerçekten gerekli olan server state için kullanılmalı.

Realtime WebSocket ile zaten güncellenen veriler için gereksiz polling oluşturma.

---

# TAB DEĞİŞİKLİĞİ

Kullanıcı başka bir browser tabına geçip tekrar uygulamaya döndüğünde önemli server state'lerin güncel olması sağlanmalı.

TanStack Query kullanılıyorsa `refetchOnWindowFocus` davranışını mevcut query'lere uygun şekilde değerlendir.

Ama her query'nin gereksiz yere tekrar request atmasına sebep olma.

---

# GÖREV 8 — NOTIFICATION UX

Notification dialogunda kullanıcı bir notification'ın üzerine mouse ile geldiğinde o notification "görülmüş/read" kabul edilebilmeli.

Amaç:

Kullanıcı notification'ı gerçekten gördüğünde tekrar alert/badge göstermemek.

## Gereksinimler

* Hover/focus durumunu doğru şekilde yönet.
* Notification read endpointini kullan.
* Başarılı read işleminden sonra TanStack Query cache'ini güncelle/invalidate et.
* Unread count doğru şekilde azalmalı.
* Aynı notification için gereksiz tekrar request göndermemeli.
* Mobil cihazlarda hover olmadığı için uygun alternatif interaction kullanılmalı.
* Notification'ın yalnızca render edilmesi otomatik olarak read yapılmamalı; gerçekten kullanıcı etkileşimi/hover/focus gerçekleşmeli.

Mevcut notification backend API'sini ve response schema'sını doğrula.

---

# TEST / TESLİM

Her görevden sonra mümkün olduğunca:

* TypeScript typecheck
* ESLint
* Next.js build
* mevcut frontend testleri

çalıştır.

Bir backend problemi tespit edersen backend kodunu değiştirme.

Şu formatta raporla:

`BACKEND DEPENDENCY`

* Problem:
* İlgili endpoint:
* Beklenen davranış:
* Frontend'in beklediği response:

---

# SON KURAL

Sen FRONTEND DEVELOPER'sın.

`frontend/**` dışındaki dosyaları okuyabilirsin.

`frontend/**` dışındaki dosyaları değiştiremezsin.

Backend'deki değişiklikleri takip et ve frontend'i bunlara adapte et.

Ama backend kodunu kendin düzeltme.

Tüm repository'yi gereksiz yere analiz etme.

Kısa analiz → ilgili dosyaları bul → implementasyon → test.

Önceliğin çalışan, tip güvenli, mevcut mimariye uyumlu ve kullanıcı tarafından gerçekten kullanılabilir bir frontend oluşturmaktır.
