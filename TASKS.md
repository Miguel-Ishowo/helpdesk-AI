# TASKS.md — HelpDesk AI

## Development Progress

### Phase 1 — Foundations

- [x] F01 — Initialize monorepo
- [ ] F02 — Optional Docker infrastructure (deferred/optional: docker-compose files present; Docker not required for host development; runtime verification pending when Docker is available)
- [x] F03 — Initialize frontend and backend

### Phase 2 — Authentication

- [x] A01 — Database models
- [x] A02 — Authentication API
- [x] A03 — Organization management
- [x] A04 — Authentication UI

### Phase 3 — AI Assistants

- [x] B01 — Assistant database model
- [x] B02 — Assistant CRUD API
- [x] B03 — AI configuration
- [x] B04 — Assistant management UI

### Phase 4 — Knowledge Base and RAG

- [x] R01 — Document upload and storage
- [x] R02 — Content extraction
- [x] R03 — Indexing pipeline
- [x] R04 — Vector search
- [x] R05 — Knowledge Base UI

### Phase 5 — Conversational Engine

- [x] C01 - Conversation database models
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

- **A02 - Authentication API (NestJS baseline)**
  - Decision: Implemented auth in existing NestJS API (`/auth/register|login|refresh|logout|me|verify-email|resend-verification|forgot-password|reset-password`) using TypeORM repos, bcrypt password hashing, JWT access+refresh tokens, refresh-token DB sessions (hashed, revocable), email verification/reset tokens (hashed, expiring, single-use), cookie-based refresh token + bearer access token, class-validator DTOs, global ValidationPipe, and CORS credentials.
  - Reason: Completes Phase 2 auth API while preserving existing validated NestJS baseline; A01 entities/migrations already in place.
  - Alternatives considered: Express rewrite now (major architectural migration, needs explicit decision); stateless refresh tokens only (rejected for weaker revocation).
  - Consequences: Email sending is not wired to an SMTP/provider yet (tokens are generated/stored; no secret leakage in logs). Auth endpoints are mounted only when DB config is present. Integration tests against real PostgreSQL remain pending. Added Jest test shims for `@nestjs/typeorm/jwt/config` to keep unit tests fast without ESM transform issues.

- **A03 - Organization management (NestJS baseline)**
  - Decision: Added `OrganizationsModule` with JWT-protected endpoints for create/list/get/update org, list members, invite, list invitations, accept invitation, update member role, remove member. Implemented `OrgRoleGuard` + `@OrgRoles` for org-scoped RBAC (OWNER/ADMIN/MEMBER), membership checks, owner protection, invitation hashing/expiry, and email-mismatch protection on acceptance.
  - Reason: Satisfies Phase 2 org/member/role/isolation requirements with minimal scope and existing TypeORM entities.
  - Alternatives considered: Separate invitations module; global role guard only (insufficient for org scoping).
  - Consequences: Invitation acceptance requires authenticated user whose email matches invitation; email delivery still pending. No DB integration tests executed without real PostgreSQL. Endpoints mounted only when DB config is present.

- **A04 - Authentication UI (Next.js baseline)**
  - Decision: Implemented Next.js App Router auth UI with API-backed flows: register, login, forgot/reset password, email verification, onboarding, protected dashboard shell, auth context, access-token memory + refresh-cookie flow via `/auth/refresh`, and `NEXT_PUBLIC_API_URL` config.
  - Reason: Completes Phase 2 user-facing auth with real API integration; no mock data.
  - Alternatives considered: server actions/proxy auth layer; localStorage token persistence (rejected for weaker security).
  - Consequences: UI depends on running API and DB-configured auth endpoints. E2E/browser tests not added yet; build/lint/typecheck pass. Email delivery still pending on backend, so verify/reset UX is functional only when token flows are available.

- **B01 - Assistant database model enhancement**
  - Decision: Extended existing `Assistant` TypeORM entity with `maxTokens`, `modelSettings` (jsonb), `widgetSettings` (jsonb), `deletedAt` soft-delete, and org/status composite index; added migration `1712800002000-EnhanceAssistantsModel`.
  - Reason: Aligns assistant model with PROJECT.md (model config, widget/domain config, lifecycle) while preserving A01 schema/migrations.
  - Alternatives considered: New assistant table/migration reset (rejected; destructive/unnecessary).
  - Consequences: DB migration not executed against real Postgres in this session; entity/unit tests cover metadata. Future B02 API must enforce org isolation and domain validation.

