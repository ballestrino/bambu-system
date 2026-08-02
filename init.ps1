$ErrorActionPreference = "Continue"
$exitCode = 0

function Ok($message) {
  Write-Host "[OK] $message" -ForegroundColor Green
}

function Warn($message) {
  Write-Host "[WARN] $message" -ForegroundColor Yellow
}

function Fail($message) {
  Write-Host "[FAIL] $message" -ForegroundColor Red
  $script:exitCode = 1
}

function Run-Step($title, [scriptblock] $command) {
  Write-Host ""
  Write-Host "== $title =="
  & $command
  if ($LASTEXITCODE -eq 0) {
    Ok $title
  } else {
    Fail "$title exited with $LASTEXITCODE"
  }
}

Write-Host "== Environment =="

try {
  $nodeVersion = node --version
  Ok "node -> $nodeVersion"
} catch {
  Fail "node is not available"
}

try {
  $pnpmVersion = pnpm --version
  Ok "pnpm -> $pnpmVersion"
} catch {
  Fail "pnpm is not available"
}

Run-Step "Harness validation" { node scripts/harness-validate.mjs }
Run-Step "Prisma validation" { .\node_modules\.bin\prisma.CMD validate }
Run-Step "ESLint" { pnpm lint }

if ($env:HARNESS_FULL -eq "1") {
  Run-Step "Next build" { pnpm build }
} else {
  Warn "Skipping pnpm build. Set HARNESS_FULL=1 to include it."
}

Write-Host ""
if ($exitCode -eq 0) {
  Ok "Harness ready"
} else {
  Fail "Harness checks failed"
}

exit $exitCode
