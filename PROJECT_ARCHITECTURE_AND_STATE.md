# Lobby AI — Comprehensive Technical Architecture & Current State Specification

> **Document Purpose:** This document serves as the master architectural reference and technical specification for the **Lobby AI** repository. It is designed to allow any AI coding agent, language model, or software engineer to immediately understand the entire codebase, domain models, database schema, real-time protocols, API contracts, design constraints, and current implementation progress without ambiguity.

---

## 1. Project Overview & Vision

**Lobby AI** is a real-time, lobby-based social chat and gaming platform built on a high-performance **modular monolith** architecture. It bridges human-to-human communication with autonomous AI participants.

### Core Capabilities:
1. **Lobbies & Real-time Communication:** Users can create, discover, customize, and join public or password-protected private lobbies with sub-second message delivery.
2. **Interactive In-Lobby Experiences:** Real-time polls, live trivia challenges, 1v1 Rock-Paper-Scissors duels, dice rolls, coin flips, message reactions, and user mentions (`@username`).
3. **AI Agent Ecosystem:** Users can configure autonomous AI agents (powered by OpenAI, Gemini, Claude, etc.) with custom system prompts, knowledge, and personalities, and invite them into lobbies as first-class chat participants.
4. **Direct Messaging & Social Graph:** Friend request system, mutual friendships, private 1-on-1 direct messaging with real-time delivery and reactions.
5. **Economy & Gamification:** Daily/weekly quests, lobby coin economy, virtual shop items, badges/achievements, and level unlocks.
6. **User Identity & Customization:** 100 curated ready-to-use avatars, customizable cover banner themes, custom user taglines/status messages, and inline customization directly within profile dialogs.

---

## 2. Technology Stack & Decision Matrix

| Layer | Technologies | Rationale / Key Libraries |
| :--- | :--- | :--- |
| **Backend** | **Rust 1.80+** (Edition 2021) | High concurrency, zero-cost abstractions, memory safety, minimal latency. |
| **Web Framework** | **Axum** (`0.8.x`), **Tokio** (`1.x`) | Asynchronous request processing, native WebSocket handling, Tower middleware ecosystem. |
| **Database & ORM** | **PostgreSQL 16**, **SQLx** (`0.8.x`) | Pure compile-time SQL query safety, connection pooling, transactional migrations. No SQLite. |
| **Authentication** | **Argon2id**, **jsonwebtoken** (JWT) | Modern OWASP-recommended password hashing and stateless token auth. |
| **Frontend** | **Next.js 15/16** (App Router), **React 19** | Fast SSR, dynamic streaming, Turbopack support, modular layout structure. |
| **Language** | **TypeScript 5.x** | Strict typing across all API payloads, WS event packets, and component states. |
| **State & Data Fetching**| **TanStack React Query v5** | Server-state caching, automatic background invalidation, optimistic UI mutations. |
| **Styling & UI** | **Tailwind CSS v4**, **Vanilla CSS** | **Warm Neo-Brutalist Design System**: `#FDFBF7` paper backgrounds, solid `2px/3px/4px border-black`, hard offset shadows (`shadow-[3px_3px_0_0_#000]`), Cyber Cyan `#06B6D4`, Electric Violet `#8B5CF6`, Emerald `#10B981`. |
| **Icons & Audio** | **Lucide React**, Web Audio API | Crisp vector iconography and sound feedback effects. |
| **Infrastructure** | **Docker**, **Docker Compose**, **Nginx** | Containerized dev/prod environments with reverse proxy support. |

---

## 3. Backend Architecture & Request Flow

The backend adheres strictly to the **Modular Monolith** architecture with layered separation of concerns:

```
Incoming Request (HTTP / WebSocket)
        │
        ▼
   [Middleware] (CORS, Request Tracing, IP Rate Limiter, JWT Auth Extraction)
        │
        ▼
   [Handlers]   (src/handlers/ - Route binding, request parsing, HTTP status codes)
        │
        ▼
   [Services]   (src/services/ - Business validation, permission checks, state orchestration)
        │
        ▼
 [Repositories] (src/repositories/ - Parameterized SQLx database queries)
        │
        ▼
  [PostgreSQL]  (18 Schema Migrations, Referential Integrity)
```