- **B02 - Assistant CRUD API (NestJS baseline)**
  - Decision: Added `AssistantsModule` under `/organizations/:orgId/assistants` with JWT + `OrgRoleGuard` org isolation. CRUD endpoints: create/list/get/update/soft-delete. DTO validation via class-validator; model allowlist, domain normalization/validation, generated `publicId`, soft delete via TypeORM `softRemove`/`deletedAt` filtering.
  - Reason: Satisfies Phase 3 assistant management API with existing NestJS/TypeORM/RBAC patterns.
  - Alternatives considered: Separate public assistant controller now (deferred to widget/chat phases); storing domains without normalization.
  - Consequences: No DB integration tests executed without real PostgreSQL. Public widget-facing assistant lookup and API-key/domain enforcement at runtime remain for widget/chat phases. Module mounted only when DB config present.

- **B03 - AI configuration (API baseline)**
  - Decision: Added assistant config endpoints `GET/PATCH /organizations/:orgId/assistants/:assistantId/config` (OWNER/ADMIN) and `UpdateAssistantConfigDto` for model, temperature, maxTokens, modelSettings, systemPrompt, welcomeMessage, status. Reused model allowlist and validation helpers.
  - Reason: Exposes AI configuration explicitly as required by Phase 3 while keeping org isolation/RBAC consistent.
  - Alternatives considered: Config-only via generic PATCH (kept generic PATCH too for flexibility; config endpoints provide explicit contract).
  - Consequences: No LLM provider call/credential verification in this step; config is persisted/validated only. DB integration pending.

- **B04 - Assistant management UI (Next.js baseline)**
  - Decision: Added dashboard assistants list/create/delete and assistant detail/edit pages using real API (`/organizations`, `/organizations/:orgId/assistants`, config-aware fields). Org selection is explicit via UI state/query param; no mock data.
  - Reason: Completes Phase 3 user-facing assistant management with minimal, functional UI.
  - Alternatives considered: Full org context/global state (deferred; current approach is simple and explicit).
  - Consequences: UI requires authenticated session + DB-backed API. No E2E/browser tests added; Playwright/E2E pending. Org creation UX is still minimal (register can create org; dedicated org settings UI not built yet).

- **R01 - Document upload and storage (NestJS baseline)**
  - Decision: Added `KnowledgeModule` with org/assistant-scoped endpoints: upload file (`POST .../documents/upload`, multer memory, 10MB), create URL document (`POST .../documents/url`), list/get/delete. Supported file types: PDF/TXT/Markdown by extension/MIME; stored via local `StorageProvider` abstraction (`LocalStorageProvider`, `UPLOAD_DIR`, default `uploads/` gitignored). `KnowledgeDocument` status starts as `PENDING`; metadata stores size/mime/originalName.
  - Reason: Satisfies R01 ingestion/storage baseline without binding to S3; keeps path to R02-R03 extraction/indexing.
  - Alternatives considered: Direct S3-only implementation (deferred; abstraction added); storing binary in DB (rejected).
  - Consequences: Local disk storage only for now; no virus scanning; no extraction/indexing yet. No DB integration tests executed without real PostgreSQL. Module mounted only when DB config present.

- **R02 - Content extraction (baseline)**
  - Decision: Added `DocumentExtractionService` (PDF via `pdf-parse` v2 `PDFParse`, TXT/Markdown UTF-8, URL fetch+HTML strip with timeout) and `POST .../documents/:documentId/process` endpoint. Processing sets status PROCESSING, stores `extractedLength/extractedAt` metadata, then returns to PENDING (awaiting R03 chunk/embed/index) or FAILED with `errorMessage`.
  - Reason: Provides real extraction pipeline required before indexing; keeps statuses truthful (not marked INDEXED without embeddings).
  - Alternatives considered: Mark INDEXED after extraction (rejected; false state); full async BullMQ now (deferred, Redis optional).
  - Consequences: URL extraction is basic HTML stripping (no JS rendering/readability). PDF extraction depends on `pdf-parse` runtime behavior on malformed PDFs. No DB integration tests executed.

- **R03 - Indexing pipeline (baseline)**
  - Decision: Added `KnowledgeIndexingService` with `POST .../documents/:documentId/index`: extract -> chunk (`chunkText`) -> embed via `OpenAiEmbeddingsProvider` (`OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL`, default `text-embedding-3-small`) -> persist `document_chunks` (content, chunkIndex, tokenCount estimate, embedding json, metadata) -> mark document INDEXED with chunkCount/indexedAt. Previous chunks deleted before reindex.
  - Reason: Completes RAG indexing baseline; uses real embedding provider interface (OpenAI) while keeping DB/storage abstractions.
  - Alternatives considered: Fake embeddings (rejected; would simulate RAG); BullMQ worker (deferred, Redis optional).
  - Consequences: Requires `OPENAI_API_KEY` for real indexing; without it, endpoint fails with clear error. Embedding stored in entity as `simple-json` while Postgres migration uses `vector(1536)`; runtime SQL/vector search integration must be validated against real pgvector DB. No DB integration tests executed.

