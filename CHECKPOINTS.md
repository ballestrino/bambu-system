# CHECKPOINTS - Final-state review

Reviewers use this file to evaluate the destination state, not the path taken.

## C1 - Harness Is Complete

- [ ] `AGENTS.md`, `CHECKPOINTS.md`, and `feature_list.json` exist.
- [ ] `init.ps1`, `init.sh`, and `scripts/harness-validate.mjs` exist.
- [ ] `progress/current.md` and `progress/history.md` exist.
- [ ] `docs/architecture.md`, `docs/conventions.md`, and
  `docs/verification.md` exist.
- [ ] `.codex/agents/leader.md`, `implementer.md`, and `reviewer.md` exist.
- [ ] `.\init.ps1` or `./init.sh` exits with code 0.

## C2 - Harness State Is Coherent

- [ ] At most one feature is `in_progress`.
- [ ] Every feature uses a valid status: `pending`, `in_progress`, `done`, or
  `blocked`.
- [ ] Active work is reflected in `progress/current.md`.
- [ ] Closed work is appended to `progress/history.md`.

## C3 - Architecture Is Respected

- [ ] Mutations go through `actions/` Server Actions unless the task is a true
  auth route, webhook, or external API.
- [ ] Read-only server data access lives in `data/`.
- [ ] Shared validation lives in `schemas/`.
- [ ] Shared domain helpers live in `lib/`.
- [ ] UI follows the existing shadcn/Radix and Tailwind token style.
- [ ] Auth-sensitive server paths re-check `auth()` or an equivalent guard.

## C4 - Verification Is Real

- [ ] `pnpm harness` passes.
- [ ] `pnpm lint` passes.
- [ ] `pnpm exec prisma validate` passes when Prisma files or data paths are
  touched.
- [ ] `pnpm build` is run for risky framework, route, config, auth, or Prisma
  changes when the environment supports it.
- [ ] UI changes include a browser smoke check or screenshot evidence.

## C5 - Session Is Closed Cleanly

- [ ] No suspicious temporary files remain.
- [ ] No debug `console.log`, `debugger`, or context-free TODOs remain.
- [ ] `feature_list.json` reflects the final feature status.
- [ ] `progress/current.md` is either idle or accurately describes the active
  block.
