# Conventions

## TypeScript

- Keep `strict` TypeScript clean.
- Prefer named exports for shared helpers and components.
- Use `type` aliases for object shapes unless an interface already exists in
  the surrounding code.
- Avoid `any`; use Zod inference or Prisma types where possible.
- Keep imports grouped by external packages first, then local `@/` imports.

## Server Actions

- Put domain actions under `actions/<domain>/`.
- Start server-action files with `"use server"`.
- Validate input with the relevant schema from `schemas/`.
- Call `auth()` before reading or writing user-owned data.
- Return `{ error }` for raw server-action failures unless the local wrapper
  pattern expects a thrown typed error.

## Data And Prisma

- Keep read-only queries in `data/`.
- Keep Prisma client access centralized through `lib/db.ts`.
- Use `include` helpers for repeated Prisma graph shapes.
- For migrations, update `prisma/schema.prisma` and add generated migrations
  only when the task explicitly changes persistence.

## React

- Server Components are the default in `app/`.
- Push `"use client"` as low as possible.
- Keep hooks in `hooks/` or `components/<domain>/hooks/`.
- Keep component action wrappers in `components/<domain>/actions/`.
- Do not introduce new state libraries without a feature-level reason.

## Styling

- Use Tailwind tokens and existing shadcn/Radix primitives.
- Use `cn()` for conditional class names.
- Prefer lucide icons already used by the app.
- Keep dashboard and operational surfaces compact and predictable.

## File Size

- Keep authored files under 200 lines by default.
- Split by responsibility before crossing 200 lines.
- Exceptions: generated Prisma migrations, `prisma/schema.prisma`, and
  vendor-style UI primitives where splitting would make comprehension worse.

## Progress Files

- `progress/current.md` is live state, not a final report.
- Implementation reports go to `progress/impl_<feature>.md`.
- Review reports go to `progress/review_<feature>.md`.
- Closed summaries are appended to `progress/history.md`.
