# TASKS.md — HelpDesk AI

## Development Progress

### Phase 1 — Foundations

- [x] F01 — Initialize monorepo
- [ ] F02 — Optional Docker infrastructure (deferred/optional: docker-compose files present; Docker not required for host development; runtime verification pending when Docker is available)
- [x] F03 — Initialize frontend and backend

### Phase 2 — Authentication

- [x] A01 — Database models
- [ ] A02 — Authentication API
- [ ] A03 — Organization management
- [ ] A04 — Authentication UI

### Phase 3 — AI Assistants

- [ ] B01 — Assistant database model
- [ ] B02 — Assistant CRUD API
- [ ] B03 — AI configuration
- [ ] B04 — Assistant management UI

### Phase 4 — Knowledge Base and RAG

- [ ] R01 — Document upload and storage
- [ ] R02 — Content extraction
- [ ] R03 — Indexing pipeline
- [ ] R04 — Vector search
- [ ] R05 — Knowledge Base UI

### Phase 5 — Conversational Engine

- [ ] C01 — Conversation database models
- [ ] C02 — RAG retrieval pipeline
- [ ] C03 — Streaming chat API
- [ ] C04 — Chat testing interface

### Phase 6 — Embeddable Widget

- [ ] W01 — Widget architecture
- [ ] W02 — Widget interface
- [ ] W03 — API integration and streaming
- [ ] W04 — Widget distribution and integration

### Phase 7 — Analytics

- [ ] D01 — Conversation history
- [ ] D02 — Conversation management
- [ ] D03 — Analytics dashboard

### Phase 8 — Production

- [ ] P01 — Security audit
- [ ] P02 — End-to-end testing
- [ ] P03 — Production deployment

## Task Execution Rules

1. Never mark a task DONE before all acceptance criteria pass.
2. Never start a task whose dependencies are incomplete.
3. Update this file immediately after completing a task.
4. Record blockers and technical decisions.
5. Do not mark an entire phase complete if one of its tasks remains unfinished.
6. Docker is optional for development; F02 must not block business-feature tasks. Use local/external PostgreSQL and Redis via connection URLs.

## Architecture Decisions

- **2026-04-11 - Docker optional, host-first development**
  - Decision: Docker is optional, not a required dependency. Next.js and NestJS run on host. PostgreSQL/Redis provided via local installs or external services using `DATABASE_URL`/`REDIS_URL`. F02 is optional containerization and does not block business tasks.
  - Reason: User directive to unblock development without Docker while keeping container option.
  - Alternatives considered: Keep Docker mandatory; require Prisma instead of TypeORM (rejected).
  - Consequences: DB/Redis integration tests run only when valid connections are available; pgvector remains required for RAG runtime features but entity/migration authoring is not blocked by immediate pgvector installation; Redis absence must not block non-queue modules, only BullMQ worker execution.

- **F01 - Monorepo/tooling baseline**
  - Decision: Use pnpm workspaces (`apps/*`, `packages/*`) with root scripts via `corepack pnpm -r --if-present`; add `packages/shared` and `packages/config` placeholders; root TS/Prettier/EditorConfig; placeholders for `apps/web` and `apps/api` until F03.
  - Reason: Matches AGENTS/PROJECT stack, simple workspace orchestration, clear separation of concerns.
  - Alternatives considered: npm/yarn workspaces, Turborepo/Nx from day one.
  - Consequences: Real lint/test/typecheck for apps deferred to F03; root scripts currently execute placeholders for uninitialized apps. Corepack download may require network on first run.

- **F03 - Frontend/backend baseline**
  - Decision: Scaffolded `apps/web` (Next.js 15, App Router, TS, Tailwind, ESLint) and `apps/api` (NestJS 10, TS, Jest, ESLint) manually to keep pnpm workspace compatibility; added `/health` endpoint with unit/e2e test scaffold; enabled CORS using `WEB_URL`.
  - Reason: `create-next-app`/Nest CLI flows conflicted with workspace pnpm resolution in this environment; manual scaffold gives controlled, minimal baseline aligned with spec.
  - Alternatives considered: `create-next-app` with pnpm, `@nestjs/cli new`, monorepo generators.
  - Consequences: Versions are pinned to stable baselines (not latest canaries). Root install uses `--dangerously-allow-all-builds` only to allow required native/build scripts (`@nestjs/core`, `sharp`). Lint ignores `.next` build artifacts.

- **A01 - TypeORM data model baseline**
  - Decision: Implemented TypeORM entities/migrations in `apps/api` (not Prisma). Added core entities for auth/org/assistants/knowledge/chat: User, Organization, Membership, Session, Invitation, Assistant, KnowledgeDocument, DocumentChunk, Conversation, Message, EmailVerificationToken, PasswordResetToken; enum/status fields; UUID PKs/timestamps; indexes/uniques; cascade relations. DB config via `DATABASE_URL` or discrete DB env vars. TypeORM module loads only when DB config is present to keep host dev possible without DB.
  - Reason: Aligns with requested stack and enables A02+ work without blocking on Docker.
  - Alternatives considered: Prisma; deferring all schema work until DB available.
  - Consequences: Two migrations exist: core schema + pgvector column/index for `document_chunks`. pgvector runtime/index requires Postgres with pgvector installed; migration execution/integration not run in this environment due no verified DB connection. `strictPropertyInitialization` disabled in API tsconfig for TypeORM entity ergonomics.

## Known Issues

- **F02 optional / not verified here**: Docker CLI not available in this environment. `docker-compose.yml` and `docker/postgres/init.sql` exist for optional use, but container startup, pgvector runtime check, Redis connectivity, and volume persistence were not verified. This does not block host-based development.
- **PostgreSQL integration tests pending**: No verified PostgreSQL connection in current environment; TypeORM entity/unit-level tests can run, but DB integration/migration execution tests must be run when a valid `DATABASE_URL` is available.
- **A01 DB runtime not verified**: Migrations and TypeORM config were added, but `migration:run`/DB connectivity were not executed because no valid local/external PostgreSQL was configured in this session. Run with a real `DATABASE_URL` before relying on persistence.
