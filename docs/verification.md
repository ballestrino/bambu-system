# Verification

Agents must prove that work is safe before calling it done.

## Baseline

Run one of these from the repository root:

```bash
.\init.ps1
./init.sh
```

The harness validates required files and feature state, then runs:

- `pnpm exec prisma validate`
- `pnpm lint`

Set `HARNESS_FULL=1` to include `pnpm build`.

## Change-Specific Checks

| Change type | Required evidence |
| --- | --- |
| Harness/docs only | `pnpm harness` and lint if markdown-adjacent scripts changed |
| Prisma schema or data paths | `pnpm exec prisma validate`; run `pnpm build` when env permits |
| Server Actions/auth | Lint plus a focused manual or scripted smoke check |
| UI components/pages | Lint plus browser smoke check or screenshot |
| Shared calculations | Add or run focused executable checks before closing |
| Next config/build tooling | `pnpm build` when env permits |

## UI Smoke Checks

For user-facing changes:

1. Start `pnpm dev`.
2. Open the affected route in a browser.
3. Check loading, empty, success, and error states relevant to the change.
4. Capture a screenshot or write the observed result in `progress/current.md`.

## Closing Rule

If a required command fails, do not mark the feature `done`. Set it to
`blocked` or keep it `in_progress`, record the failing command and next action
in `progress/current.md`, and stop.
