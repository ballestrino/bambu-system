import "dotenv/config";

import { Prisma, PrismaClient } from "@prisma/client";

import { applyAgentDraft } from "../lib/billing/agent-draft-store";
import { readDraftCardSummary } from "../lib/billing/agent-draft-read";
import { resolveBillerConfig } from "../lib/billing/biller-config";
import { createBillerGet } from "../lib/billing/biller-http";
import { createBillerReader } from "../lib/billing/biller-read";
import { addBillingMonths, parseBillingPeriod } from "../lib/billing/billing-month";
import { claimBatchIssue } from "../lib/billing/issue-claim";

// Smoke de la 42 contra Biller test y la base de .env, sin modelo: lo que hace
// draftInvoices sobre el borrador abierto de un mes (repetir abre el mismo,
// precio, casilla, una factura nueva por RUT), que lo emitido no se toca, que
// un lote en ISSUING se rechaza y que "Emitir" con el updatedAt que vio la
// página antes del cambio del agente se rechaza. No emite. Deja todo como
// estaba salvo con --keep. Uso: pnpm exec tsx scripts/smoke-billing-agent.ts 2026-11 [--keep]
const db = new PrismaClient();
// Un RUT con dígito verificador válido (Biller lo revisa); en test DGI devuelve
// siempre la misma entidad.
const NEW_RUT = "219999990016";

const main = async () => {
  const period = parseBillingPeriod(process.argv[2] ?? "");
  if (!period) throw new Error("Pasá el mes como AAAA-MM");
  const config = resolveBillerConfig({
    BILLER_BASE_URL: process.env.BILLER_BASE_URL,
    BILLER_SUCURSAL: process.env.BILLER_SUCURSAL,
    BILLER_TOKEN: process.env.BILLER_TOKEN,
  });
  if (config.environment !== "test") throw new Error("El smoke corre solo contra Biller test");
  console.log(`Base: ${new URL(process.env.DATABASE_URL ?? "postgres://sin-base").hostname}`);

  const admin = await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) throw new Error("No hay un admin en la base");
  const base = { additions: [], changes: [], conversationId: "smoke-billing-agent", period, userId: admin.id };

  const opened = await applyAgentDraft(db, { ...base, repeat: true });
  console.log("Repetir con un borrador abierto:", opened);
  if (!opened.ok) throw new Error(opened.error);
  const batch = await db.invoiceBatch.findUniqueOrThrow({ where: { id: opened.batchId }, select: { status: true, updatedAt: true } });
  const invoices = await db.invoice.findMany({
    where: { batchId: opened.batchId },
    select: { id: true, items: true, selected: true, status: true, total: true },
  });
  const draft = invoices.find((invoice) => invoice.status === "DRAFT");
  const issued = invoices.find((invoice) => invoice.status !== "DRAFT");
  if (!draft) throw new Error("El borrador no tiene facturas sin emitir");
  const pageUpdatedAt = batch.updatedAt.toISOString();
  console.log("Antes:", await readDraftCardSummary(db, opened.batchId));

  const rutData = await createBillerReader(createBillerGet(config)).lookupRut(NEW_RUT);
  console.log("lookupRut (test devuelve siempre la misma entidad):", rutData);
  const changed = await applyAgentDraft(db, {
    ...base,
    additions: [{ addition: { rut: NEW_RUT, concepto: "Limpieza de prueba del agente", precio: 4321, cantidad: null }, rutData }],
    changes: [{ invoiceId: draft.id, selected: !draft.selected, lines: [{ index: 0, concepto: null, precio: 9876 }] }],
    repeat: false,
  });
  console.log("Cambio del agente:", changed);
  if (!changed.ok) throw new Error(changed.error);
  console.log("Después:", await readDraftCardSummary(db, opened.batchId));

  if (issued) {
    const refused = await applyAgentDraft(db, { ...base, changes: [{ invoiceId: issued.id, selected: false, lines: null }], repeat: false });
    console.log("Cambiar una emitida:", refused);
    if (refused.ok) throw new Error("Se cambió una factura emitida");
  }
  const repeatedAdd = await applyAgentDraft(db, {
    ...base,
    additions: [{ addition: { rut: NEW_RUT, concepto: "Otra", precio: 1, cantidad: null }, rutData }],
    repeat: false,
  });
  console.log("El mismo RUT dos veces:", repeatedAdd);
  if (repeatedAdd.ok) throw new Error("Se sumó dos veces el mismo receptor");

  // "Emitir" con lo que vio la página antes del cambio: se rechaza y relee.
  const marked = await db.invoice.findMany({ where: { batchId: opened.batchId, selected: true, status: "DRAFT" }, select: { total: true } });
  const claim = await claimBatchIssue(
    db,
    { batchId: opened.batchId, count: marked.length, total: marked.reduce((sum, row) => sum + Number(row.total), 0), updatedAt: pageUpdatedAt },
    new Date()
  );
  console.log("Emitir con el updatedAt de antes del agente:", claim);
  if ("ok" in claim) throw new Error("Se tomó un borrador que el agente había cambiado");

  // Un lote que se está emitiendo no se toca.
  const issuingPeriod = addBillingMonths(period, 14);
  const issuing = await db.invoiceBatch.create({ data: { origin: "AGENT", period: issuingPeriod, status: "ISSUING" }, select: { id: true } });
  const blocked = await applyAgentDraft(db, { ...base, period: issuingPeriod, repeat: false, additions: [{ addition: { rut: NEW_RUT, concepto: "X", precio: 1, cantidad: null }, rutData }] });
  console.log("Cambiar un lote en ISSUING:", blocked);
  await db.invoiceBatch.delete({ where: { id: issuing.id } });
  if (blocked.ok) throw new Error("Se cambió un lote en ISSUING");

  if (!process.argv.includes("--keep")) {
    await db.invoice.deleteMany({ where: { batchId: opened.batchId, receiverDocument: NEW_RUT, status: "DRAFT" } });
    await db.invoice.update({
      where: { id: draft.id },
      data: { items: draft.items as Prisma.InputJsonValue, selected: draft.selected, total: draft.total },
    });
    console.log("Restaurado:", await readDraftCardSummary(db, opened.batchId));
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
