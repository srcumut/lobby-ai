# Lobby AI v2 — Computer Avatar Upload & Interactive Cropper

Bu dizin (`v2/`), kullanıcının belirttiği şu gereksinimi karşılamak üzere hazırlanmış tam ve eksiksiz geliştirme paketidir:

> **Görev:** Projeye kullanıcıların ve ajanlara avatar ekleme özelliği koymak (resim linki koymak yerine bilgisayardan ilgili resmi seçebilme, zoom in / zoom out yapabilme, görseli hareket ettirip/kaydırıp kırpabilme) ve tüm geliştirmeleri `lobby-ai/v2` dizininde konumlandırıp diğer yapay zekanın veya kullanıcının kolayca ana projeyle birleştirebileceği dosya yapısı ve işaretler bırakmak.

---

## 🚀 Neler Geliştirildi?

### 1. Frontend: Bilgisayardan Resim Yükleme & İnteraktif Avatar Kırpıcı (Cropper)
- **Bilgisayardan Dosya Seçimi:** Kullanıcılar ister yerel bilgisayarlarından dosya seçici ile, ister sürükle-bırak (Drag & Drop) ile `PNG`, `JPG`, `WebP`, `GIF` formatındaki görselleri yükleyebilir.
- **Zoom In / Zoom Out:**
  - `+` ve `-` butonları ile yakınlaştırma/uzaklaştırma.
  - Hassas Zoom Slider (1.0x – 4.0x aralığı).
  - Görsel üzerinde fare tekerleği (Mouse Wheel) ile doğal yakınlaştırma/uzaklaştırma.
  - Dokunmatik ekranlar için pinch-to-zoom desteği.
- **Pan / Görseli Taşıma:**
  - Fare veya dokunmatik yüzeyle görseli tıklayıp sürükleyerek (`cursor-grab` / `cursor-grabbing`) çerçevenin tam ortalamak istediğiniz kısmını ayarlayabilme.
  - Sınır kontrolü (Bounding Box): Daire boşlukta kalmayacak şekilde otomatik kısıtlama.
- **Canlı Önizleme & Maske:**
  - Neo-Brutalist tasarım diline uygun dairesel kesim kılavuzu ve dış alan karartma maskesi.
  - Gerçek zamanlı avatar önizleme simgesi.
  - "Sıfırla" (Reset) butonu ile zoom ve konumu varsayılana getirme.
- **Yüksek Çözünürlüklü Canvas Export:**
  - Kullanıcının seçtiği zoom ve konum verileriyle 512x512 piksel yüksek çözünürlüklü HTML5 Canvas üzerinde işlenir ve optimize edilmiş WebP/PNG `File` formatına dönüştürülür.
- **Kullanıcı Profili Entegrasyonu (`src/app/profile/page.tsx`):**
  - Eski salt link kutucuğu yerine doğrudan bilgisayardan resim seçme, kırpma ve kaydetme bileşeni yerleştirildi.
  - Profil resmi kaldırma (Reset) desteği eklendi.
- **Yapay Zeka Ajanları Entegrasyonu:**
  - **Ajan Oluşturucu (`src/app/agents/builder/page.tsx`):** Ajan yaratırken bilgisayardan avatar yükleme, zoom/pan yapma ve ajanla birlikte kaydetme.
  - **Ajan Düzenleyici (`src/app/agents/[id]/edit/page.tsx`):** Mevcut ajanın avatarını bilgisayardan güncelleme veya silme.
  - **Ajan Kartları (`src/app/agents/page.tsx`):** Özel ajan avatarlarını kart başlığında görüntüleme.
  - **Lobi Üye Listesi (`src/components/lobby/MembersList.tsx`):** Hem insanlar hem de yapay zeka ajanları için gerçek avatar görsellerini görüntüleme.
  - **Lobi Mesaj Alanı (`src/app/lobby/[id]/page.tsx`):** Canlı sohbette mesajların yanında kullanıcı ve bot avatarlarını gösterme.

---