- **R04 - Vector search (baseline)**
  - Decision: Added `KnowledgeSearchService` and `POST .../documents/search` endpoint. Query is embedded with same provider then searched via pgvector SQL (`embedding <=> query_vector`) scoped to `assistantId`, joining `knowledge_documents`, returning score/content/source metadata.
  - Reason: Provides retrieval primitive for RAG/chat phases with real pgvector query shape.
  - Alternatives considered: In-memory cosine over JSON embeddings (rejected for production path; useful only as fallback).
  - Consequences: Requires pgvector-enabled Postgres and embeddings present in DB; not executable/verified in this environment without real DB+OpenAI key. No threshold/reranking yet (deferred to C02).

- **R05 - Knowledge Base UI (baseline)**
  - Decision: Added assistant knowledge page (`/dashboard/assistants/[assistantId]/knowledge`) with file upload, URL add, document list/status/error, extract/index/delete actions using real API. Linked from assistant detail page.
  - Reason: Completes Phase 4 user-facing KB management with real backend integration.
  - Alternatives considered: Embedding KB into assistant detail only (kept separate page for clarity).
  - Consequences: Depends on authenticated API + DB + storage; indexing requires `OPENAI_API_KEY`. No E2E/browser tests run.

- **C01 - Conversation database models (enhancement)**
  - Decision: Enhanced existing A01 conversation/message entities with `Conversation.organizationId` (nullable, indexed, backfilled from assistant in migration), `Conversation.title`, `Conversation` assistant+createdAt index, and `Message.tokenCount`. Added migration `1712800003000-EnhanceConversationsMessages` and entity/migration unit tests.
  - Reason: Aligns chat models with Phase 5 needs (org scoping, history listing, token accounting, feedback/sources already present) without breaking existing schema.
  - Alternatives considered: New chat schema rewrite (rejected; existing entities already in use/migrated baseline).
  - Consequences: `organizationId` is nullable in entity for migration safety; services should treat it as required for new records once chat API is implemented. No DB migration execution/integration tests against real PostgreSQL.

## Known Issues

- **F02 optional / not verified here**: Docker CLI not available in this environment. `docker-compose.yml` and `docker/postgres/init.sql` exist for optional use, but container startup, pgvector runtime check, Redis connectivity, and volume persistence were not verified. This does not block host-based development.
- **PostgreSQL integration tests pending**: No verified PostgreSQL connection in current environment; TypeORM entity/unit-level tests can run, but DB integration/migration execution tests must be run when a valid `DATABASE_URL` is available.
- **A01 DB runtime not verified**: Migrations and TypeORM config were added, but `migration:run`/DB connectivity were not executed because no valid local/external PostgreSQL was configured in this session. Run with a real `DATABASE_URL` before relying on persistence.
- **A02 email delivery pending**: Verification/reset tokens are generated, hashed, stored with expiry/usedAt; actual email sending (SMTP/provider) is not implemented yet. No tokens are logged.
- **A02 DB integration pending**: Auth service unit tests pass with mocked repos; end-to-end auth flows against real PostgreSQL (register/login/refresh/logout/verify/reset with persistence) not executed in this environment.
- **A03 DB integration pending**: Organization/invitation/membership flows unit-tested with mocks; real PostgreSQL integration tests for RBAC/isolation/invitation acceptance not executed in this environment.
- **A04 UI E2E pending**: Auth pages build and typecheck, but no Playwright/E2E run was executed against a live API+DB. Manual/browser verification still needed once DB/email flows are wired.
- **B01 DB migration not executed**: Assistant enhancement migration added; runtime execution pending on real PostgreSQL connection.
- **B02 DB integration pending**: Assistant CRUD unit-tested with mocked repos; real PostgreSQL integration tests for org isolation/RBAC/soft-delete not executed in this environment.
- **B04 UI E2E pending**: Assistant pages build/lint/typecheck; no Playwright/E2E against live API+DB. Manual browser verification required once DB is available.
- **R01 DB/storage integration pending**: Knowledge upload/URL/delete unit-tested with mocked repos/storage; real PostgreSQL + filesystem/S3 integration not executed in this environment.
- **R02 extraction limits**: URL extraction uses simple fetch+HTML strip (no JS rendering); processing endpoint is synchronous HTTP (no BullMQ). DB integration not executed.
- **R03 indexing/runtime pending**: Indexing uses OpenAI embeddings and requires `OPENAI_API_KEY`; no live embedding call executed here. pgvector runtime query/index integration and DB persistence not verified against real PostgreSQL. BullMQ/async queue deferred (Redis optional).
- **R04 vector search runtime pending**: pgvector SQL path implemented but not executed against real PostgreSQL/pgvector; requires indexed embeddings and `OPENAI_API_KEY`.
- **R05 UI E2E pending**: Knowledge page builds/lints/typechecks; no browser/E2E verification against live API+DB+storage+OpenAI.
- **C01 DB integration pending**: Conversation/message enhancement migration and entity changes are unit-tested only; not executed against real PostgreSQL.
