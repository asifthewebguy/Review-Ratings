# ReviewBD — Bangladesh Review & Ratings Platform

## Project Structure

Monorepo using pnpm workspaces:

- `apps/web` — Next.js 15 frontend (App Router, next-intl for i18n)
- `apps/api` — Fastify backend (Prisma ORM, BullMQ jobs)
- `packages/shared` — Shared Zod schemas and TypeScript types

## Quick Start

```bash
docker compose up -d          # Start PostgreSQL, Redis, MeiliSearch
pnpm install                  # Install all dependencies
pnpm --filter @review-ratings/shared build  # Build shared package first
pnpm --filter @review-ratings/api db:generate  # Generate Prisma client
pnpm dev                      # Start both API (port 3001) and Web (port 3000)
```

## Key Commands

- `pnpm dev` — Run all apps in development
- `pnpm build` — Build all packages
- `pnpm test` — Run all tests
- `pnpm lint` — Lint all packages
- `pnpm format` — Format all files with Prettier
- `pnpm db:migrate` — Run Prisma migrations
- `pnpm db:seed` — Seed database
- `pnpm db:studio` — Open Prisma Studio

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS v4, shadcn/ui, next-intl (Bengali + English), Zustand, TanStack Query
- **Backend**: Fastify 5, Prisma, BullMQ, ioredis
- **Database**: PostgreSQL 16, Redis 7, MeiliSearch
- **Storage**: Cloudflare R2
- **Shared**: Zod schemas for validation across API and web

## Conventions

- TypeScript strict mode everywhere
- Bengali (bn) is the default locale, English (en) is secondary
- All API responses follow `{ success, data?, error? }` envelope
- API routes prefixed with `/api/v1/`
- Database columns use snake_case, TypeScript uses camelCase (Prisma maps them)
- Build shared package before building API or Web