### 2. Backend: Multipart Dosya Yükleme & Güvenli Depolama
- **Axum 0.8 Multipart Entegrasyonu:** `Cargo.toml` içerisine `multipart` ve `tower-http/fs` özellikleri eklendi.
- **MIME Türü ve Boyut Doğrulama:** Sadece güvenli görsel formatlarına izin verilir (MIME ve uzantı eşleşmesi). Maksimum 5 MB dosya boyutu sınırı konuldu (CWE-434 koruması).
- **Güvenli Dosya İsimlendirme:** Orijinal dosya adı yerine rastgele `UUID v4` isimler kullanılarak path traversal (CWE-22) ve isim çakışmaları engellendi.
- **Statik Dosya Sunumu:** Yüklenen avatarlar `uploads/avatars/` dizininde saklanır ve `/api/uploads/avatars/{filename}` ile `/uploads/avatars/{filename}` üzerinden hem doğrudan hem de Nginx arkasından sorunsuz servis edilir.
- **REST Uç Noktaları:**
  - `POST /api/uploads/avatar`: Genel multipart avatar yükleme (kullanıcı ve ajan oluşturma için).
  - `POST /api/users/me/avatar`: Oturum açmış kullanıcının profil resmini doğrudan yükleyip günceller.
  - `DELETE /api/users/me/avatar`: Profil resmini sıfırlar.
  - `POST /api/ai/agents/{id}/avatar`: Sahip olunan ajanın profil resmini doğrudan yükleyip günceller.
  - `DELETE /api/ai/agents/{id}/avatar`: Ajanın profil resmini sıfırlar.
- **Veritabanı & Model Entegrasyonu:**
  - Ajanlar `users` tablosundaki `is_bot = true` kayıtlarıyla eşleşir; `ai_service` ajan oluştururken ve güncellerken bot kullanıcısının `avatar_url` alanını yönetir.
  - `Agent` modeline `avatar_url` ve `username` alanları eklendi.

---

## 📂 Dosya Yerleşim Rehberi (Target File Mapping)

Tüm dosyaların en başında `TARGET_DESTINATION` açıklaması bulunmaktadır. Aşağıdaki tabloda `v2` içerisindeki her dosyanın ana projede nereye yerleşeceği belirtilmiştir:

