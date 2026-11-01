import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { findForbiddenImport, isIssueCode, readRepoSource } from "./billing-import-graph";

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
const ISSUE_IMPORT = /from\s+["'][^"']*(billing\/biller-issue|billing\/credit-note-(run|store)|actions\/billing\/(issue|credit-note))[^"']*["']/;
for (const file of [...listFiles("lib/agent"), ...listFiles("app/api/agent"), ...listFiles("components/agent")]) {
  assert.ok(!ISSUE_IMPORT.test(read(file)), `${file} imports the Biller issue code`);
}

// --- Ni por el medio: lo que importa el agente (sus tools, su ruta, sus
// componentes y el panel de Facturación) no llega a la emisión.
const agentEntries = [
  ...listFiles("lib/agent"), ...listFiles("app/api/agent"), ...listFiles("components/agent"),
  "components/billing/billing-agent.tsx",
];
const leak = findForbiddenImport(agentEntries, isIssueCode, readRepoSource(root));
assert.equal(leak, null, `the agent reaches the Biller issue code: ${leak?.join(" -> ")}`);
// El chequeo encuentra una cadena indirecta (un módulo del agente que importa
// algo que importa la emisión).
const fixture: Record<string, string> = {
  "lib/agent/tools/fake.ts": 'import { helper } from "@/lib/billing/helper";',
  "lib/billing/helper.ts": 'export { issueOne } from "./biller-issue";',
  "lib/billing/biller-issue.ts": "export const issueOne = 1;",
};
assert.deepEqual(
  findForbiddenImport(["lib/agent/tools/fake.ts"], isIssueCode, (path) => fixture[path] ?? null),
  ["lib/agent/tools/fake.ts", "lib/billing/helper.ts", "lib/billing/biller-issue.ts"]
);
assert.equal(findForbiddenImport(["lib/billing/helper.ts"], (path) => path.includes("nada"), (path) => fixture[path] ?? null), null);

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
assert.match(read("data/billing/month.ts"), /^import "server-only";[\s\S]*requireAdminSession\(\)/);
assert.match(read("data/billing/invoice.ts"), /^import "server-only";[\s\S]*requireAdminSession\(\)/);
assert.match(read("data/billing/credit-note.ts"), /^import "server-only";[\s\S]*requireAdminSession\(\)/);
for (const action of ["sync-month", "repeat-month", "update-draft-invoice", "issue-batch", "credit-note", "receiver-job"]) {
  assert.match(read(`actions/billing/${action}.ts`), /^"use server";[\s\S]*requireAdminSession\(\)/, `${action} requires admin`);
}

// --- Un único borrador abierto por mes: el lock antes de buscar o crear.
assert.match(read("lib/billing/draft-store.ts"), /pg_advisory_xact_lock[\s\S]*invoiceBatch\.findFirst[\s\S]*invoiceBatch\.create/);
// --- Editar el borrador compara updatedAt (compare-and-set).
assert.match(read("lib/billing/draft-update.ts"), /where: \{ id: edit\.invoiceId, status: "DRAFT", updatedAt: invoice\.updatedAt \}/);

// --- Emitir: el cableado es server-only y aparte de la lectura; la acción
// toma el borrador con lock y compare-and-set antes de emitir (reglas 2 y 3).
assert.match(read("lib/billing/biller-issue-server.ts"), /^import "server-only";/);
assert.doesNotMatch(read("lib/billing/biller-server.ts"), /biller-issue/);
assert.match(read("lib/billing/issue-claim.ts"), /pg_advisory_xact_lock[\s\S]*updatedAt\.toISOString\(\) !== request\.updatedAt[\s\S]*status: "ISSUING"/);
assert.match(read("lib/billing/biller-issue-server.ts"), /export const assertCanIssue = \(\) => \{\n  if \(!isIssueEnabled\(\)\)/);
assert.match(read("actions/billing/issue-batch.ts"), /requireAdminSession\(\)[\s\S]*assertCanIssue\(\)[\s\S]*claimBatchIssue\(/);

// --- Nota de crédito (43): la acción exige admin y emitir prendido antes de
// tomar la factura; la toma tiene lock por factura y compara lo que vio la
// página (regla 2) antes de crear la nota en ISSUING con su numero_interno.
assert.match(read("actions/billing/credit-note.ts"), /requireAdminSession\(\)[\s\S]*assertCanIssue\(\)[\s\S]*claimCreditNote\(/);
assert.match(read("actions/billing/credit-note.ts"), /retryCreditNote[\s\S]*requireAdminSession\(\)[\s\S]*assertCanIssue\(\)[\s\S]*claimCreditNoteRetry\(/);
assert.match(read("lib/billing/credit-note-store.ts"), /lockInvoiceCredit\(tx, found\.billerId\)[\s\S]*planCreditNote\([\s\S]*claim\.credited[\s\S]*claim\.total[\s\S]*status: "ISSUING"[\s\S]*internalNumber: `BAMBU-\$\{note\.id\}`/);
// --- El vínculo receptor → trabajo lo confirma una persona: el agente no lo escribe.
for (const file of [...listFiles("lib/agent"), "lib/billing/agent-corrections-read.ts"]) {
  assert.doesNotMatch(read(file), /billingReceiverJob\.(create|upsert|update|delete)/, `${file} writes receiver links`);
}
assert.match(read("app/api/billing/invoices/[id]/pdf/route.ts"), /requireAdminSession\(\)/);
assert.match(read("app/api/cron/billing-sync/route.ts"), /CRON_SECRET[\s\S]*Bearer/);
assert.doesNotMatch(read("app/api/cron/billing-sync/route.ts"), /biller-issue|issue-batch/);

// --- Archivos de hasta 200 líneas.
for (const file of [...listFiles("lib/billing"), ...listFiles("data/billing"), ...listFiles("actions/billing"), ...listFiles("components/billing"), "schemas/billing.ts"]) {
  assert.ok(read(file).split("\n").length <= 201, `${file} has more than 200 lines`);
}
