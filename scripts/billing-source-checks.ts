import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// El agente nunca emite (docs/billing.md, regla 1): la garantía es el código.
const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n");

const listFiles = (dir: string): string[] => {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full).flatMap((name) => {
    const path = join(full, name);
    return statSync(path).isDirectory()
      ? listFiles(relative(root, path))
      : /\.(ts|tsx)$/.test(name) ? [relative(root, path).replace(/\\/g, "/")] : [];
  });
};

// --- Nada del agente importa la emisión de Biller.
const ISSUE_IMPORT = /from\s+["'][^"']*(billing\/biller-issue|actions\/billing\/issue)[^"']*["']/;
for (const file of [...listFiles("lib/agent"), ...listFiles("app/api/agent"), ...listFiles("components/agent")]) {
  assert.ok(!ISSUE_IMPORT.test(read(file)), `${file} imports the Biller issue code`);
}

// --- En lib/billing solo biller-issue.ts puede emitir o anular, y solo con POST.
const WRITE_CALL = /comprobantes\/(emitir|anular)|method:\s*["']POST["']/;
for (const file of listFiles("lib/billing")) {
  if (file.endsWith("/biller-issue.ts")) continue;
  assert.ok(!WRITE_CALL.test(read(file)), `${file} writes to Biller`);
}
assert.match(read("lib/billing/biller-http.ts"), /method: "GET"/);

// --- El cableado con el entorno y la base es server-only; la acción exige admin.
assert.match(read("lib/billing/biller-server.ts"), /^import "server-only";/);
assert.match(read("data/billing/summary.ts"), /^import "server-only";[\s\S]*requireAdminSession\(\)/);
assert.match(read("actions/billing/sync-month.ts"), /^"use server";[\s\S]*requireAdminSession\(\)/);

// --- Archivos de hasta 200 líneas.
for (const file of [...listFiles("lib/billing"), ...listFiles("data/billing"), ...listFiles("actions/billing"), "schemas/billing.ts"]) {
  assert.ok(read(file).split("\n").length <= 201, `${file} has more than 200 lines`);
}
