# Architecture - Bambu System

This document defines the project boundaries reviewers should enforce.

## Product

Bambu System is a budget management platform for service businesses. Core
domains include budgets, budget categories, operations, employees, jobs, job
occurrences, client payments, operational costs, settings, and AI chat.

## Stack

- Next.js App Router with React Server Components by default.
- PostgreSQL through Prisma.
- NextAuth v5 with PrismaAdapter and JWT sessions.
- TanStack Query for client-side server-action orchestration.
- Tailwind CSS v4 with shadcn/Radix primitives.

## Route Boundaries

- `app/(auth)/` contains public auth pages.
- `app/(private)/` contains authenticated product surfaces.
- `app/api/auth/` is reserved for NextAuth route handlers.
- Add other route handlers only for external integrations, webhooks, uploads,
  or APIs that cannot be represented as Server Actions.
- `app/api/agent/chat/` streams the Bambú agent as a UI message stream with
  tool parts, which a Server Action cannot return. It requires an admin
  session and keeps its logic in `lib/agent/` (see `docs/agent.md`).
- `app/api/agent/attachments/` (upload and serve composer images) and
  `app/api/agent/transcribe/` (dictation) are upload routes: a Server Action
  accepts 1 MB by default and cannot serve bytes. Both require an admin
  session and keep their logic in `lib/agent/` and `lib/ai/`.

## Data Flow

```text
Server Component -> data/* -> Prisma -> PostgreSQL
Client Component -> hook -> component action wrapper -> actions/* -> Prisma
```

- `actions/` owns mutations and auth-guarded workflows.
- `data/` owns thin read-only queries for Server Components and actions.
- `schemas/` owns Zod validation shared across UI and server code.
- `lib/` owns infrastructure and domain helpers.
- `components/*/actions/` adapts raw Server Action results for hooks and throws
  typed errors when needed.

## Authentication And Authorization

- Server actions must call `auth()` first and return `{ error }` early when the
  user is unauthenticated.
- Admin-only flows use a shared guard such as `lib/require-admin-session.ts`.
- Do not rely on `proxy.ts` as the only authorization layer.
- Credentials auth requires verified email and supports 2FA tokens.

## Budget Model

- Budgets and budget categories are one workspace shared by every admin. Any
  admin reads, edits, duplicates, and deletes any budget, and
  `Budget.userId` only records who created it (a duplicate belongs to whoever
  duplicates it). Every budget and category read in `data/` and every action
  checks the admin session through `getBudgetAdminSession`
  (`lib/budget-admin.ts`). Those reads are `server-only`, and the client
  reaches them through the `"use server"` read files in `components/budgets/`.
- A budget can have multiple `BudgetOption` pricing scenarios.
- Budgets relate many-to-many with `BudgetCategory`.
- `BudgetCategory` supports a one-level parent-child hierarchy.
- Financial calculations belong in `lib/budget-calculations.ts` or a scoped
  helper under `lib/`.

## UI Boundaries

- Keep Server Components as the default.
- Add `"use client"` only where browser APIs, local state, or event handlers are
  required.
- Use existing shadcn/Radix components and `cn()` from `lib/utils.ts`.
- Product screens should stay dense, scannable, and work-focused.

## What Not To Do

- Do not put general data mutations in new API route handlers.
- Do not mix Prisma writes into Client Components.
- Do not grow catch-all service files when `actions/`, `data/`, `schemas/`, or
  `lib/` should own the responsibility.
- Do not add new global providers without documenting the need in
  `feature_list.json`.
