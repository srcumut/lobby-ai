# Real-Time Lobby Chat Platform
## Technical Specification — v0.1

---

# 1. Proje Tanımı

Bu proje, kullanıcıların konu veya ilgi alanlarına göre oluşturulmuş lobilere katılarak gerçek zamanlı olarak sohbet edebildiği, ilerleyen aşamalarda kullanıcıların kendi AI ajanlarını platforma dahil ederek insanlarla ve diğer AI ajanlarıyla aynı sohbet ortamında etkileşime girebildiği modern bir sosyal sohbet platformudur.

Platformun temel amacı yalnızca bir mesajlaşma uygulaması oluşturmak değildir.

Sistem;

- gerçek zamanlı iletişim,
- lobby/tabanlı sosyal etkileşim,
- kullanıcı ve topluluk yönetimi,
- güvenli backend mimarisi,
- ölçeklenebilir WebSocket altyapısı,
- kişiselleştirilebilir AI ajanları

üzerine kurulacaktır.

---

# 2. Temel Teknoloji Mimarisi

## Frontend

- Next.js
- TypeScript
- React
- Modern responsive UI
- WebSocket client
- REST API client

Frontend Vercel üzerinde deploy edilecektir.

## Backend

- Rust
- Axum
- Tokio
- Serde
- SQLx
- WebSocket
- JWT veya güvenli session tabanlı authentication

Backend VPS üzerinde Docker kullanılarak çalıştırılacaktır.

## Database

- PostgreSQL

Başlangıçta SQLite kullanılmayacaktır.

Bunun nedeni sistemin gerçek zamanlı ve çok kullanıcılı yapısının ileride PostgreSQL'in concurrency ve production özelliklerinden faydalanacak olmasıdır.

## Cache / Real-Time Infrastructure

- Redis

Redis başlangıç MVP'sinde zorunlu değildir.

Ancak aşağıdaki özellikler için ilerleyen aşamalarda kullanılacaktır:

- presence
- rate limiting
- WebSocket pub/sub
- temporary lobby state
- distributed events

## Reverse Proxy

- Nginx

Nginx;

- HTTPS termination
- reverse proxy
- WebSocket forwarding
- basic security headers

için kullanılacaktır.

## Deployment

Frontend:

Next.js → Vercel

Backend:

Rust/Axum → VPS

Database:

PostgreSQL

Infrastructure:

Docker / Docker Compose

---

# 3. Genel Sistem Mimarisi

```text
                         INTERNET
                            │
                            ▼
                   ┌─────────────────┐
                   │     Vercel      │
                   │ Next.js Client  │
                   └────────┬────────┘
                            │
                   HTTPS / WebSocket
                            │
                            ▼
                   ┌─────────────────┐
                   │      Nginx      │
                   │ Reverse Proxy   │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   Rust / Axum   │
                   │   Application   │
                   └───────┬─────────┘
                           │
             ┌─────────────┼──────────────┐
             │             │              │
             ▼             ▼              ▼
       PostgreSQL       Redis          AI Providers
                                        │
                              ┌─────────┼─────────┐
                              ▼         ▼         ▼
                           OpenAI    Gemini   Anthropic
```

---

# 4. Temel Tasarım İlkeleri

Projede aşağıdaki prensiplere uyulacaktır.

## 4.1 Separation of Concerns

Frontend, backend, database ve infrastructure birbirinden ayrılacaktır.

Frontend içerisinde backend iş mantığı bulunmayacaktır.

Backend içerisinde UI mantığı bulunmayacaktır.

Database erişimi doğrudan route handler içerisinden yapılmayacaktır.

---

## 4.2 Layered Architecture

Backend aşağıdaki mantıksal katmanlara ayrılacaktır:

```text
HTTP / WebSocket
       ↓
Handlers
       ↓
Services
       ↓
Repositories
       ↓
Database
```

Örnek:

```text
POST /api/lobbies
        ↓
LobbyHandler
        ↓
LobbyService
        ↓
LobbyRepository
        ↓
PostgreSQL
```

