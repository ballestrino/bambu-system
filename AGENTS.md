# AGENTS.md - Harness map

This file is the entry point for AI agents working in Bambu System. It is a
map, not a complete rule book: read the referenced file when the task needs it.

## 1. Start Here

1. Run the harness:
   - Windows: `.\init.ps1`
   - POSIX: `./init.sh`
2. Read `progress/current.md` to understand any active session.
3. Read `feature_list.json` and work on at most one feature with status
   `pending` or `in_progress`.
4. Before editing application code, read:
   - `docs/architecture.md`
   - `docs/conventions.md`
   - `docs/verification.md`

## 2. Repository Map

| Path | Purpose | When to read |
| --- | --- | --- |
| `feature_list.json` | Harness scope and feature state | Always at start |
| `progress/current.md` | Live session notes | Always at start |
| `progress/history.md` | Append-only closed-session log | When context is needed |
| `docs/architecture.md` | System boundaries and data flow | Before implementation |
| `docs/conventions.md` | Code style and file ownership rules | Before editing |
| `docs/verification.md` | Required proof before closing work | Before marking done |
| `CHECKPOINTS.md` | Reviewer checklist | During review |
| `.codex/agents/` | Codex leader, implementer, reviewer roles | When orchestrating |
| `scripts/harness-validate.mjs` | Machine checks for harness health | When init fails |

## 3. Commands

```bash
pnpm dev          # Start dev server
pnpm build        # prisma generate + next build
pnpm lint         # ESLint
pnpm harness      # Validate harness files and feature state
```

No automated test suite is configured yet. Use the verification matrix in
`docs/verification.md` for the minimum evidence expected per change type.

## 4. Hard Rules

- Work on one feature at a time.
- Keep `feature_list.json` coherent: statuses are `pending`, `in_progress`,
  `done`, or `blocked`; never leave more than one `in_progress`.
- Document meaningful progress in `progress/current.md` while working.
- Do not mark a feature `done` unless the required verification is green.
- Keep authored files at 200 lines or less by default.
- Split by responsibility before growing files beyond 200 lines.
- Allowed file-size exceptions: generated Prisma migrations,
  `prisma/schema.prisma`, vendor-style wrappers such as shadcn/ui primitives,
  or cases where splitting would make the code harder to understand.
- Prefer separating `actions/`, `data/`, `schemas/`, and `lib/`
  responsibilities instead of growing a single file.
- Do not leave temporary files, debug `console.log`, `debugger`, or TODOs
  without immediate context.

## 5. Architecture Snapshot

Bambu System is a budget management platform for service businesses. The
installed stack is Next.js App Router, PostgreSQL/Prisma, NextAuth v5,
TanStack Query, Tailwind CSS v4, and shadcn/Radix UI.

Primary flow:

```text
Server Action (actions/) -> Prisma (lib/db.ts) -> PostgreSQL
Client Component -> TanStack Query hook -> component action wrapper -> Server Action
```

Route shape:

- `app/(auth)/` - public auth pages.
- `app/(private)/dashboard/` - protected dashboard pages.
- `app/api/auth/` - NextAuth route handlers only.
- Most application data operations should stay in Server Actions, not API
  route handlers.

Authentication: server actions call `auth()` first and return `{ error }`
early when unauthenticated. Action wrappers in `components/*/actions/` throw
typed errors such as `instances/validation-error`.

## 6. Closing A Session

1. Run `.\init.ps1` or `./init.sh`.
2. Run any extra checks required by `docs/verification.md`.
3. Write the result in `progress/current.md`.
4. If finished, update `feature_list.json`, append a summary to
   `progress/history.md`, then reset `progress/current.md` to its idle
   template.
5. If blocked, set the feature to `blocked` and write the reason plus the next
   needed decision in `progress/current.md`.

## 7. Codex Subagents

Codex subagent profiles live in `.codex/agents/`:

- `leader` coordinates one feature at a time and owns harness state.
- `implementer` makes scoped code changes and writes `progress/impl_*.md`.
- `reviewer` validates the result and writes `progress/review_*.md`.

Use Codex runtime subagents when the user explicitly asks for delegation or
parallel agent work. Keep ownership explicit so agents do not edit the same
files blindly.