### Architectural Rules:
- **No database queries in handlers:** Handlers only parse input, delegate to services, and format JSON responses.
- **Dependency Injection:** Shared application dependencies (`PgPool`, `AppConfig`, `LobbyManager`, `GlobalWsManager`, Rate Limiters) are injected via `Arc<AppState>` (`SharedState`).
- **Zero Raw Unwrap:** All fallible paths return `Result<T, AppError>`. No arbitrary `.unwrap()` or `.expect()` in production codepaths.
- **Consistent Error Structure:**
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable explanation"
    }
  }
  ```

---

## 4. Database Schema & Migration History

All migrations are located in `backend/migrations/` and run automatically on application startup.

### Active Migrations:
1. `20260910000001_create_users_table.sql`: User credentials, email, password hash, timestamps.
2. `20260910000002_create_lobbies_table.sql`: Lobby name, description, owner ID, member counts.
3. `20260910000003_create_lobby_members_table.sql`: Membership tracking with roles (`OWNER`, `MODERATOR`, `MEMBER`).
4. `20260910000004_create_messages_table.sql`: Lobby messages with foreign key to user and lobby.
5. `20260910000005_add_user_bio.sql`: User biography support.
6. `20260910000006_add_moderation_tables.sql`: Mute, kick, ban logs and `banned_users` table.
7. `20260910000007_add_private_lobbies.sql`: Lobby visibility (`PUBLIC`, `PRIVATE`), hashed room passwords.
8. `20260910000008_add_message_reactions.sql`: Emoji reaction persistence (`message_reactions`).
9. `20260910000009_add_notifications.sql`: System and social notifications table.
10. `20260911000001_add_bot_flag_to_users.sql`: `is_bot` boolean to distinguish AI accounts from humans.
11. `20260911000002_create_ai_tables.sql`: `ai_credentials` (encrypted API keys) and `ai_agents` (model configs, prompts).
12. `20260915000001_create_friend_requests_table.sql`: Friend request flow (`PENDING`, `ACCEPTED`, `REJECTED`).
13. `20260917000001_create_direct_messages_table.sql`: 1-on-1 private messaging persistence.
14. `20260917000002_add_lobby_notification_preference.sql`: Per-lobby user notification settings.
15. `20260918000001_expand_profile_and_agent_permissions.sql`: User avatar/banner URLs, display name, bot permissions.
16. `20260920000001_create_polls_tables.sql`: `polls`, `poll_options`, and `poll_votes` tables.
17. `20260921000001_add_coins_dm_reactions_and_agent_bio.sql`: User coin balances, DM reactions, and AI public biographies.
18. `20260923000001_add_lobby_customization_fields.sql`: Added `theme VARCHAR(50)`, `icon VARCHAR(50)`, `announcement VARCHAR(500)` to `lobbies`.

---

## 5. Real-Time WebSocket Protocol

WebSocket infrastructure is managed through Tokio channels (`tokio::sync::broadcast` and `mpsc`) encapsulated in `LobbyManager` and `GlobalWsManager`.

### WebSocket Endpoints:
- **Lobby Hub:** `/ws/lobbies/{lobby_id}?token={jwt_token}`
- **Global Hub:** `/ws/notifications?token={jwt_token}`

### Standard WebSocket Message Envelope:
```json
{
  "event": "message.created",
  "data": { ... }
}
```

### Event Catalog:
| Event Type | Direction | Payload Description |
| :--- | :--- | :--- |
| `message.created` | S -> C | New broadcasted chat message after DB persistence. |
| `message.updated` | S -> C | Edited message content with `is_edited: true`. |
| `message.deleted` | S -> C | Deleted message ID removed from the room. |
| `reaction.updated`| S -> C | Toggled emoji reaction count and reactors list. |
| `user.joined` | S -> C | Member joined the lobby. |
| `user.left` | S -> C | Member left the lobby. |
| `presence.updated`| S -> C | Online/offline/idle state change. |
| `typing` | Both | `{"is_typing": true/false}` indicator with debouncing. |
| `game.action` | Both | Action packets for Trivia, RPS duels, `/zar` (dice), `/yazitura` (coin flip). |
| `poll.updated` | S -> C | Live vote count update on active polls. |

---

## 6. Frontend Structure & Key Modules

Located in `frontend/src/`:

```
frontend/src/
├── app/                      # Next.js App Router pages
│   ├── agents/               # AI Agents manager & builder wizard
│   ├── community/            # Community news, public square, updates
│   ├── lobbies/              # Public lobbies discovery, search, filtering
│   ├── lobby/[id]/           # Real-time room chat, party games, polls, members
│   ├── login/ & register/    # Authentication pages
│   ├── messages/             # Direct messaging with friends
│   ├── profile/              # Comprehensive profile customizer & badges
│   ├── shop/                 # Lobby coin shop & virtual item inventory
│   ├── globals.css           # Neo-brutalist theme definitions, colors, shadows
│   └── page.tsx              # Main dashboard / landing page
├── components/
│   ├── chat/                 # Chat message bubbles, typing indicator, rich cards
│   ├── layout/               # TopBar, Sidebar, AppShell navigation
│   ├── lobby/                # LobbySettingsDialog, CreateLobbyModal, MembersList, Polls
│   ├── profile/              # UserProfileDialog (Public view + inline customizer)
│   ├── quests/               # Daily and weekly quest progression modal
│   └── ui/                   # Neo-brutalist buttons, cards, dialogs, inputs
├── lib/
│   ├── api/                  # Axios HTTP clients (auth, lobbies, users, friends, polls)
│   ├── avatar.ts             # Avatar URL and banner theme style resolver
│   ├── lobbyThemes.ts        # 6 Neo-brutalist lobby color schemes & 12 icons
│   ├── readyAvatars.ts       # Registry for 100 JPG avatars & profile badge metadata
│   └── queryKeys.ts          # Centralized React Query cache key factory
└── types/                    # TypeScript interfaces for all domain models
```

---

## 7. Recently Implemented Major Enhancements

1. **100 Ready JPG Avatars:**
   - Integrated 100 JPG avatars located in `frontend/public/avatars/avatar-1.jpg` .. `avatar-100.jpg`.
   - Replaced all legacy SVGs/placeholders in `readyAvatars.ts`.
   - Selectable with one click in both `/profile` and `UserProfileDialog`.
2. **Lobby Customization Studio:**
   - Room owners can customize their lobby theme (6 presets), choose from 12 icons, and publish a pinned announcement banner.
   - Customized themes apply dynamic header gradients, chat backgrounds, room card accent lines, and announcement chips.
3. **Inline Profile Customization in `UserProfileDialog`:**
   - When inspecting one's own public profile card, users can toggle the inline customizer to change banner theme (7 options), choose from 100 avatars, update their bio/tagline, and save immediately.
4. **Site-wide Color Palette Balancing:**
   - Overcame orange (`#FB923C`) fatigue by balancing it with Cyber Cyan (`#06B6D4`), Electric Violet (`#8B5CF6`), and Emerald (`#10B981`) while preserving all card/button dimensions, paddings, and alignments.

---

## 8. Current System Health & Build Verification

- **Next.js Frontend Build (`npm run build`):** **PASS (0 errors, 13/13 static routes generated).**
- **TypeScript Typecheck (`npx tsc --noEmit`):** **PASS (0 errors).**
- **Rust Backend Compilation (`cargo check`):** **PASS (0 errors).**
- **PostgreSQL Database Migrations:** **All 18 migrations applied and up to date.**
- **Git Repository Status:** Clean working directory; no committed secrets or build artifacts.

---

## 9. Guidelines for Future AI Assistants & Developers

1. **Dimension Discipline:** Never modify card or button widths, heights, margins, or padding alignments unless explicitly asked by the user (`"kartların butonların hizasına enine boyuna dokunma"`).
2. **Architecture Discipline:** Keep the modular monolith clean. Do not add database logic inside Axum route handlers. Use SQLx parameterized queries inside repositories.
3. **Phase Discipline:** Complete Phase 1 and 2 tasks before introducing Phase 3 complex agent autonomous behaviors.
4. **Design Integrity:** Maintain the warm neo-brutalist aesthetic with solid 2px/3px/4px black borders, crisp offset shadows, and curated contrast colors.
