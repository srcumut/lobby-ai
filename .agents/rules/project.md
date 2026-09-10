---
trigger: always_on
---

# Lobby AI — Project Rules

## 1. Project Role

You are the primary development agent for the Lobby AI project.

Your responsibility is to implement, inspect, test, debug, and improve the codebase according to the project's established architecture and requirements.

Do not invent features or change architectural decisions without explicit approval.

---

## 2. Project Vision

Lobby AI is a real-time lobby-based social chat platform.

Users can:

- create and join lobbies
- communicate in real time
- see other users' presence
- persist and retrieve messages

The project will later support personalized AI agents that can participate in lobbies as normal participants.

AI functionality is a later phase and must not be implemented prematurely unless explicitly requested.

---

## 3. Technology Stack

### Frontend
- Next.js
- TypeScript
- React
- REST API client
- WebSocket client

### Backend
- Rust
- Axum
- Tokio
- Serde
- SQLx
- WebSocket

### Database
- PostgreSQL

### Infrastructure
- Docker
- Docker Compose
- Nginx
- VPS

### Frontend Deployment
- Vercel

### Optional Infrastructure
- Redis

Redis must not be introduced unless the current requirement actually needs it.

---

## 4. Architecture

Use a modular monolith architecture.

Backend flow:

HTTP / WebSocket
→ Handlers
→ Services
→ Repositories
→ Database

Do not access the database directly from route handlers.

Keep responsibilities separated.

Authentication and authorization must remain separate concerns.

Do not introduce microservices.

---

## 5. Backend Rules

Use Rust idiomatically.

Prefer:

- strong typing
- Result-based error handling
- explicit error types
- validated input
- parameterized SQL queries
- dependency injection through application state
- small focused modules

Avoid:

- unnecessary abstractions
- duplicated business logic
- global mutable state
- unwrap() / expect() in production paths unless there is a justified invariant
- database logic inside handlers

All database access must use SQLx.

---

## 6. API Rules

API endpoints must follow REST conventions.

Use consistent JSON responses.

Errors must follow this structure:

{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message."
  }
}

Validate all client-provided input.

Never trust frontend validation alone.

---

## 7. WebSocket Rules

WebSocket endpoint:

/ws/lobbies/:lobby_id

Message flow:

1. Authenticate connection.
2. Validate lobby membership and permissions.
3. Validate incoming message.
4. Persist the message.
5. Broadcast only after successful persistence.

WebSocket events should use explicit event types such as:

- message.created
- message.updated
- message.deleted
- user.joined
- user.left
- presence.updated

Do not introduce ad-hoc WebSocket message formats.

---

## 8. Database Rules

Use PostgreSQL.

Use migrations for schema changes.

Never manually modify the production database schema without a corresponding migration.

Primary and foreign keys must be explicit.

Use appropriate indexes for frequently queried columns.

Preserve referential integrity.

Do not store secrets or API keys as plaintext.

---

## 9. Security Rules

Security is a first-class requirement.

Always consider:

- authentication
- authorization
- password hashing
- input validation
- SQL injection
- XSS
- CSRF where applicable
- WebSocket authentication
- rate limiting
- secret management
- secure headers
- API key protection

Passwords must use Argon2id.

Secrets must never be committed to Git.

Never expose private credentials to the frontend.

Never log API keys, passwords, tokens, or other secrets.

---

## 10. Development Rules

Before implementing a non-trivial change:

1. Inspect the existing code.
2. Understand the current architecture.
3. Identify affected modules.
4. Implement the smallest appropriate change.
5. Run relevant tests and checks.
6. Report what changed and what was verified.

Do not rewrite working code unnecessarily.

Do not create files that are not required.

Do not modify unrelated parts of the project.

---

## 11. Dependency Rules

Do not add a dependency simply because it is convenient.

Before adding a new dependency:

- verify that the functionality cannot reasonably be implemented with existing dependencies
- consider security and maintenance
- explain why the dependency is necessary

Prefer established and actively maintained Rust crates.

---

## 12. Git Rules

Use clear English commit messages.

Do not commit:

- .env files
- secrets
- API keys
- credentials
- build artifacts
- local databases
- IDE-specific temporary files

Keep commits focused on a logical change.

Do not rewrite Git history unless explicitly requested.

---

## 13. Decision Discipline

Existing project decisions are authoritative.

If a requirement is unclear:

1. inspect the existing implementation and documentation
2. identify the smallest reasonable interpretation
3. ask for clarification if the decision would materially affect architecture

Do not silently introduce new product features.

Do not change the technology stack without explicit approval.

Do not replace PostgreSQL with SQLite.

Do not replace the Rust/Axum backend with another backend framework.

Do not replace the Next.js frontend architecture without explicit approval.

---

## 14. Phase Discipline

### Phase 1
Focus only on:

- authentication
- users
- public lobbies
- lobby creation
- joining/leaving
- real-time messaging
- message persistence
- basic presence
- PostgreSQL
- Docker
- production deployment

### Phase 2
Social platform features.

### Phase 3
AI ecosystem.

Do not implement Phase 2 or Phase 3 functionality while working on Phase 1 unless explicitly requested.

---

## 15. Code Quality

Prioritize:

1. Correctness
2. Security
3. Maintainability
4. Testability
5. Performance

Do not optimize prematurely.

Prefer simple, understandable solutions over clever solutions.

When modifying existing code, preserve established conventions unless there is a concrete reason to change them.

---

## 16. Agent Behavior

Do not assume that every suggested improvement should be implemented.

When you identify a potential improvement:

- explain the issue
- explain why it matters
- propose the solution
- wait for approval if it changes architecture, scope, or product behavior

You are an implementation agent, not the product owner.

The user makes product and architectural decisions.

Never claim that something works without actually verifying it.