---

# 5. Backend Modülleri

Rust backend başlangıçta aşağıdaki modüllere ayrılacaktır:

```text
backend/
├── src/
│   ├── main.rs
│   ├── config/
│   ├── state/
│   ├── routes/
│   ├── handlers/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── schemas/
│   ├── middleware/
│   ├── auth/
│   ├── websocket/
│   ├── errors/
│   ├── ai/
│   └── utils/
│
├── migrations/
├── tests/
├── Cargo.toml
├── Dockerfile
└── .env.example
```

Bu yapı ihtiyaçlara göre zaman içerisinde değiştirilebilir.

Ama başlangıçtan itibaren bütün kodu `main.rs` veya birkaç büyük dosya içerisinde toplamak yasaktır.

---

# 6. Frontend Yapısı

Önerilen yapı:

```text
frontend/
├── app/
│   ├── login/
│   ├── register/
│   ├── lobbies/
│   ├── lobby/[id]/
│   ├── profile/
│   └── settings/
│
├── components/
│   ├── auth/
│   ├── lobby/
│   ├── chat/
│   ├── user/
│   └── ui/
│
├── lib/
│   ├── api/
│   ├── websocket/
│   ├── auth/
│   └── utils/
│
├── hooks/
├── types/
└── public/
```

---

# 7. Fazlar

Proje kesin olarak üç ana faza ayrılacaktır.

---

# PHASE 1 — CORE REAL-TIME CHAT

Amaç, platformun temel ve sağlam çalışan chat altyapısını oluşturmaktır.

## Authentication

Kullanıcılar:

- register
- login
- logout

işlemlerini gerçekleştirebilir.

Temel kullanıcı bilgileri:

```text
id
username
email
password_hash
display_name
avatar
created_at
updated_at
```

Password hiçbir zaman plaintext olarak tutulmayacaktır.

---

# 8. Lobby Sistemi

Kullanıcılar public lobby oluşturabilir.

Her lobby:

```text
id
name
description
owner_id
visibility
created_at
updated_at
```

alanlarına sahip olacaktır.

Visibility:

```text
PUBLIC
PRIVATE
```

olarak tasarlanacaktır.

Phase 1'de öncelikli olarak PUBLIC lobby sistemi uygulanacaktır.

---

# 9. Lobby Membership

Kullanıcının bir lobby içerisindeki üyeliği ayrı bir entity olarak tutulacaktır.

```text
lobby_members
----------------
lobby_id
user_id
role
joined_at
```

Başlangıç roller:

```text
OWNER
MEMBER
```

İleride:

```text
MODERATOR
ADMIN
```

eklenebilir.

---

# 10. Real-Time Messaging

Chat sistemi WebSocket kullanacaktır.

Temel akış:

```text
Client
  │
  │ WebSocket connection
  ▼
Rust WebSocket Handler
  │
  ▼
Lobby Connection Manager
  │
  ├── User A
  ├── User B
  ├── User C
  └── User D
```

Bir kullanıcı mesaj gönderdiğinde:

```text
User A
  ↓
WebSocket
  ↓
Rust
  ↓
Message validation
  ↓
Database
  ↓
Lobby broadcast
  ↓
User B / C / D
```

Mesaj önce doğrulanacak, ardından kalıcı olarak database'e yazılacak ve başarılı kayıt işleminden sonra lobby üyelerine yayınlanacaktır.

---

# 11. Message Entity

```text
messages
----------------
id
lobby_id
sender_id
content
created_at
updated_at
deleted_at
```

Mesajlar fiziksel olarak silinmek yerine soft-delete destekleyecektir.

---

# 12. Presence

Kullanıcının:

```text
ONLINE
IDLE
OFFLINE
```

durumu desteklenecektir.

Phase 1'de basit memory tabanlı implementation yapılabilir.

Redis entegrasyonu Phase 2/3 içerisinde değerlendirilecektir.

---

# 13. Phase 1 UI

Ana ekran:

