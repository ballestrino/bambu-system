#!/usr/bin/env bash
set -u

EXIT_CODE=0

ok() { printf "[OK] %s\n" "$1"; }
warn() { printf "[WARN] %s\n" "$1"; }
fail() {
  printf "[FAIL] %s\n" "$1"
  EXIT_CODE=1
}

run_step() {
  title="$1"
  shift
  printf "\n== %s ==\n" "$title"
  if "$@"; then
    ok "$title"
  else
    fail "$title"
  fi
}

printf "== Environment ==\n"

if command -v node >/dev/null 2>&1; then
  ok "node -> $(node --version)"
else
  fail "node is not available"
fi

if command -v pnpm >/dev/null 2>&1; then
  ok "pnpm -> $(pnpm --version)"
else
  fail "pnpm is not available"
fi

run_step "Harness validation" node scripts/harness-validate.mjs
run_step "Prisma validation" pnpm exec prisma validate
run_step "ESLint" pnpm lint

if [ "${HARNESS_FULL:-0}" = "1" ]; then
  run_step "Next build" pnpm build
else
  warn "Skipping pnpm build. Set HARNESS_FULL=1 to include it."
fi

printf "\n"
if [ "$EXIT_CODE" -eq 0 ]; then
  ok "Harness ready"
else
  fail "Harness checks failed"
fi

exit "$EXIT_CODE"