| v2 Kaynak Dosyası | Ana Projedeki Hedef Dosya | Eylem | Açıklama |
|---|---|---|---|
| `v2/backend/Cargo.toml` | `backend/Cargo.toml` | Güncelle | `axum` multipart ve `tower-http` fs özellikleri |
| `v2/backend/src/main.rs` | `backend/src/main.rs` | Güncelle | `uploads/avatars` dizini oluşturma ve sunumu |
| `v2/backend/src/routes/mod.rs` | `backend/src/routes/mod.rs` | Güncelle | Upload rotaları ve statik dosya ServeDir |
| `v2/backend/src/routes/upload_routes.rs` | `backend/src/routes/upload_routes.rs` | **YENİ** | `/api/uploads/avatar` rota tanımı |
| `v2/backend/src/routes/user_routes.rs` | `backend/src/routes/user_routes.rs` | Güncelle | `/api/users/me/avatar` rotaları |
| `v2/backend/src/routes/ai_routes.rs` | `backend/src/routes/ai_routes.rs` | Güncelle | `/api/ai/agents/{id}/avatar` rotaları |
| `v2/backend/src/handlers/mod.rs` | `backend/src/handlers/mod.rs` | Güncelle | `upload_handler` modül tanımı |
| `v2/backend/src/handlers/upload_handler.rs` | `backend/src/handlers/upload_handler.rs` | **YENİ** | Multipart avatar yükleme işleyicisi |
| `v2/backend/src/handlers/user_handler.rs` | `backend/src/handlers/user_handler.rs` | Güncelle | Kullanıcı avatar yükleme/silme işleyicileri |
| `v2/backend/src/handlers/ai_handler.rs` | `backend/src/handlers/ai_handler.rs` | Güncelle | Ajan avatar yükleme/silme işleyicileri |
| `v2/backend/src/models/ai.rs` | `backend/src/models/ai.rs` | Güncelle | `Agent` modeline `avatar_url` ve `username` |
| `v2/backend/src/schemas/ai.rs` | `backend/src/schemas/ai.rs` | Güncelle | `CreateAgentRequest` ve `UpdateAgentRequest` |
| `v2/backend/src/services/mod.rs` | `backend/src/services/mod.rs` | Güncelle | `upload_service` modül tanımı |
| `v2/backend/src/services/upload_service.rs` | `backend/src/services/upload_service.rs` | **YENİ** | Dosya doğrulama, kaydetme mantığı |
| `v2/backend/src/services/ai_service.rs` | `backend/src/services/ai_service.rs` | Güncelle | Ajan avatar sorgulama ve güncelleme |
| `v2/backend/src/services/user_service.rs` | `backend/src/services/user_service.rs` | Güncelle | Kullanıcı avatar güncelleme servisi |
| `v2/backend/src/repositories/user_repository.rs` | `backend/src/repositories/user_repository.rs` | Güncelle | `update_avatar` SQL sorgusu |
| `v2/frontend/src/lib/avatar.ts` | `frontend/src/lib/avatar.ts` | **YENİ** | Dev/Prod avatar URL çözümleyici yardımcısı |
| `v2/frontend/src/components/avatar/AvatarCropperModal.tsx` | `frontend/src/components/avatar/AvatarCropperModal.tsx` | **YENİ** | Zoom, pan ve kırpma modalı |
| `v2/frontend/src/components/avatar/AvatarPicker.tsx` | `frontend/src/components/avatar/AvatarPicker.tsx` | **YENİ** | Yeniden kullanılabilir Avatar Seçici bileşeni |
| `v2/frontend/src/lib/api/uploads.ts` | `frontend/src/lib/api/uploads.ts` | **YENİ** | Upload API istemcisi |
| `v2/frontend/src/lib/api/users.ts` | `frontend/src/lib/api/users.ts` | Güncelle | `uploadAvatar` ve `deleteAvatar` fonksiyonları |
| `v2/frontend/src/lib/api/ai.ts` | `frontend/src/lib/api/ai.ts` | Güncelle | `uploadAgentAvatar` ve `deleteAgentAvatar` |
| `v2/frontend/src/types/ai.ts` | `frontend/src/types/ai.ts` | Güncelle | `avatar_url` arayüz alanları |
| `v2/frontend/src/app/profile/page.tsx` | `frontend/src/app/profile/page.tsx` | Güncelle | Bilgisayardan yükleme & kırpıcı entegrasyonu |
| `v2/frontend/src/app/agents/builder/page.tsx` | `frontend/src/app/agents/builder/page.tsx` | Güncelle | Ajan oluşturucu avatar seçici |
| `v2/frontend/src/app/agents/[id]/edit/page.tsx` | `frontend/src/app/agents/[id]/edit/page.tsx` | Güncelle | Ajan düzenleyici avatar seçici |
| `v2/frontend/src/app/agents/page.tsx` | `frontend/src/app/agents/page.tsx` | Güncelle | Ajan kartlarında avatar gösterimi |
| `v2/frontend/src/components/lobby/MembersList.tsx` | `frontend/src/components/lobby/MembersList.tsx` | Güncelle | İnsan ve ajan avatarlarının listelenmesi |
| `v2/frontend/src/app/lobby/[id]/page.tsx` | `frontend/src/app/lobby/[id]/page.tsx` | Güncelle | Sohbette kullanıcı/bot avatar gösterimi |

---

## ⚡ Otomatik Birleştirme (Merging)

Diğer yapay zeka veya siz hazır olduğunuzda, `v2` dosyalarını tek bir komutla ana projeye kopyalayabilirsiniz:

### Windows PowerShell ile:
```powershell
cd c:\Users\Umut\Desktop\lobby-ai\v2
.\merge.ps1
```

### Linux / macOS / Git Bash ile:
```bash
cd c/Users/Umut/Desktop/lobby-ai/v2
bash merge.sh
```

---

## 🔒 Güvenlik & Mimari Notları
1. **İlişkisel Bütünlük:** Ajanlar zaten `users` tablosundaki bir `is_bot = true` kullanıcısına referans vermektedir. Avatar verisi tek bir yerde (`users.avatar_url`) tutulur ve `agents` sorgularında JOIN edilir. Bu sayede veritabanında gereksiz çift kolon oluşmaz ve sohbette, lobide veya profilde bot avatarı anında görünür.
2. **Güvenli Dosya İsimlendirme:** `Uuid::new_v4()` ile isimlendirilen dosyalar sayesinde dosya üzerine yazma veya zararlı dosya adı enjeksiyonları imkansız kılınmıştır.
3. **MIME/Boyut Koruması:** 5 MB üstü dosyalar ve görsel olmayan formatlar sunucu tarafında anında reddedilir.
