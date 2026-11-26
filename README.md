# HelpDesk AI

Monorepo for HelpDesk AI - a SaaS customer support platform powered by AI.

## Structure

- `apps/web` - Next.js frontend
- `apps/api` - NestJS backend
- `packages/shared` - shared TypeScript types and utilities
- `packages/config` - shared configuration (linting, formatting, TS)

## Prerequisites

- Node.js >= 24
- pnpm (via Corepack)
- PostgreSQL (local install or external service) - required for DB-backed features
- Redis (local install or external service) - required for BullMQ workers

Docker is **optional**. You can run Next.js and NestJS directly on the host.

## Getting started (host, no Docker required)

```bash
cp .env.example .env
# Edit .env with DATABASE_URL / REDIS_URL pointing to local or external services
corepack pnpm install
corepack pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001 (`GET /health`)

## Optional Docker infrastructure (F02)

Docker files are provided for convenience but are not required:

```bash
docker compose up -d
```

- PostgreSQL 16 with pgvector (`docker-compose.yml`, `docker/postgres/init.sql`)
- Redis 7
- Persistent volumes: `postgres_data`, `redis_data`
- Healthchecks for Postgres and Redis

If you do not use Docker, provide equivalent `DATABASE_URL` and `REDIS_URL` values in `.env`.

## Scripts

- `pnpm build` - build all packages/apps
- `pnpm dev` - run dev servers
- `pnpm lint` - lint all packages/apps
- `pnpm test` - run tests
- `pnpm typecheck` - TypeScript checks
- `pnpm format` - format code
- `pnpm format:check` - verify formatting