```text
┌────────────────────────────────────────────┐
│                    HEADER                  │
├──────────────┬─────────────────────────────┤
│              │                             │
│   LOBBIES    │        CHAT                 │
│              │                             │
│ # General    │ User: Hello                │
│ # Gaming     │ User: Hi!                  │
│ # Rust       │ User: How are you?         │
│ # Science    │                             │
│              │                             │
│              ├─────────────────────────────┤
│              │ Message...           [Send] │
└──────────────┴─────────────────────────────┘
```

---

# PHASE 2 — SOCIAL PLATFORM

Phase 1 stabil hale geldikten sonra sosyal özellikler geliştirilecektir.

## Private Lobbies

Kullanıcılar private lobby oluşturabilir.

Private lobby'lere yalnızca:

- invitation
- authorized membership

üzerinden erişilebilir.

---

# 14. Moderation

Lobby owner/moderator aşağıdaki işlemleri gerçekleştirebilir:

- kick
- mute
- ban
- delete message

Ayrıca kullanıcılar mesajları report edebilir.

---

# 15. Rate Limiting

Backend aşağıdaki saldırı/abuse türlerine karşı korunacaktır:

- spam
- brute force login
- excessive API requests
- message flooding
- WebSocket abuse

Örneğin:

```text
POST /login
       ↓
Rate Limiter
       ↓
Too many attempts
       ↓
429 Too Many Requests
```

Limitler merkezi configuration üzerinden yönetilecektir.

---

# 16. Reactions

Mesajlara reaction eklenebilecektir.

Örneğin:

```text
👍 12
😂 5
❤️ 8
```

Reaction sistemi ileride notification sistemi ile entegre edilebilir.

---

# 17. Notifications

Sistem:

- lobby invitation
- mention
- reaction
- moderation action

gibi olaylar için notification üretebilir.

---

# 18. User Profiles

Profil sistemi:

```text
username
display_name
avatar
bio
created_at
online status
```

bilgilerini içerecektir.

Kullanıcıların kişisel bilgileri gereksiz yere public edilmeyecektir.

---

# 19. PHASE 3 — AI AGENT ECOSYSTEM

Projenin en önemli farklılaştırıcı özelliği.

Kullanıcılar kendi AI provider hesaplarını kullanarak platforma AI ajanları bağlayabilecektir.

---

# 20. AI Provider Abstraction

Backend provider bağımlılığını azaltmak için ortak bir abstraction kullanılacaktır.

Mantıksal yapı:

```text
AIProvider
    │
    ├── OpenAIProvider
    ├── GeminiProvider
    ├── AnthropicProvider
    └── FutureProvider
```

Backend belirli bir provider'a doğrudan bağımlı olmayacaktır.

---

# 21. API Key Security

Kullanıcı API key'i frontend'de kalıcı plaintext olarak tutulmayacaktır.

Akış:

```text
User
 ↓
HTTPS
 ↓
Rust Backend
 ↓
Encryption
 ↓
Secure Storage
 ↓
AI Provider
```

API key hiçbir zaman:

- loglara
- analytics'e
- frontend response'larına
- error mesajlarına

plaintext olarak yazılmayacaktır.

Encryption key uygulama secret'larından ayrı tutulacaktır.

---

# 22. AI Agent Entity

Her AI agent bir kullanıcıya ait olacaktır.

Temel model:

```text
agents
----------------
id
owner_id
name
provider
model
personality_config
interest_config
communication_config
behavior_config
custom_instructions
created_at
updated_at
```

API key doğrudan agent tablosunda plaintext tutulmayacaktır.

---

# 23. Agent Personality System

Kullanıcı AI oluştururken çeşitli seçenekler belirleyebilir.

## Personality

Örnek:

```text
HAPPY
CALM
CURIOUS
SERIOUS
SARCASTIC
PHILOSOPHICAL
ENERGETIC
MELANCHOLIC
```

Birden fazla personality seçilebilir.

---

# 24. Interests

Örnek:

```text
TECHNOLOGY
SCIENCE
PHILOSOPHY
GAMING
MOVIES
MUSIC
HISTORY
PSYCHOLOGY
```

Kullanıcı birden fazla ilgi alanı seçebilir.

---

# 25. Communication Style

Örnek:

```text
CASUAL
FORMAL
HUMOROUS
CONCISE
DETAILED
DEBATE_ORIENTED
```

---

# 26. Behavior Settings

Kullanıcı davranış kuralları belirleyebilir.

Örneğin:

```text
ASK_QUESTIONS
CHALLENGE_USER
EXPLAIN_DEEPLY
USE_HUMOR
ENCOURAGE_DISCUSSION
AVOID_LONG_RESPONSES
```

---

# 27. Custom Instructions

Kullanıcı kendi özel talimatını yazabilir.

Örneğin:

```text
Kullanıcının düşüncelerini körü körüne kabul etme.
Gerektiğinde karşı argüman sun.
Teknik konularda örnekler kullan.
```

Bu alan güvenlik ve prompt injection kontrollerinden geçirilecektir.

---

# 28. Prompt Builder

Kullanıcı seçimleri doğrudan modele gönderilmeyecektir.

Bunun yerine backend'de:

```text
Agent Configuration
        ↓
Prompt Builder
        ↓
System Prompt
        ↓
AI Provider
```

akışı kullanılacaktır.

Örneğin:

```text
Personality:
Curious, energetic

Interests:
Technology, Science, Philosophy

Communication:
Casual, detailed

Behavior:
Ask questions
Challenge assumptions

Custom Instructions:
...
```

sistem tarafından standart bir system prompt yapısına dönüştürülecektir.

---

# 29. Agent Test Mode

Kullanıcı oluşturduğu AI agent'ı lobby'e sokmadan önce test edebilir.

Örneğin:

```text
Agent: Nova

Personality:
Curious + Energetic

Interests:
Science + Philosophy

Communication:
Casual

----------------------------

User:
Why do humans dream?

Nova:
...
```

Kullanıcı memnun kalana kadar agent ayarlarını değiştirebilir.

---

# 30. AI'ın Lobby Katılımcısı Olması

AI agent normal bir lobby participant gibi davranacaktır.

Örneğin:

```text
# Philosophy

Umut
Ahmet
Mehmet
Nova 🤖
```

AI yalnızca kullanıcı tarafından açıkça çağrıldığında cevap verebilir.

Örneğin:

```text
@Nova Do you think free will exists?
```

AI:

```text
Nova:
That's an interesting question...
```

---

# 31. AI Context

AI cevap üretirken yalnızca son mesajı değil, uygun miktarda conversation context'i kullanacaktır.

Mantıksal yapı:

```text
System Prompt
      +
Agent Personality
      +
Relevant Memory
      +
Recent Messages
      +
Current User Message
      ↓
AI Provider
```

Context uzunluğu provider/model limitlerine göre yönetilecektir.

---

# 32. Agent Memory

İlerleyen aşamada AI ajanlarının kullanıcıyla ilgili önemli bilgileri hatırlaması sağlanabilir.

Örneğin:

```text
User likes Rust.
User is interested in philosophy.
User is working on a software project.
```

Memory sistemi ayrı bir entity olarak tasarlanacaktır.

```text
agent_memories
----------------
id
agent_id
user_id
content
importance
created_at
updated_at
```

Her mesaj memory'ye dönüştürülmeyecektir.

Memory extraction ayrı bir süreç olacaktır.

---

# 33. AI Maliyet Kontrolü

Kullanıcı kendi API key'ini kullandığı için AI kullanım maliyeti platform tarafından doğrudan karşılanmayacaktır.

Ancak platform:

- request count
- token usage
- errors
- latency

gibi metadata'ları takip edebilir.

API key'in kendisi hiçbir şekilde analytics içerisinde tutulmayacaktır.

---

# 34. Database Ana Yapısı

Başlangıçta öngörülen temel tablolar:

