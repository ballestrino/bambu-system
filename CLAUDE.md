# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # prisma generate + next build
pnpm lint         # ESLint
```

No test suite is configured.

## File Size And Boundaries

- Keep authored files at 200 lines or less by default.
- If a file approaches 200 lines, split by responsibility before adding more features.
- Files with 300, 500, or 700 lines are not acceptable unless exceeding 200 is clearly necessary.
- Allowed exceptions: generated Prisma migrations, `prisma/schema.prisma`, vendor-style wrappers such as shadcn/ui primitives, or cases where splitting would make the code harder to understand.
- Prefer separating `actions/`, `data/`, `schemas/`, and `lib/` responsibilities instead of growing a single file.

## Architecture

**Bambú System** is a budget management platform for service businesses. Built with Next.js 15 App Router, PostgreSQL/Prisma, NextAuth v5, and TanStack Query.

### Route Structure
- `app/(auth)/` — Public auth pages (login, register, password reset, 2FA)
- `app/(private)/dashboard/` — Protected app pages (budgets, categories, settings, chat)
- `app/api/auth/` — NextAuth route handlers only; all other data operations use Server Actions

### Data Flow Pattern
```
Server Action (actions/) → Prisma (lib/db.ts) → PostgreSQL
Client Component → TanStack Query hook (components/*/hooks/) → Server Action
```

Action wrappers in `components/*/actions/` sit between hooks and raw server actions; they throw typed errors (see `instances/validation-error`) instead of returning `{ error }` objects.

### Key Directories
- `actions/` — Server actions grouped by domain (`budgets/`, `budgetCategories/`, auth actions at root)
- `data/` — Thin read-only query functions (used in RSC and server actions)
- `schemas/` — Zod validation schemas (BudgetSchema, auth schemas)
- `lib/` — `db.ts` (Prisma singleton), `budget-calculations.ts`, token/email helpers
- `components/ui/` — shadcn/Radix-based component library
- `providers/` — ReactQueryProvider, ThemeProvider

### Authentication
NextAuth v5 with PrismaAdapter. Credentials + Google OAuth. JWT sessions (14-day expiry). Email verification required for credentials auth. 2FA via tokens stored in DB. Role-based access (`UserRole`: ADMIN | USER). Auth config split across `auth.ts` (callbacks/adapter) and `auth.config.ts` (providers).

All server actions call `auth()` first and return `{ error }` early if unauthenticated.

### Budget Model
Budgets have `BudgetOption` children (multiple pricing scenarios per budget) and many-to-many `BudgetCategory` relations. `BudgetCategory` supports parent-child hierarchy (one level). Financial calculations live in `lib/budget-calculations.ts`.

### Styling
Tailwind CSS v4 + shadcn/ui components. Dark mode via `next-themes`. `cn()` utility from `lib/utils.ts`.