```text
users
sessions
lobbies
lobby_members
messages
reports
bans
notifications
agents
ai_credentials
agent_memories
```

İleride:

```text
message_reactions
lobby_invitations
roles
permissions
audit_logs
```

eklenebilir.

---

# 35. Authentication

Authentication sistemi güvenlik öncelikli tasarlanacaktır.

Parola:

```text
plaintext password
        ↓
Argon2id
        ↓
password hash
        ↓
database
```

JWT kullanılacaksa:

```text
Access Token
Refresh Token
```

ayrımı yapılacaktır.

Token secret'ları source code içerisinde tutulmayacaktır.

---

# 36. API Tasarım İlkeleri

API RESTful prensiplere mümkün olduğunca uyacaktır.

Örnek:

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/users/me

GET    /api/lobbies
POST   /api/lobbies

GET    /api/lobbies/:id
POST   /api/lobbies/:id/join
POST   /api/lobbies/:id/leave

GET    /api/lobbies/:id/messages
DELETE /api/messages/:id
```

WebSocket:

```text
/ws/lobbies/:lobby_id
```

AI:

```text
GET    /api/agents
POST   /api/agents
GET    /api/agents/:id
PATCH  /api/agents/:id
DELETE /api/agents/:id

POST   /api/agents/:id/test
POST   /api/agents/:id/connect
```

Endpoint isimleri ve response formatları proje boyunca tutarlı olacaktır.

---

# 37. WebSocket Event Protocol

WebSocket mesajları rastgele string formatında olmayacaktır.

JSON tabanlı event protocol kullanılacaktır.

Örnek:

```json
{
  "type": "message.created",
  "payload": {
    "id": "message-id",
    "lobby_id": "lobby-id",
    "sender": {
      "id": "user-id",
      "username": "umut"
    },
    "content": "Hello world",
    "created_at": "..."
  }
}
```

Event tipleri:

```text
message.created
message.updated
message.deleted

user.joined
user.left

presence.updated

reaction.added
reaction.removed

lobby.updated

notification.created

agent.message
```

---

# 38. Error Handling

Backend bütün hataları standart bir response formatında döndürecektir.

Örneğin:

```json
{
  "error": {
    "code": "LOBBY_NOT_FOUND",
    "message": "Lobby not found."
  }
}
```

Internal error detayları production ortamında kullanıcıya gösterilmeyecektir.

Rust içerisinde merkezi error handling sistemi kullanılacaktır.

---

# 39. Logging

Loglar:

```text
INFO
WARN
ERROR
DEBUG
```

seviyelerine ayrılacaktır.

Aşağıdaki bilgiler loglanmayacaktır:

- password
- API key
- access token
- refresh token
- private user data

Production logging structured format kullanacak şekilde tasarlanacaktır.

---

# 40. Environment Configuration

Secret değerleri source code'a yazılmayacaktır.

Örnek:

```text
DATABASE_URL=
JWT_SECRET=
ENCRYPTION_KEY=
REDIS_URL=
OPENAI_API_URL=
```

`.env` repository'ye commit edilmeyecektir.

Repository'de:

```text
.env.example
```

bulunacaktır.

---

# 41. Docker

Production deployment Docker üzerinden yapılacaktır.

Backend için multi-stage build kullanılacaktır.

Mantıksal yapı:

```text
Rust Builder
     ↓
cargo build --release
     ↓
Minimal Runtime Image
     ↓
Rust Binary
```

Development ve production container yapılandırmaları gerektiğinde ayrılacaktır.

---

# 42. VPS Deployment

VPS üzerinde:

```text
Ubuntu
   ↓
Docker
   ↓
Docker Compose
   ├── backend
   ├── postgres
   ├── redis
   └── nginx
```

kullanılacaktır.

Frontend Vercel'de bulunacaktır.

---

# 43. CI/CD

GitHub repository kullanılacaktır.

Ana branch'e uygun bir değişiklik geldiğinde:

```text
GitHub
   ↓
Tests
   ↓
Build
   ↓
Docker Image
   ↓
VPS Deployment
```

pipeline'ı oluşturulacaktır.

CI/CD Phase 1'in sonuna veya Phase 2 başlangıcına bırakılabilir.

---

# 44. Testing

Backend:

- unit tests
- integration tests
- API tests
- WebSocket tests

içerecektir.

Özellikle kritik sistemler test edilmeden production'a alınmayacaktır:

```text
Authentication
Authorization
Lobby membership
Messaging
Rate limiting
AI credentials
AI requests
```

---

# 45. Security Requirements

Minimum güvenlik gereksinimleri:

- HTTPS
- secure password hashing
- authentication
- authorization
- rate limiting
- input validation
- SQL injection protection
- XSS protection
- CSRF değerlendirmesi
- WebSocket authentication
- API key encryption
- secure headers
- secret management
- audit logging

Kullanıcıdan gelen hiçbir veri güvenilir kabul edilmeyecektir.

---

# 46. Authorization

Authentication:

> "Bu kullanıcı kim?"

Authorization:

> "Bu kullanıcı bunu yapmaya yetkili mi?"

olarak ayrı değerlendirilecektir.

Örneğin:

```text
User A
 ↓
DELETE /messages/123
 ↓
Message belongs to User B
 ↓
Permission check
 ↓
403 Forbidden
```

---

# 47. MVP İlkesi

Her özellik ilk versiyona dahil edilmeyecektir.

Öncelik:

```text
WORKING
    ↓
CORRECT
    ↓
SECURE
    ↓
TESTED
    ↓
OPTIMIZED
```

olacaktır.

Erken aşamada gereksiz microservice mimarisi kullanılmayacaktır.

Backend başlangıçta **modular monolith** olacaktır.

---

# 48. Modular Monolith

İlk sürüm:

```text
                 Rust Application
                       │
       ┌───────────────┼────────────────┐
       │               │                │
     Auth            Lobby            Chat
       │               │                │
       └───────────────┼────────────────┘
                       │
                    Database
```

şeklinde olacaktır.

AI geldiğinde:

```text
Rust Application
       │
       ├── Auth
       ├── Lobby
       ├── Chat
       ├── Moderation
       └── AI
```

olarak genişleyecektir.

Başlangıçta ayrı AI server, ayrı chat server vb. oluşturulmayacaktır.

---

# 49. Ölçeklenebilirlik Stratejisi

İlk hedef:

```text
1 VPS
1 Rust backend
1 PostgreSQL
1 Redis
```

olacaktır.

Kullanıcı sayısı büyüdüğünde:

```text
Load Balancer
      ↓
Rust Instance 1
Rust Instance 2
Rust Instance 3
      ↓
Redis Pub/Sub
      ↓
PostgreSQL
```

mimarisine geçilebilecek şekilde kod tasarlanacaktır.

Bu nedenle WebSocket state'inin yalnızca process memory'sine bağlı kalması ileride problem oluşturmayacak şekilde abstraction yapılacaktır.

---

# 50. İlk Sürümde Yapılmayacaklar

Aşağıdaki özellikler MVP dışında tutulacaktır:

- Voice chat
- Video chat
- File sharing
- End-to-end encryption
- Mobile application
- Advanced AI memory
- Multiple AI agents per lobby
- AI-to-AI conversations
- Payment system
- Subscription system
- Microservice architecture

Bunlar gelecekte değerlendirilebilir.

---

# 51. Proje Geliştirme Sırası

Önerilen sıra:

```text
1. Repository setup
        ↓
2. Docker development environment
        ↓
3. PostgreSQL
        ↓
4. Rust / Axum skeleton
        ↓
5. Configuration system
        ↓
6. Database migrations
        ↓
7. Authentication
        ↓
8. User system
        ↓
9. Lobby system
        ↓
10. WebSocket
        ↓
11. Messaging
        ↓
12. Presence
        ↓
13. Frontend integration
        ↓
14. Testing
        ↓
15. Docker production build
        ↓
16. VPS deployment
        ↓
17. Phase 1 completion
```

Sonrasında Phase 2 ve Phase 3'e geçilecektir.

---

# 52. Kodlama Standartları

Kod:

- okunabilir
- modüler
- test edilebilir
- açık isimlendirilmiş
- gereksiz abstraction içermeyen

bir yapıda olacaktır.

Repository, class, function, variable ve module isimlerinde İngilizce kullanılacaktır.

Örnek:

```text
LobbyService
MessageRepository
AgentProfile
create_lobby()
get_lobby_members()
broadcast_message()
```

Türkçe değişken ve dosya isimleri kullanılmayacaktır.

---

# 53. Git Workflow

Branch yapısı:

```text
main
develop
feature/*
fix/*
refactor/*
```

Örnek:

```text
feature/realtime-chat
feature/ai-agent-system
fix/websocket-auth
```

Commit mesajları anlaşılır ve standart formatta tutulacaktır.

Örnek:

```text
feat: add lobby creation
feat: implement websocket messaging
fix: validate lobby membership
refactor: separate message service
```

---

# 54. Definition of Done

Bir özellik tamamlanmış sayılmadan önce:

- implementation tamamlanmış
- validation eklenmiş
- authorization kontrol edilmiş
- error handling eklenmiş
- testleri yazılmış
- frontend entegrasyonu tamamlanmış
- documentation güncellenmiş

olmalıdır.

---

# 55. Phase Completion Criteria

## Phase 1 tamamlandı

şu senaryo tamamen çalışmalıdır:

```text
User registers
      ↓
User logs in
      ↓
User sees lobbies
      ↓
User joins lobby
      ↓
WebSocket connection
      ↓
User sends message
      ↓
Other users receive message instantly
      ↓
Message persists in PostgreSQL
      ↓
User leaves lobby
```

---

## Phase 2 tamamlandı

kullanıcı:

```text
profile
private lobby
invitation
moderation
reaction
notification
presence
```

özelliklerini kullanabilmelidir.

---

## Phase 3 tamamlandı

kullanıcı:

```text
Connect AI provider
       ↓
Create Agent
       ↓
Choose personality
       ↓
Choose interests
       ↓
Choose communication style
       ↓
Add custom instructions
       ↓
Test Agent
       ↓
Enter Lobby
       ↓
@Agent
       ↓
AI participates in conversation
```

akışını tamamlayabilmelidir.

---

# 56. Ürün Vizyonu

Platformun uzun vadeli vizyonu:

> İnsanların ortak ilgi alanları etrafında gerçek zamanlı olarak sosyalleşebildiği ve kişiselleştirilmiş AI ajanlarını bu sosyal ortamlara dahil edebildiği hibrit bir insan + AI iletişim platformu oluşturmak.

AI sisteminin amacı insan sohbetinin yerini almak değil, sohbeti genişletmek ve yeni etkileşim biçimleri oluşturmaktır.

---

# 57. Temel Mimari Karar

Projenin ilk versiyonunda:

```text
Frontend
Next.js
   ↓
Vercel

Backend
Rust + Axum
   ↓
Docker
   ↓
VPS

Database
PostgreSQL

Realtime
WebSocket

Cache / PubSub
Redis

Reverse Proxy
Nginx

AI
User-owned API Keys
```

kullanılacaktır.

Mimari gereksiz şekilde karmaşıklaştırılmayacaktır.

---

# 58. Kritik Tasarım Prensibi

Bu proje bir "demo application" gibi geliştirilmeyecektir.

Kod üretirken:

> "Şu an çalışsın yeter."

yaklaşımı yerine:

> "Bu özellik production ortamında nasıl güvenli, test edilebilir ve sürdürülebilir şekilde çalışır?"

yaklaşımı kullanılacaktır.

Ancak aynı zamanda erken aşamada gereksiz enterprise complexity oluşturulmayacaktır.

Temel hedef:

**Simple architecture + strong fundamentals + clear separation of concerns.**